(function () {
    const STORAGE_KEY = 'easystore.state.v3';
    const CONNECTION_KEY = 'easystore.connection.v2';

    const DEFAULT_CONNECTION = {
        provider: 'api',
        apiBaseUrl: '',
        storeId: ''
    };

    const DEFAULT_STATE = {
        produtos: [],
        vendas: [],
        notas: [],
        movimentos: [],
        config: {
            nomeLoja: '',
            cnpj: '',
            inscricaoEstadual: '',
            enderecoRua: '',
            enderecoNumero: '',
            enderecoBairro: '',
            enderecoUf: '',
            enderecoCep: '',
            email: '',
            pixChave: '',
            pixCidade: '',
            fiscalPrinterProfile: 'auto',
            fiscalPrinterProfileNfe: 'a4',
            fiscalPrinterProfileNfce: 'thermal80',
            fiscalPrinterNameNfe: '',
            fiscalPrinterNameNfce: '',
            maquininhas: [],
            paymentProvider: '',
            caixa: {
                aberto: false,
                saldoAbertura: 0,
                abertoEm: null,
                fechadoEm: null
            }
        },
        meta: {
            updatedAt: null
        }
    };

    class EasyStoreDatabase {
        constructor() {
            this.state = this.clone(DEFAULT_STATE);
            this.connection = this.loadConnectionConfig();
            this.syncStatus = {
                mode: 'local',
                connected: false,
                message: 'Modo local ativo.',
                lastSyncAt: null
            };
            this.writeQueue = Promise.resolve();
        }

        async init() {
            this.state = this.loadLocalState();
            await this.bootstrapConnection();
            this.applySyncStatus();

            if (!this.isCloudEnabled()) {
                return this.state;
            }

            try {
                const remoteState = await this.fetchRemoteState();

                if (remoteState) {
                    const localUpdatedAt = this.getUpdatedAt(this.state);
                    const remoteUpdatedAt = this.getUpdatedAt(remoteState);

                    if (remoteUpdatedAt >= localUpdatedAt) {
                        this.state = this.normalizeState(remoteState);
                        this.persistLocalState();
                    } else {
                        await this.persistRemoteState();
                    }
                } else {
                    await this.persistRemoteState();
                }

                this.syncStatus.connected = true;
                this.syncStatus.message = 'API em nuvem conectada e sincronizada.';
                this.syncStatus.lastSyncAt = new Date().toISOString();
            } catch (error) {
                console.error('Falha ao inicializar a nuvem:', error);
                this.syncStatus.connected = false;
                this.syncStatus.message = 'Falha ao conectar com a API. O app continua em modo local.';
            }

            this.applySyncStatus();
            return this.state;
        }

        getProdutos() {
            return [...this.state.produtos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        }

        getProduto(id) {
            return this.state.produtos.find((produto) => produto.id === id) || null;
        }

        async addProduto(dados) {
            const categoria = this.normalizeProductCategory(dados.categoria);
            const codigo = this.generateProductCode(categoria);
            const codigoBarras = this.resolveProductBarcode(dados.codigoBarras, codigo);
            const barcodeManualValido = this.isValidBarcode(dados.codigoBarras);
            const produto = {
                id: this.generateId('prod'),
                codigo,
                nome: dados.nome.trim(),
                ncm: this.normalizeNcm(dados.ncm),
                ncmKeywords: this.normalizeKeywords(dados.ncmKeywords),
                codigoBarras,
                barcodeFormat: this.detectBarcodeFormat(codigoBarras),
                barcodeSource: barcodeManualValido ? 'externo' : 'interno',
                categoria,
                preco: Number(dados.preco),
                estoque: Number(dados.estoque),
                minimo: Number(dados.minimo),
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString()
            };

            this.state.produtos.push(produto);
            await this.commit();
            return produto;
        }

        async editProduto(id, dados) {
            const produto = this.getProduto(id);
            if (!produto) {
                throw new Error('Produto nao encontrado.');
            }

            const codigoBarras = this.resolveProductBarcode((dados.codigoBarras ?? produto.codigoBarras), produto.codigo);
            const barcodeManualValido = dados.codigoBarras === undefined
                ? (produto.barcodeSource === 'externo')
                : this.isValidBarcode(dados.codigoBarras);
            Object.assign(produto, {
                ...dados,
                nome: typeof dados.nome === 'string' ? dados.nome.trim() : produto.nome,
                ncm: this.normalizeNcm(dados.ncm ?? produto.ncm),
                ncmKeywords: this.normalizeKeywords(dados.ncmKeywords ?? produto.ncmKeywords),
                categoria: this.normalizeProductCategory(dados.categoria ?? produto.categoria),
                codigoBarras,
                barcodeFormat: this.detectBarcodeFormat(codigoBarras),
                barcodeSource: barcodeManualValido ? 'externo' : 'interno',
                atualizadoEm: new Date().toISOString()
            });

            await this.commit();
            return produto;
        }

        async deleteProduto(id) {
            this.state.produtos = this.state.produtos.filter((produto) => produto.id !== id);
            this.state.movimentos = this.state.movimentos.filter((movimento) => movimento.produtoId !== id);
            await this.commit();
        }

        getVendas() {
            return [...this.state.vendas].sort((a, b) => new Date(b.data) - new Date(a.data));
        }

        async addVenda(dados) {
            const itens = dados.itens.map((item) => ({ ...item }));

            itens.forEach((item) => {
                const produto = this.getProduto(item.id);
                if (!produto) {
                    throw new Error(`Produto da venda nao encontrado: ${item.nome}`);
                }
                if (item.qtd > produto.estoque) {
                    throw new Error(`Estoque insuficiente para ${produto.nome}.`);
                }
            });

            itens.forEach((item) => {
                const produto = this.getProduto(item.id);
                produto.estoque -= item.qtd;
                produto.atualizadoEm = new Date().toISOString();

                this.state.movimentos.push({
                    id: this.generateId('mov'),
                    produtoId: produto.id,
                    tipo: 'saida',
                    qtd: item.qtd,
                    obs: 'Baixa automatica por venda',
                    data: new Date().toISOString()
                });
            });

            const venda = {
                id: this.generateId('ven'),
                itens,
                subtotal: Number(dados.subtotal || dados.total || 0),
                desconto: Number(dados.desconto || 0),
                acrescimo: Number(dados.acrescimo || 0),
                total: Number(dados.total),
                pagamento: dados.pagamento,
                valorRecebido: Number(dados.valorRecebido || 0),
                troco: Number(dados.troco || 0),
                maquininhaId: dados.maquininhaId || '',
                maquininhaNome: dados.maquininhaNome || '',
                paymentTransaction: dados.paymentTransaction ? {
                    providerName: dados.paymentTransaction.providerName || '',
                    providerTransactionId: dados.paymentTransaction.providerTransactionId || '',
                    authorizationCode: dados.paymentTransaction.authorizationCode || '',
                    status: dados.paymentTransaction.status || '',
                    approved: Boolean(dados.paymentTransaction.approved)
                } : null,
                pix: dados.pix ? {
                    chave: dados.pix.chave || '',
                    payload: dados.pix.payload || '',
                    qrCodeUrl: dados.pix.qrCodeUrl || ''
                } : null,
                perfilFiscal: dados.perfilFiscal || 'varejo',
                outroPagamento: (dados.outroPagamento || '').trim(),
                cliente: {
                    nome: (dados.cliente?.nome || '').trim(),
                    documento: this.normalizeDocument(dados.cliente?.documento || '')
                },
                observacao: (dados.observacao || '').trim(),
                data: new Date().toISOString()
            };
            const nota = this.createFiscalNote(venda);
            venda.notaId = nota.id;

            this.state.vendas.push(venda);
            this.state.notas.push(nota);

            await this.commit();
            return { venda, nota };
        }

        getNotas() {
            return [...this.state.notas].sort((a, b) => new Date(b.dataEmissao) - new Date(a.dataEmissao));
        }

        getNota(id) {
            return this.state.notas.find((nota) => nota.id === id) || null;
        }

        async updateNotaStatus(id, status, metadata = null) {
            const nota = this.getNota(id);
            if (!nota) {
                throw new Error('Nota fiscal nao encontrada.');
            }

            nota.status = status;
            if (metadata && typeof metadata === 'object') {
                const allowedFields = [
                    'chaveAcesso',
                    'protocoloAutorizacao',
                    'dataRecebimentoSefaz',
                    'reciboSefaz',
                    'motivoSefaz',
                    'codigoStatusSefaz',
                    'urlConsultaSefaz',
                    'naturezaOperacao',
                    'finalidade',
                    'formaPagamento',
                    'dataVencimento',
                    'instrucoesPagamento',
                    'frete',
                    'seguro',
                    'desconto',
                    'cobrancaPropria',
                    'linhaDigitavel',
                    'clienteEndereco'
                ];
                allowedFields.forEach((field) => {
                    if (metadata[field] !== undefined) {
                        nota[field] = metadata[field];
                    }
                });
            }
            nota.atualizadoEm = new Date().toISOString();
            await this.commit();
            return nota;
        }

        getMovimentos() {
            return [...this.state.movimentos].sort((a, b) => new Date(b.data) - new Date(a.data));
        }

        async addMovimento(dados) {
            const produto = this.getProduto(dados.produtoId);
            if (!produto) {
                throw new Error('Produto nao encontrado para movimentacao.');
            }

            const quantidade = Number(dados.qtd);
            const quantidadeInvalida = !Number.isFinite(quantidade)
                || quantidade < 0
                || (dados.tipo !== 'ajuste' && quantidade === 0);

            if (quantidadeInvalida) {
                throw new Error('Quantidade invalida.');
            }

            if (dados.tipo === 'entrada') {
                produto.estoque += quantidade;
            } else if (dados.tipo === 'saida') {
                produto.estoque = Math.max(0, produto.estoque - quantidade);
            } else if (dados.tipo === 'ajuste') {
                produto.estoque = quantidade;
            }

            produto.atualizadoEm = new Date().toISOString();

            this.state.movimentos.push({
                id: this.generateId('mov'),
                produtoId: dados.produtoId,
                tipo: dados.tipo,
                qtd: quantidade,
                obs: (dados.obs || '').trim(),
                data: new Date().toISOString()
            });

            await this.commit();
        }

        getConfig() {
            return { ...this.state.config };
        }

        async setConfig(config) {
            const nfeProfile = 'a4';
            const legacyProfile = String(config.fiscalPrinterProfile ?? this.state.config.fiscalPrinterProfile ?? '').trim().toLowerCase();
            const nfceProfileRaw = String(
                config.fiscalPrinterProfileNfce
                ?? config.fiscalPrinterProfile
                ?? this.state.config.fiscalPrinterProfileNfce
                ?? legacyProfile
                ?? 'thermal80'
            ).trim().toLowerCase();
            const nfceProfile = ['thermal80', 'thermal58'].includes(nfceProfileRaw) ? nfceProfileRaw : 'thermal80';

            this.state.config = {
                ...this.state.config,
                ...config,
                nomeLoja: (config.nomeLoja ?? this.state.config.nomeLoja ?? '').trim(),
                cnpj: (config.cnpj ?? this.state.config.cnpj ?? '').trim(),
                inscricaoEstadual: (config.inscricaoEstadual ?? this.state.config.inscricaoEstadual ?? '').trim(),
                enderecoRua: (config.enderecoRua ?? this.state.config.enderecoRua ?? '').trim(),
                enderecoNumero: (config.enderecoNumero ?? this.state.config.enderecoNumero ?? '').trim(),
                enderecoBairro: (config.enderecoBairro ?? this.state.config.enderecoBairro ?? '').trim(),
                enderecoUf: (config.enderecoUf ?? this.state.config.enderecoUf ?? '').trim().toUpperCase().slice(0, 2),
                enderecoCep: (config.enderecoCep ?? this.state.config.enderecoCep ?? '').trim(),
                email: (config.email ?? this.state.config.email ?? '').trim(),
                fiscalPrinterProfile: legacyProfile || this.state.config.fiscalPrinterProfile || 'auto',
                fiscalPrinterProfileNfe: nfeProfile,
                fiscalPrinterProfileNfce: nfceProfile,
                fiscalPrinterNameNfe: String(config.fiscalPrinterNameNfe ?? this.state.config.fiscalPrinterNameNfe ?? '').trim(),
                fiscalPrinterNameNfce: String(config.fiscalPrinterNameNfce ?? this.state.config.fiscalPrinterNameNfce ?? '').trim(),
                caixa: config.caixa
                    ? {
                        aberto: Boolean(config.caixa.aberto),
                        saldoAbertura: Number(config.caixa.saldoAbertura || 0),
                        abertoEm: config.caixa.abertoEm || null,
                        fechadoEm: config.caixa.fechadoEm || null
                    }
                    : this.state.config.caixa,
                maquininhas: Array.isArray(config.maquininhas)
                    ? config.maquininhas.map((maquininha) => ({
                        id: maquininha.id || this.generateId('maq'),
                        provider: (maquininha.provider || '').trim(),
                        nome: (maquininha.nome || '').trim(),
                        modelo: (maquininha.modelo || '').trim(),
                        conexao: maquininha.conexao || 'manual',
                        identificador: (maquininha.identificador || '').trim(),
                        endpoint: (maquininha.endpoint || '').trim(),
                        status: maquininha.status || 'disponivel',
                        connectedAt: maquininha.connectedAt || null,
                        connectedDetails: (maquininha.connectedDetails || '').trim(),
                        lastError: (maquininha.lastError || '').trim(),
                        pareadoEm: maquininha.pareadoEm || null
                    }))
                    : this.state.config.maquininhas
            };
            await this.commit();
        }

        getConnectionConfig() {
            return { ...this.connection };
        }

        async setConnectionConfig(config) {
            this.connection = {
                provider: config.provider || 'local',
                apiBaseUrl: this.normalizeApiBaseUrl(config.apiBaseUrl),
                storeId: (config.storeId || '').trim()
            };

            localStorage.setItem(CONNECTION_KEY, JSON.stringify(this.connection));
            this.applySyncStatus();

            if (this.isCloudEnabled()) {
                await this.syncNow();
            }
        }

        async syncNow() {
            if (!this.isCloudEnabled()) {
                this.syncStatus.connected = false;
                this.syncStatus.message = 'API nao configurada. O app segue em modo local.';
                this.applySyncStatus();
                return false;
            }

            try {
                const remoteState = await this.fetchRemoteState();
                const localUpdatedAt = this.getUpdatedAt(this.state);
                const remoteUpdatedAt = this.getUpdatedAt(remoteState);

                if (!remoteState || localUpdatedAt >= remoteUpdatedAt) {
                    await this.persistRemoteState();
                } else {
                    this.state = this.normalizeState(remoteState);
                    this.persistLocalState();
                }

                this.syncStatus.connected = true;
                this.syncStatus.message = 'Sincronizacao concluida com sucesso.';
                this.syncStatus.lastSyncAt = new Date().toISOString();
                this.applySyncStatus();
                return true;
            } catch (error) {
                console.error('Falha ao sincronizar:', error);
                this.syncStatus.connected = false;
                this.syncStatus.message = `Erro na sincronizacao: ${error.message}`;
                this.applySyncStatus();
                throw error;
            }
        }

        getSyncStatus() {
            return { ...this.syncStatus };
        }

        countProdutos() {
            return this.state.produtos.length;
        }

        totalEstoque() {
            return this.state.produtos.reduce((total, produto) => total + Number(produto.estoque || 0), 0);
        }

        totalVendasHoje() {
            const hoje = new Date().toISOString().slice(0, 10);
            return this.state.vendas.reduce((total, venda) => {
                return venda.data && venda.data.startsWith(hoje) ? total + Number(venda.total || 0) : total;
            }, 0);
        }

        produtosBaixoEstoque() {
            return this.getProdutos().filter((produto) => Number(produto.estoque) <= Number(produto.minimo));
        }

        exportar() {
            return JSON.stringify({
                exportedAt: new Date().toISOString(),
                state: this.state,
                connection: {
                    provider: this.connection.provider,
                    apiBaseUrl: this.connection.apiBaseUrl,
                    storeId: this.connection.storeId
                }
            }, null, 2);
        }

        async limpar() {
            this.state = this.clone(DEFAULT_STATE);
            this.touch();
            this.persistLocalState();

            if (this.isCloudEnabled()) {
                await this.persistRemoteState();
            }
        }

        async commit() {
            this.touch();
            this.persistLocalState();

            this.writeQueue = this.writeQueue.then(async () => {
                if (this.isCloudEnabled()) {
                    await this.persistRemoteState();
                    this.syncStatus.connected = true;
                    this.syncStatus.message = 'Dados atualizados localmente e pela API segura.';
                    this.syncStatus.lastSyncAt = new Date().toISOString();
                } else {
                    this.syncStatus.connected = false;
                    this.syncStatus.message = 'Dados salvos localmente.';
                }
                this.applySyncStatus();
            });

            return this.writeQueue;
        }

        touch() {
            this.state.meta.updatedAt = new Date().toISOString();
        }

        loadLocalState() {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return this.clone(DEFAULT_STATE);
            }

            try {
                return this.normalizeState(JSON.parse(raw));
            } catch (error) {
                console.error('Falha ao carregar o estado local:', error);
                return this.clone(DEFAULT_STATE);
            }
        }

        persistLocalState() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }

        loadConnectionConfig() {
            const raw = localStorage.getItem(CONNECTION_KEY);
            if (!raw) {
                return { ...DEFAULT_CONNECTION };
            }

            try {
                const saved = JSON.parse(raw);
                return {
                    provider: saved.provider || 'local',
                    apiBaseUrl: this.normalizeApiBaseUrl(saved.apiBaseUrl),
                    storeId: saved.storeId || ''
                };
            } catch (error) {
                console.error('Falha ao carregar a conexao:', error);
                return { ...DEFAULT_CONNECTION };
            }
        }

        async bootstrapConnection() {
            const configFromServer = await this.fetchRuntimeConfig();
            if (!configFromServer) {
                return;
            }

            const savedConnection = this.connection || { ...DEFAULT_CONNECTION };
            const normalizedConnection = {
                provider: savedConnection.provider || configFromServer.provider || 'api',
                apiBaseUrl: this.normalizeApiBaseUrl(savedConnection.apiBaseUrl || configFromServer.apiBaseUrl),
                storeId: (savedConnection.storeId || configFromServer.storeId || '').trim()
            };

            const shouldUseServerDefaults = normalizedConnection.provider !== 'api'
                || !normalizedConnection.storeId
                || this.looksLikeInvalidApiBaseUrl(normalizedConnection.apiBaseUrl);

            if (shouldUseServerDefaults) {
                this.connection = {
                    provider: configFromServer.provider || 'api',
                    apiBaseUrl: this.normalizeApiBaseUrl(configFromServer.apiBaseUrl),
                    storeId: (configFromServer.storeId || '').trim()
                };
                localStorage.setItem(CONNECTION_KEY, JSON.stringify(this.connection));
                return;
            }

            this.connection = normalizedConnection;
        }

        normalizeState(state) {
            const merged = {
                ...this.clone(DEFAULT_STATE),
                ...state,
                config: {
                    ...DEFAULT_STATE.config,
                    ...(state && state.config ? state.config : {})
                },
                meta: {
                    ...DEFAULT_STATE.meta,
                    ...(state && state.meta ? state.meta : {})
                }
            };

            merged.produtos = Array.isArray(merged.produtos) ? merged.produtos : [];
            merged.vendas = Array.isArray(merged.vendas) ? merged.vendas : [];
            merged.notas = Array.isArray(merged.notas) ? merged.notas : [];
            merged.movimentos = Array.isArray(merged.movimentos) ? merged.movimentos : [];
            merged.config.maquininhas = Array.isArray(merged.config.maquininhas) ? merged.config.maquininhas : [];
            merged.config.caixa = {
                aberto: Boolean(merged.config.caixa?.aberto),
                saldoAbertura: Number(merged.config.caixa?.saldoAbertura || 0),
                abertoEm: merged.config.caixa?.abertoEm || null,
                fechadoEm: merged.config.caixa?.fechadoEm || null
            };
            merged.config.nomeLoja = String(merged.config.nomeLoja || '').trim();
            merged.config.cnpj = String(merged.config.cnpj || '').trim();
            merged.config.inscricaoEstadual = String(merged.config.inscricaoEstadual || '').trim();
            merged.config.enderecoRua = String(merged.config.enderecoRua || '').trim();
            merged.config.enderecoNumero = String(merged.config.enderecoNumero || '').trim();
            merged.config.enderecoBairro = String(merged.config.enderecoBairro || '').trim();
            merged.config.enderecoUf = String(merged.config.enderecoUf || '').trim().toUpperCase().slice(0, 2);
            merged.config.enderecoCep = String(merged.config.enderecoCep || '').trim();
            merged.config.email = String(merged.config.email || '').trim();
            merged.config.fiscalPrinterProfile = String(merged.config.fiscalPrinterProfile || '').trim().toLowerCase();
            const nfceProfileRaw = String(
                merged.config.fiscalPrinterProfileNfce
                || merged.config.fiscalPrinterProfile
                || 'thermal80'
            ).trim().toLowerCase();
            merged.config.fiscalPrinterProfileNfe = 'a4';
            merged.config.fiscalPrinterProfileNfce = ['thermal80', 'thermal58'].includes(nfceProfileRaw) ? nfceProfileRaw : 'thermal80';
            merged.config.fiscalPrinterNameNfe = String(merged.config.fiscalPrinterNameNfe || '').trim();
            merged.config.fiscalPrinterNameNfce = String(merged.config.fiscalPrinterNameNfce || '').trim();
            merged.produtos = merged.produtos.map((produto) => ({
                ...produto,
                categoria: this.normalizeProductCategory(produto.categoria),
                preco: Number(produto.preco || 0),
                estoque: Number(produto.estoque || 0),
                minimo: Math.max(1, Number(produto.minimo || 1)),
                ncm: this.normalizeNcm(produto.ncm),
                ncmKeywords: this.normalizeKeywords(produto.ncmKeywords),
                codigoBarras: this.resolveProductBarcode(produto.codigoBarras, produto.codigo),
                barcodeFormat: this.detectBarcodeFormat(this.resolveProductBarcode(produto.codigoBarras, produto.codigo)),
                barcodeSource: produto.barcodeSource || (produto.codigoBarras ? 'externo' : 'interno')
            }));
            merged.vendas = merged.vendas.map((venda) => ({
                ...venda,
                subtotal: Number(venda.subtotal || venda.total || 0),
                desconto: Number(venda.desconto || 0),
                acrescimo: Number(venda.acrescimo || 0),
                valorRecebido: Number(venda.valorRecebido || 0),
                troco: Number(venda.troco || 0),
                maquininhaId: venda.maquininhaId || '',
                maquininhaNome: venda.maquininhaNome || '',
                paymentTransaction: venda.paymentTransaction ? {
                    providerName: venda.paymentTransaction.providerName || '',
                    providerTransactionId: venda.paymentTransaction.providerTransactionId || '',
                    authorizationCode: venda.paymentTransaction.authorizationCode || '',
                    status: venda.paymentTransaction.status || '',
                    approved: Boolean(venda.paymentTransaction.approved)
                } : null,
                pix: venda.pix ? {
                    chave: venda.pix.chave || '',
                    payload: venda.pix.payload || '',
                    qrCodeUrl: venda.pix.qrCodeUrl || ''
                } : null,
                perfilFiscal: venda.perfilFiscal || 'varejo',
                outroPagamento: (venda.outroPagamento || '').trim(),
                cliente: {
                    nome: (venda.cliente?.nome || '').trim(),
                    documento: this.normalizeDocument(venda.cliente?.documento || '')
                },
                observacao: (venda.observacao || '').trim(),
                notaId: venda.notaId || ''
            }));
            merged.notas = merged.notas.map((nota) => ({
                ...nota,
                numero: Number(nota.numero || 0),
                serie: Number(nota.serie || 1),
                status: nota.status || 'pendente',
                tipo: nota.tipo || 'NFC-e',
                cliente: {
                    nome: (nota.cliente?.nome || '').trim(),
                    documento: this.normalizeDocument(nota.cliente?.documento || '')
                },
                clienteEndereco: String(nota.clienteEndereco || '').trim(),
                naturezaOperacao: String(nota.naturezaOperacao || 'Venda de mercadoria').trim(),
                finalidade: String(nota.finalidade || 'Normal').trim(),
                formaPagamento: String(nota.formaPagamento || nota.pagamento || '').trim(),
                dataVencimento: nota.dataVencimento || nota.dataEmissao || null,
                instrucoesPagamento: String(nota.instrucoesPagamento || '').trim(),
                frete: Number(nota.frete || 0),
                seguro: Number(nota.seguro || 0),
                desconto: Number(nota.desconto || 0),
                chaveAcesso: String(nota.chaveAcesso || '').trim(),
                protocoloAutorizacao: String(nota.protocoloAutorizacao || '').trim(),
                dataRecebimentoSefaz: nota.dataRecebimentoSefaz || null,
                reciboSefaz: String(nota.reciboSefaz || '').trim(),
                motivoSefaz: String(nota.motivoSefaz || '').trim(),
                codigoStatusSefaz: String(nota.codigoStatusSefaz || '').trim(),
                urlConsultaSefaz: String(nota.urlConsultaSefaz || '').trim(),
                cobrancaPropria: Boolean(nota.cobrancaPropria),
                linhaDigitavel: String(nota.linhaDigitavel || '').trim(),
                itens: Array.isArray(nota.itens) ? nota.itens : [],
                observacoes: nota.observacoes || 'Documento gerado localmente para conferencia e impressao.'
            }));
            merged.config.maquininhas = merged.config.maquininhas.map((maquininha) => ({
                id: maquininha.id || this.generateId('maq'),
                provider: (maquininha.provider || '').trim(),
                nome: (maquininha.nome || '').trim(),
                modelo: (maquininha.modelo || '').trim(),
                conexao: maquininha.conexao || 'manual',
                identificador: (maquininha.identificador || '').trim(),
                endpoint: (maquininha.endpoint || '').trim(),
                status: maquininha.status || 'disponivel',
                connectedAt: maquininha.connectedAt || null,
                connectedDetails: (maquininha.connectedDetails || '').trim(),
                lastError: (maquininha.lastError || '').trim(),
                pareadoEm: maquininha.pareadoEm || null
            }));

            return merged;
        }

        clone(value) {
            return JSON.parse(JSON.stringify(value));
        }

        getUpdatedAt(state) {
            if (!state || !state.meta || !state.meta.updatedAt) {
                return 0;
            }
            return new Date(state.meta.updatedAt).getTime();
        }

        generateId(prefix) {
            return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        }

        generateProductCode(category) {
            const map = {
                cosmeticos: 'COS',
                perfumes: 'PER',
                higiene: 'HIG',
                acessorios: 'ACE',
                brinquedos: 'BRI',
                eletronicos: 'ELE',
                animais: 'ANI',
                papelaria: 'PAP',
                outras: 'OUT'
            };
            const prefix = map[this.normalizeProductCategory(category)] || 'PRD';
            const sameCategoryCount = this.state.produtos.filter((produto) => produto.codigo && produto.codigo.startsWith(prefix)).length + 1;
            return `${prefix}${String(sameCategoryCount).padStart(5, '0')}`;
        }

        normalizeProductCategory(value) {
            const normalized = String(value || '').trim().toLowerCase();
            const aliases = {
                alimentos: 'acessorios',
                outros: 'outras',
                outro: 'outras',
                acessorio: 'acessorios',
                eletronico: 'eletronicos',
                brinquedo: 'brinquedos',
                animal: 'animais'
            };
            const mapped = aliases[normalized] || normalized;
            const allowed = new Set([
                'cosmeticos',
                'perfumes',
                'higiene',
                'acessorios',
                'brinquedos',
                'eletronicos',
                'animais',
                'papelaria',
                'outras'
            ]);
            return allowed.has(mapped) ? mapped : 'outras';
        }

        normalizeNcm(value) {
            const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
            if (digits.length !== 8) {
                return '';
            }
            return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
        }

        normalizeKeywords(value) {
            return String(value || '').trim();
        }

        normalizeBarcode(value) {
            return String(value || '')
                .trim()
                .replace(/\D/g, '');
        }

        detectBarcodeFormat(value) {
            const barcode = this.normalizeBarcode(value);
            if (/^\d{13}$/.test(barcode)) {
                return 'EAN-13';
            }
            if (/^\d{8}$/.test(barcode)) {
                return 'EAN-8';
            }
            return 'EAN-13';
        }

        resolveProductBarcode(value, fallbackSeed) {
            const barcode = this.normalizeBarcode(value);
            if (this.isValidBarcode(barcode)) {
                return barcode;
            }
            return this.generateInternalBarcode(fallbackSeed);
        }

        isValidBarcode(value) {
            const barcode = this.normalizeBarcode(value);
            if (!/^\d{8}$|^\d{13}$/.test(barcode)) {
                return false;
            }
            return this.calculateEanChecksum(barcode.slice(0, -1)) === Number(barcode.slice(-1));
        }

        generateInternalBarcode(seed) {
            const body = `200${String(this.hashBarcodeSeed(seed)).padStart(9, '0').slice(0, 9)}`;
            return `${body}${this.calculateEanChecksum(body)}`;
        }

        hashBarcodeSeed(seed) {
            const source = String(seed || '');
            let hash = 0;
            for (let index = 0; index < source.length; index += 1) {
                hash = (hash * 31 + source.charCodeAt(index)) % 1000000000;
            }
            return hash;
        }

        calculateEanChecksum(baseDigits) {
            const digits = this.normalizeBarcode(baseDigits);
            const reversed = digits.split('').reverse();
            const total = reversed.reduce((sum, digit, index) => {
                const multiplier = index % 2 === 0 ? 3 : 1;
                return sum + (Number(digit) * multiplier);
            }, 0);
            return (10 - (total % 10)) % 10;
        }

        normalizeDocument(value) {
            return String(value || '').replace(/\D/g, '').slice(0, 14);
        }

        getNextNotaNumber(tipo) {
            const total = this.state.notas.filter((nota) => nota.tipo === tipo).length + 1;
            return total;
        }

        createFiscalNote(venda) {
            const typeMap = {
                varejo: 'NFC-e',
                atacado: 'NF-e',
                servico: 'NFS-e'
            };
            const tipo = typeMap[venda.perfilFiscal] || 'NFC-e';
            const autoAutorizada = this.shouldAutoAuthorizeFiscalNote(venda);
            const status = autoAutorizada ? 'autorizada' : 'pendente';
            return {
                id: this.generateId('nfs'),
                vendaId: venda.id,
                tipo,
                modelo: tipo === 'NF-e' ? '55' : tipo === 'NFC-e' ? '65' : 'NFS-e',
                numero: this.getNextNotaNumber(tipo),
                serie: 1,
                status,
                dataEmissao: venda.data,
                atualizadoEm: venda.data,
                total: Number(venda.total || 0),
                pagamento: venda.pagamento,
                itens: venda.itens.map((item) => ({ ...item })),
                cliente: {
                    nome: (venda.cliente?.nome || '').trim(),
                    documento: this.normalizeDocument(venda.cliente?.documento || '')
                },
                clienteEndereco: String(venda?.cliente?.endereco || '').trim(),
                naturezaOperacao: String(venda?.naturezaOperacao || 'Venda de mercadoria').trim(),
                finalidade: String(venda?.finalidade || 'Normal').trim(),
                formaPagamento: String(venda?.formaPagamento || venda?.pagamento || '').trim(),
                dataVencimento: venda?.dataVencimento || venda?.data || null,
                instrucoesPagamento: String(venda?.instrucoesPagamento || '').trim(),
                frete: Number(venda?.frete || 0),
                seguro: Number(venda?.seguro || 0),
                desconto: Number(venda?.desconto || 0),
                chaveAcesso: '',
                protocoloAutorizacao: '',
                dataRecebimentoSefaz: null,
                reciboSefaz: '',
                motivoSefaz: '',
                codigoStatusSefaz: '',
                urlConsultaSefaz: '',
                cobrancaPropria: Boolean(venda?.cobrancaPropria),
                linhaDigitavel: String(venda?.linhaDigitavel || '').trim(),
                observacoes: this.buildFiscalNoteObservacoes(tipo, autoAutorizada, venda)
            };
        }

        shouldAutoAuthorizeFiscalNote(venda) {
            if (venda.pagamento === 'pix') {
                return Boolean(venda.pix?.payload || venda.pix?.chave);
            }

            if (venda.pagamento === 'debito' || venda.pagamento === 'credito') {
                return Boolean(venda.paymentTransaction?.approved);
            }

            return false;
        }

        buildFiscalNoteObservacoes(tipo, autoAutorizada, venda) {
            const extras = [];
            if (venda.desconto) {
                extras.push(`Desconto aplicado: ${venda.desconto.toFixed(2)}.`);
            }
            if (venda.acrescimo) {
                extras.push(`Acrescimo aplicado: ${venda.acrescimo.toFixed(2)}.`);
            }
            if (venda.observacao) {
                extras.push(`Observacao da venda: ${venda.observacao}`);
            }

            if (tipo === 'NFS-e') {
                const base = autoAutorizada
                    ? 'Nota de servico marcada automaticamente como autorizada apos confirmacao do pagamento.'
                    : 'Prestacao de servico registrada localmente. Emissao oficial depende do ambiente municipal/nacional da NFS-e.';
                return [base, ...extras].join(' ');
            }

            if (autoAutorizada) {
                if (venda.pagamento === 'pix') {
                    return ['Nota fiscal autorizada automaticamente apos confirmacao do pagamento via PIX.', ...extras].join(' ');
                }

                const provider = venda.paymentTransaction?.providerName || venda.maquininhaNome || 'maquininha';
                return [`Nota fiscal autorizada automaticamente apos aprovacao do pagamento na adquirente ${provider}.`, ...extras].join(' ');
            }

            return ['Documento fiscal auxiliar gerado localmente. A autorizacao oficial depende de integracao com SEFAZ e certificado digital.', ...extras].join(' ');
        }

        normalizeApiBaseUrl(value) {
            if (!value || !value.trim()) {
                return '';
            }
            let normalized = value.trim().replace(/\/+$/, '');
            normalized = normalized.replace(/\/api(?:\/v1)?$/i, '');
            return normalized;
        }

        looksLikeInvalidApiBaseUrl(value) {
            return value.includes('/index.html') || value.includes('/app.js') || value.includes('/database.js');
        }

        getApiBaseUrl() {
            return this.connection.apiBaseUrl || window.location.origin;
        }

        isCloudEnabled() {
            return this.connection.provider === 'api'
                && Boolean(this.connection.storeId);
        }

        applySyncStatus() {
            this.syncStatus.mode = this.isCloudEnabled() ? 'cloud' : 'local';
            if (!this.isCloudEnabled()) {
                this.syncStatus.message = 'Modo local ativo.';
            }
        }

        async fetchRemoteState() {
            const response = await this.request(`/api/state/${encodeURIComponent(this.connection.storeId)}`);
            return response && response.payload ? this.normalizeState(response.payload) : null;
        }

        async persistRemoteState() {
            await this.request(`/api/state/${encodeURIComponent(this.connection.storeId)}`, {
                method: 'PUT',
                body: JSON.stringify({ payload: this.state })
            });
        }

        async request(path, options = {}) {
            const response = await fetch(`${this.getApiBaseUrl()}${path}`, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                body: options.body
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            if (response.status === 204) {
                return null;
            }

            const text = await response.text();
            if (!text) {
                return null;
            }

            return JSON.parse(text);
        }

        async fetchRuntimeConfig() {
            try {
                const origin = window.location.origin;
                if (!origin || origin === 'null') {
                    return null;
                }

                const response = await fetch(`${origin}/api/config`);
                if (!response.ok) {
                    return null;
                }

                const text = await response.text();
                return text ? JSON.parse(text) : null;
            } catch (error) {
                return null;
            }
        }
    }

    window.db = new EasyStoreDatabase();
})();
