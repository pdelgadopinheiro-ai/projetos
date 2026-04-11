class App {
    constructor() {
        this.vendaAtual = [];
        this.prodEditando = null;
        this.ncmSuggestionTimer = null;
        this.latestNcmSuggestionRequest = 0;
        this.ncmSuggestions = [];
        this.scannerStream = null;
        this.scannerDetector = null;
        this.scannerInterval = null;
        this.currentScannedBarcode = null;
        this.lastBarcodeDetectedAt = 0;
        this.scanInputTimer = null;
        this.lastFiscalNoteHtml = '';
        this.lastFiscalNotePrintStyles = '';
        this.moneyFormatter = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        this.dateFormatter = new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
        this.longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        this.cacheElements();
        this.bindEvents();
        this.init();
    }

    cacheElements() {
        this.elements = {
            title: document.getElementById('section-title'),
            date: document.getElementById('current-date'),
            syncBadge: document.getElementById('sync-badge'),
            toastRoot: document.getElementById('toast-root'),
            modal: document.getElementById('modal-prod'),
            modalTitle: document.getElementById('modal-title'),
            formProd: document.getElementById('form-prod'),
            btnValidarNcm: document.getElementById('btn-validar-ncm'),
            prodNome: document.getElementById('prod-nome'),
            prodBarcode: document.getElementById('prod-barcode'),
            prodCat: document.getElementById('prod-cat'),
            prodNcmKeywords: document.getElementById('prod-ncm-keywords'),
            prodNcm: document.getElementById('prod-ncm'),
            prodNcmHelp: document.getElementById('prod-ncm-help'),
            prodNcmSuggestions: document.getElementById('prod-ncm-suggestions'),
            prodNcmValidation: document.getElementById('prod-ncm-validation'),
            searchProd: document.getElementById('search-prod'),
            filterCat: document.getElementById('filter-cat'),
            tbProdutos: document.getElementById('tb-produtos'),
            tbItens: document.getElementById('tb-itens'),
            tbVendas: document.getElementById('tb-vendas'),
            tbMov: document.getElementById('tb-mov'),
            tbBaixo: document.getElementById('tb-baixo'),
            tbVendasDashboard: document.getElementById('tb-vendas-dashboard'),
            tbBaixoDashboard: document.getElementById('tb-baixo-dashboard'),
            relatorioArea: document.getElementById('relatorio-area'),
            selectVenda: document.getElementById('select-venda-prod'),
            vendaQty: document.getElementById('venda-qty'),
            vendaScanInput: document.getElementById('venda-scan-input'),
            btnScanAdd: document.getElementById('btn-scan-add'),
            btnOpenScanner: document.getElementById('btn-open-scanner'),
            btnCloseScanner: document.getElementById('btn-close-scanner'),
            scannerModal: document.getElementById('scanner-modal'),
            scannerVideo: document.getElementById('scanner-video'),
            scannerStatus: document.getElementById('scanner-status'),
            selectMov: document.getElementById('select-mov-prod'),
            cloudStatus: document.getElementById('cloud-status'),
            vendaPerfilFiscal: document.getElementById('venda-perfil-fiscal'),
            vendaPagamento: document.getElementById('venda-pagamento'),
            saleItemCount: document.getElementById('sale-item-count'),
            saleUnitCount: document.getElementById('sale-unit-count'),
            saleStatusText: document.getElementById('sale-status-text'),
            saleAddStatus: document.getElementById('venda-add-status'),
            saleQuickPayButtons: document.querySelectorAll('[data-sale-pay]'),
            vendaMaquininha: document.getElementById('venda-maquininha'),
            moneyFields: document.getElementById('money-fields'),
            cardFields: document.getElementById('card-fields'),
            pixFields: document.getElementById('pix-fields'),
            vendaValorRecebido: document.getElementById('venda-valor-recebido'),
            vendaTroco: document.getElementById('venda-troco'),
            trocoStatus: document.getElementById('troco-status'),
            pixChaveExibicao: document.getElementById('pix-chave-exibicao'),
            pixBeneficiario: document.getElementById('pix-beneficiario'),
            pixQrcodeArea: document.getElementById('pix-qrcode-area'),
            maquininhaStatusVenda: document.getElementById('maquininha-status-venda'),
            cfgPixChave: document.getElementById('cfg-pix-chave'),
            cfgPixCidade: document.getElementById('cfg-pix-cidade'),
            cfgFiscalPrinterProfile: document.getElementById('cfg-fiscal-printer-profile'),
            cfgMaqNome: document.getElementById('cfg-maq-nome'),
            cfgMaqModelo: document.getElementById('cfg-maq-modelo'),
            cfgMaqConexao: document.getElementById('cfg-maq-conexao'),
            tbMaquininhas: document.getElementById('tb-maquininhas'),
            fiscalNoteModal: document.getElementById('fiscal-note-modal'),
            fiscalNoteContent: document.getElementById('fiscal-note-content'),
            btnPrintFiscalNote: document.getElementById('btn-print-fiscal-note'),
            btnCloseFiscalNote: document.getElementById('btn-close-fiscal-note'),
            btnCloseFiscalNoteBottom: document.getElementById('btn-close-fiscal-note-bottom')
        };
    }

    async init() {
        await db.init();
        this.carregarConfig();
        this.atualizarData();
        this.renderCurrentSection();
        this.renderDashboard();
        this.renderSelectVenda();
        this.renderSelectMov();
        this.renderVendas();
        this.renderMovimentos();
        this.renderBaixoEstoque();
        this.renderCloudStatus();
        window.setInterval(() => this.atualizarData(), 60000);
    }

    bindEvents() {
        document.querySelectorAll('.menu-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                this.mostrarSecao(event.currentTarget.dataset.section);
            });
        });

        document.getElementById('btn-novo-prod').addEventListener('click', () => this.abrirModalProd());
        document.getElementById('btn-cancel-prod').addEventListener('click', () => this.fecharModalProd());
        document.querySelector('.close').addEventListener('click', () => this.fecharModalProd());
        this.elements.modal.addEventListener('click', (event) => {
            if (event.target === this.elements.modal) {
                this.fecharModalProd();
            }
        });

        this.elements.formProd.addEventListener('submit', (event) => this.salvarProd(event));
        this.elements.btnValidarNcm.addEventListener('click', () => this.validarNcmManual());
        this.elements.prodNome.addEventListener('input', () => this.scheduleNcmSuggestion());
        this.elements.prodCat.addEventListener('change', () => this.scheduleNcmSuggestion());
        this.elements.prodNcmKeywords.addEventListener('input', () => this.scheduleNcmSuggestion());
        this.elements.prodNcm.addEventListener('input', () => this.handleNcmManualInput());
        this.elements.searchProd.addEventListener('input', () => this.renderProdutosFiltrados());
        this.elements.filterCat.addEventListener('change', () => this.renderProdutosFiltrados());

        document.getElementById('btn-add-item').addEventListener('click', () => this.addItemVenda());
        document.getElementById('btn-finalizar-venda').addEventListener('click', () => this.finalizarVenda());
        document.getElementById('btn-cancelar-venda').addEventListener('click', () => this.cancelarVenda());
        this.elements.vendaPagamento.addEventListener('change', () => this.updatePaymentUI());
        this.elements.selectVenda.addEventListener('change', () => this.updateSaleEntryStatus());
        this.elements.vendaValorRecebido.addEventListener('input', () => this.updateChangePreview());
        this.elements.btnScanAdd.addEventListener('click', () => this.addItemByScan());
        this.elements.btnOpenScanner.addEventListener('click', () => this.openScannerModal());
        this.elements.btnCloseScanner.addEventListener('click', () => this.closeScannerModal());
        this.elements.saleQuickPayButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.setSalePaymentMethod(button.dataset.salePay, { showFeedback: false });
            });
        });
        this.elements.vendaScanInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.addItemByScan({ source: 'scan-input' });
            }
        });
        this.elements.vendaScanInput.addEventListener('input', () => this.handleScanInputAutoAdd());
        document.addEventListener('keydown', (event) => this.handleGlobalShortcuts(event));

        document.getElementById('btn-reg-mov').addEventListener('click', () => this.registrarMov());
        const btnRapido = document.getElementById('btn-rapido');
        if (btnRapido) {
            btnRapido.addEventListener('click', () => this.quickUpdateByCode());
        }

        document.getElementById('btn-rel-prod').addEventListener('click', () => this.relProdutos());
        document.getElementById('btn-rel-vend').addEventListener('click', () => this.relVendas());
        document.getElementById('btn-rel-estq').addEventListener('click', () => this.relEstoque());
        document.getElementById('btn-rel-mov').addEventListener('click', () => this.relMovimento());

        document.getElementById('btn-salvar-cfg').addEventListener('click', () => this.salvarConfig());
        document.getElementById('btn-add-maq').addEventListener('click', () => this.cadastrarMaquininha());
        document.getElementById('btn-parear-maq').addEventListener('click', () => this.parearMaquininhaSelecionada());
        document.getElementById('btn-export').addEventListener('click', () => this.exportarBackup());
        document.getElementById('btn-limpar').addEventListener('click', () => this.limparDados());

        if (this.elements.btnPrintFiscalNote) {
            this.elements.btnPrintFiscalNote.addEventListener('click', () => this.printFiscalNoteFromModal());
        }
        if (this.elements.btnCloseFiscalNote) {
            this.elements.btnCloseFiscalNote.addEventListener('click', () => this.closeFiscalNoteModal());
        }
        if (this.elements.btnCloseFiscalNoteBottom) {
            this.elements.btnCloseFiscalNoteBottom.addEventListener('click', () => this.closeFiscalNoteModal());
        }
        if (this.elements.fiscalNoteModal) {
            this.elements.fiscalNoteModal.addEventListener('click', (event) => {
                if (event.target === this.elements.fiscalNoteModal) {
                    this.closeFiscalNoteModal();
                }
            });
        }

        this.elements.tbProdutos.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-action]');
            if (!actionButton) {
                return;
            }

            const { action, id } = actionButton.dataset;
            if (action === 'edit') {
                this.editarProd(id);
            }
            if (action === 'delete') {
                this.deletarProd(id);
            }
            if (action === 'label') {
                this.gerarEtiquetaProduto(id);
            }
        });

        this.elements.tbItens.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-remove-item]');
            if (!actionButton) {
                return;
            }
            this.removerItemVenda(Number(actionButton.dataset.removeItem));
        });

        this.elements.prodNcmSuggestions.addEventListener('click', (event) => {
            const button = event.target.closest('[data-ncm-suggestion]');
            if (!button) {
                return;
            }

            const suggestion = this.ncmSuggestions[Number(button.dataset.ncmSuggestion)];
            if (!suggestion) {
                return;
            }

            this.applyNcmSuggestion(suggestion);
        });

        this.elements.tbMaquininhas.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-maq-action]');
            if (!actionButton) {
                return;
            }

            const { maqAction, id } = actionButton.dataset;
            if (maqAction === 'parear') {
                this.parearMaquininha(id);
            }
            if (maqAction === 'remover') {
                this.removerMaquininha(id);
            }
        });
    }

    handleNcmManualInput() {
        this.elements.prodNcm.value = this.formatNcmInput(this.elements.prodNcm.value);
        this.elements.prodNcm.dataset.auto = 'false';
        this.hideNcmValidation();
        this.resetNcmButtonState();

        if (!this.elements.prodNcm.value) {
            this.setNcmHelp('A API consulta a base oficial da Receita Federal e tenta sugerir o NCM automaticamente.');
            return;
        }

        this.setNcmHelp(`NCM informado manualmente: ${this.elements.prodNcm.value}. O sistema vai validar a coerência antes de salvar.`);
    }

    scheduleNcmSuggestion() {
        window.clearTimeout(this.ncmSuggestionTimer);
        this.ncmSuggestionTimer = window.setTimeout(() => {
            this.atualizarSugestaoNcm();
        }, 350);
    }

    async atualizarSugestaoNcm() {
        const nome = this.elements.prodNome.value.trim();
        const categoria = this.elements.prodCat.value;
        const keywords = this.elements.prodNcmKeywords.value.trim();
        const currentValue = this.elements.prodNcm.value.trim();
        const canOverwrite = !currentValue || this.elements.prodNcm.dataset.auto === 'true';

        if ((!nome && !keywords) || !categoria) {
            if (canOverwrite) {
                this.elements.prodNcm.value = '';
            }
            this.renderNcmSuggestions([]);
            this.setNcmHelp('A API consulta a base oficial da Receita Federal e tenta sugerir o NCM automaticamente.');
            return;
        }

        const requestId = ++this.latestNcmSuggestionRequest;
        this.setNcmHelp('Consultando a base oficial de NCM da Receita Federal...');

        try {
            const suggestions = await this.buscarNcmOficial(nome, categoria, keywords);
            if (requestId !== this.latestNcmSuggestionRequest) {
                return;
            }

            this.renderNcmSuggestions(suggestions);

            if (!suggestions.length) {
                if (canOverwrite) {
                    this.elements.prodNcm.value = '';
                    this.elements.prodNcm.dataset.auto = 'true';
                }
                this.setNcmHelp('Nenhuma sugestão oficial foi encontrada automaticamente para esse produto. Você pode informar o NCM manualmente.');
                return;
            }

            const suggestion = suggestions[0];
            if (canOverwrite) {
                this.elements.prodNcm.value = suggestion.codigo;
                this.elements.prodNcm.dataset.auto = 'true';
            }

            this.setNcmHelp(`Sugestão oficial: ${suggestion.codigo} - ${suggestion.descricao}. A IA ainda vai conferir a coerência antes do salvamento.`);
        } catch (error) {
            if (requestId !== this.latestNcmSuggestionRequest) {
                return;
            }

            this.renderNcmSuggestions([]);
            this.setNcmHelp('Não foi possível consultar a base oficial agora. Você ainda pode informar o NCM manualmente.');
        }
    }

    async buscarNcmOficial(nome, categoria, keywords = '') {
        const params = new URLSearchParams({
            term: nome,
            category: categoria,
            limit: '5'
        });
        if (keywords) {
            params.set('keywords', keywords);
        }

        try {
            const response = await fetch(`/api/ncm/search?${params.toString()}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Falha na busca de NCM (HTTP ${response.status}).`);
            }

            const data = await response.json();
            return data.items && data.items.length ? data.items : [];
        } catch (error) {
            console.warn('Busca de NCM oficial falhou, usando heurística local:', error);
            return this.getLocalNcmSuggestions(nome, categoria, keywords);
        }
    }

    getLocalNcmSuggestions(nome, categoria, keywords = '') {
        const searchText = [nome, categoria, keywords].join(' ').toLowerCase();
        const database = [
            {
                terms: ['perfume', 'fragrância', 'eau de parfum', 'eau de toilette', 'aroma'],
                codigo: '3303.00.00',
                descricao: 'Perfumes e águas de colônia'
            },
            {
                terms: ['creme', 'hidratante', 'loção', 'emulsão', 'gel'],
                codigo: '3304.99.90',
                descricao: 'Produtos de beleza e cuidados com a pele'
            },
            {
                terms: ['sabonete', 'sabão', 'gel de banho'],
                codigo: '3401.11.00',
                descricao: 'Sabonetes e produtos de higiene pessoal'
            },
            {
                terms: ['shampoo', 'xampu', 'condicionador', 'tônico capilar'],
                codigo: '3305.10.00',
                descricao: 'Produtos para cuidados capilares'
            },
            {
                terms: ['desodorante', 'antitranspirante', 'aerosol'],
                codigo: '3307.20.00',
                descricao: 'Produtos de perfumaria e higiene pessoal'
            },
            {
                terms: ['maquiagem', 'batom', 'base', 'blush', 'rimel'],
                codigo: '3304.20.00',
                descricao: 'Maquiagem e produtos cosméticos'
            }
        ];

        const suggestions = database.filter((item) =>
            item.terms.some((term) => searchText.includes(term))
        ).slice(0, 5).map((item) => ({
            codigo: item.codigo,
            descricao: item.descricao
        }));

        if (!suggestions.length && categoria === 'alimentos') {
            suggestions.push({
                codigo: '2106.90.90',
                descricao: 'Alimentos e condimentos processados'
            });
        }

        return suggestions;
    }

    buildNcmValidationFallback(dados, error) {
        const product = {
            nome: dados.nome.trim(),
            categoria: dados.categoria.trim().toLowerCase(),
            ncm: this.normalizeNcm(dados.ncm),
            descricao: dados.ncmKeywords.trim()
        };
        const suggestions = this.getLocalNcmSuggestions(product.nome, product.categoria, product.descricao);
        const heuristic = suggestions.length
            ? {
                verdict: suggestions[0].codigo.replace(/\D/g, '') === product.ncm.replace(/\D/g, '') ? 'coerente' : 'duvida',
                reason: suggestions[0].codigo.replace(/\D/g, '') === product.ncm.replace(/\D/g, '')
                    ? 'O NCM informado parece coerente com a descrição e categoria local.'
                    : `Sugestão local para este produto: ${suggestions[0].codigo}.`
            }
            : {
                verdict: 'duvida',
                reason: 'Não foi possível validar automaticamente. Revise o NCM manualmente.'
            };

        return {
            product,
            officialNcm: suggestions[0] ? { codigo: suggestions[0].codigo, descricao: suggestions[0].descricao } : null,
            heuristic,
            ai: {
                available: false,
                status: 'fallback',
                reason: `Validação de NCM offline: ${error.message || 'sem detalhes'}`
            },
            finalStatus: heuristic.verdict
        };
    }

    async validarNcmComIa(dados) {
        if (!dados.ncm) {
            return {
                finalStatus: 'duvida',
                heuristic: {
                    verdict: 'duvida',
                    reason: 'Nenhum NCM informado para validar.'
                },
                ai: {
                    available: false,
                    status: 'nao_info',
                    reason: 'Nenhum NCM informado.'
                }
            };
        }

        try {
            const response = await fetch('/api/ncm/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: dados.nome,
                    categoria: dados.categoria,
                    ncm: dados.ncm,
                    descricao: dados.ncmKeywords
                })
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error || `Falha na validação de NCM (HTTP ${response.status}).`);
            }

            return response.json();
        } catch (error) {
            console.warn('Validação de NCM por API falhou, usando heurística local:', error);
            return this.buildNcmValidationFallback(dados, error);
        }
    }

    setNcmHelp(message) {
        this.elements.prodNcmHelp.textContent = message;
    }

    renderNcmSuggestions(items) {
        this.ncmSuggestions = Array.isArray(items) ? items : [];

        if (!this.ncmSuggestions.length) {
            this.elements.prodNcmSuggestions.hidden = true;
            this.elements.prodNcmSuggestions.innerHTML = '';
            return;
        }

        this.elements.prodNcmSuggestions.hidden = false;
        this.elements.prodNcmSuggestions.innerHTML = this.ncmSuggestions.map((item, index) => `
            <button type="button" class="ncm-suggestion-btn" data-ncm-suggestion="${index}">
                <span class="ncm-suggestion-code">${item.codigo}</span>
                <span class="ncm-suggestion-desc">${item.descricaoConcatenada || item.descricao}</span>
            </button>
        `).join('');
    }

    applyNcmSuggestion(suggestion) {
        this.elements.prodNcm.value = suggestion.codigo;
        this.elements.prodNcm.dataset.auto = 'true';
        this.setNcmHelp(`Sugestão oficial selecionada: ${suggestion.codigo} - ${suggestion.descricao}.`);
        this.hideNcmValidation();
        this.resetNcmButtonState();
    }

    showNcmValidation(validacao) {
        const justification = validacao.ai?.justification || validacao.heuristic?.reason || 'Sem justificativa detalhada.';
        const source = validacao.ai?.available
            ? `IA + base oficial`
            : 'Base oficial + regra local';
        const statusClass = validacao.finalStatus === 'coerente'
            ? 'is-ok'
            : validacao.finalStatus === 'incoerente'
                ? 'is-danger'
                : 'is-warning';
        const statusLabel = validacao.finalStatus === 'coerente'
            ? 'Coerente'
            : validacao.finalStatus === 'incoerente'
                ? 'Possível incoerência'
                : 'Revisão recomendada';

        let extra = '';
        if (validacao.ai?.available) {
            extra = ` Confiança da IA: ${Math.round((validacao.ai.confidence || 0) * 100)}%.`;
        } else if (validacao.ai?.status === 'nao_configurado') {
            extra = ' OpenAI não configurada; validação feita com a base oficial e a regra local.';
        } else if (validacao.ai?.reason) {
            extra = ` ${validacao.ai.reason}`;
        }

        this.elements.prodNcmValidation.hidden = false;
        this.elements.prodNcmValidation.className = `ncm-validation ${statusClass}`;
        this.elements.prodNcmValidation.textContent = `${statusLabel}: ${justification}. Fonte: ${source}.${extra}`;
    }

    hideNcmValidation() {
        this.elements.prodNcmValidation.hidden = true;
        this.elements.prodNcmValidation.className = 'ncm-validation';
        this.elements.prodNcmValidation.textContent = '';
    }

    resetNcmButtonState() {
        this.elements.btnValidarNcm.disabled = false;
        this.elements.btnValidarNcm.className = 'btn btn-primary';
        this.elements.btnValidarNcm.textContent = 'Verificar NCM';
    }

    setNcmButtonState(status) {
        if (status === 'coerente') {
            this.elements.btnValidarNcm.className = 'btn btn-success';
            this.elements.btnValidarNcm.textContent = 'NCM Correto';
            return;
        }

        if (status === 'incoerente') {
            this.elements.btnValidarNcm.className = 'btn btn-danger';
            this.elements.btnValidarNcm.textContent = 'NCM Incoerente';
            return;
        }

        if (status === 'duvida') {
            this.elements.btnValidarNcm.className = 'btn btn-warning';
            this.elements.btnValidarNcm.textContent = 'Revisar NCM';
            return;
        }

        this.resetNcmButtonState();
    }

    getDadosProdutoDoFormulario() {
        return {
            nome: document.getElementById('prod-nome').value,
            codigoBarras: this.elements.prodBarcode.value.trim(),
            ncm: this.normalizeNcm(this.elements.prodNcm.value),
            ncmKeywords: this.elements.prodNcmKeywords.value.trim(),
            categoria: document.getElementById('prod-cat').value,
            custo: Number(document.getElementById('prod-custo').value),
            preco: Number(document.getElementById('prod-preco').value),
            estoque: Number(document.getElementById('prod-estoque').value),
            minimo: Number(document.getElementById('prod-minimo').value)
        };
    }

    validarCamposBasicosProduto(dados, { exigirNcm = true } = {}) {
        if (exigirNcm && !dados.ncm) {
            this.mostrarMsg('Informe um NCM valido com 8 digitos para validar.', 'warning');
            return false;
        }

        if (!dados.nome || !dados.categoria || dados.preco < 0 || dados.custo < 0 || dados.estoque < 0 || dados.minimo < 1) {
            this.mostrarMsg('Preencha os campos do produto corretamente.', 'warning');
            return false;
        }

        return true;
    }

    async validarNcmManual() {
        const dados = this.getDadosProdutoDoFormulario();
        if (!this.validarCamposBasicosProduto(dados, { exigirNcm: true })) {
            return;
        }

        this.elements.btnValidarNcm.disabled = true;
        this.elements.btnValidarNcm.className = 'btn btn-primary';
        this.elements.btnValidarNcm.textContent = 'Verificando...';

        try {
            const validacao = await this.validarNcmComIa(dados);
            this.showNcmValidation(validacao);
            this.setNcmButtonState(validacao.finalStatus);

            if (validacao.finalStatus === 'coerente') {
                this.mostrarMsg('NCM validado com sucesso.');
            } else if (validacao.finalStatus === 'duvida') {
                this.mostrarMsg('NCM validado com ressalvas. Revise antes de salvar.', 'warning');
            } else {
                this.mostrarMsg('O NCM parece incoerente com o produto. Revise antes de salvar.', 'warning');
            }
        } catch (error) {
            this.resetNcmButtonState();
            this.mostrarMsg(error.message, 'warning');
        }
    }

    formatNcmInput(value) {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 8);

        if (digits.length <= 4) {
            return digits;
        }
        if (digits.length <= 6) {
            return `${digits.slice(0, 4)}.${digits.slice(4)}`;
        }
        return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
    }

    normalizeNcm(value) {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
        if (digits.length !== 8) {
            return '';
        }
        return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
    }

    mostrarSecao(secao) {
        document.querySelectorAll('.section').forEach((section) => section.classList.remove('active'));
        document.querySelectorAll('.menu-btn').forEach((button) => button.classList.remove('active'));

        document.getElementById(secao).classList.add('active');
        document.querySelector(`[data-section="${secao}"]`).classList.add('active');

        const titulos = {
            dashboard: 'Dashboard',
            produtos: 'Gerenciar Produtos',
            vendas: 'Vendas',
            estoque: 'Movimentação de Estoque',
            relatorios: 'Relatórios',
            config: 'Configurações'
        };
        this.elements.title.textContent = titulos[secao] || 'EasyStore';
        this.renderCurrentSection(secao);
    }

    renderCurrentSection(secao = document.querySelector('.section.active')?.id || 'dashboard') {
        if (secao === 'dashboard') {
            this.renderDashboard();
        }
        if (secao === 'produtos') {
            this.renderProdutosFiltrados();
        }
        if (secao === 'vendas') {
            this.renderSelectVenda();
            this.renderMaquininhas();
            this.updatePaymentUI();
            this.renderItensVenda();
            this.renderVendas();
            window.setTimeout(() => {
                if (this.elements.vendaScanInput) {
                    this.elements.vendaScanInput.focus();
                }
            }, 50);
        }
        if (secao === 'estoque') {
            this.renderSelectMov();
            this.renderBaixoEstoque();
            this.renderMovimentos();
        }
        if (secao === 'config') {
            this.carregarConfig();
            this.renderMaquininhas();
            this.renderCloudStatus();
        }
    }

    atualizarData() {
        this.elements.date.textContent = this.longDateFormatter.format(new Date());
    }

    renderDashboard() {
        document.getElementById('stat-produtos').textContent = db.countProdutos();
        document.getElementById('stat-estoque').textContent = db.totalEstoque();
        document.getElementById('stat-vendas').textContent = this.formatMoney(db.totalVendasHoje());
        document.getElementById('stat-baixo').textContent = db.produtosBaixoEstoque().length;
        this.renderVendasResumo();
        this.renderBaixoResumo();
    }

    renderVendasResumo() {
        const vendas = db.getVendas().slice(0, 5);

        if (!vendas.length) {
            this.elements.tbVendasDashboard.innerHTML = '<tr><td colspan="4" class="empty">Nenhuma venda registrada</td></tr>';
            return;
        }

        this.elements.tbVendasDashboard.innerHTML = vendas.map((venda) => `
            <tr>
                <td>${this.formatDate(venda.data)}</td>
                <td>${venda.itens.length}</td>
                <td>${this.formatMoney(venda.total)}</td>
                <td>${this.getVendaPagamentoLabel(venda)}</td>
            </tr>
        `).join('');
    }

    renderBaixoResumo() {
        const produtos = db.produtosBaixoEstoque().slice(0, 6);

        if (!produtos.length) {
            this.elements.tbBaixoDashboard.innerHTML = '<tr><td colspan="3" class="empty">Tudo em ordem</td></tr>';
            return;
        }

        this.elements.tbBaixoDashboard.innerHTML = produtos.map((produto) => `
            <tr>
                <td>${produto.nome}</td>
                <td><span class="stock-pill danger">${produto.estoque}</span></td>
                <td>${produto.minimo}</td>
            </tr>
        `).join('');
    }

    getProdutosFiltrados() {
        const termo = this.elements.searchProd.value.trim().toLowerCase();
        const categoria = this.elements.filterCat.value;

        return db.getProdutos().filter((produto) => {
            const matchTexto = produto.nome.toLowerCase().includes(termo)
                || produto.codigo.toLowerCase().includes(termo)
                || String(produto.ncm || '').toLowerCase().includes(termo);
            const matchCategoria = !categoria || produto.categoria === categoria;
            return matchTexto && matchCategoria;
        });
    }

    renderProdutosFiltrados() {
        this.renderProdutos(this.getProdutosFiltrados());
    }

    renderProdutos(produtos = db.getProdutos()) {
        if (!produtos.length) {
            this.elements.tbProdutos.innerHTML = '<tr><td colspan="8" class="empty">Nenhum produto encontrado</td></tr>';
            return;
        }

        this.elements.tbProdutos.innerHTML = produtos.map((produto) => `
            <tr>
                <td>${produto.codigo}</td>
                <td>${produto.nome}</td>
                <td>${produto.ncm || '-'}</td>
                <td>${this.capitalize(produto.categoria)}</td>
                <td>${this.formatMoney(produto.custo)}</td>
                <td>${this.formatMoney(produto.preco)}</td>
                <td><span class="stock-pill ${produto.estoque <= produto.minimo ? 'danger' : 'ok'}">${produto.estoque}</span></td>
                <td>
                    <div class="action-row nowrap">
                        <button class="btn btn-primary btn-small" data-action="edit" data-id="${produto.id}">Editar</button>
                        <button class="btn btn-secondary btn-small" data-action="label" data-id="${produto.id}">Etiqueta</button>
                        <button class="btn btn-danger btn-small" data-action="delete" data-id="${produto.id}">Excluir</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    gerarEtiquetaProduto(id) {
        const produto = db.getProduto(id);
        if (!produto) {
            this.mostrarMsg('Produto não encontrado para gerar etiqueta.', 'warning');
            return;
        }

        const codigoBarras = produto.codigoBarras || produto.codigo;
        const codabarValue = this.formatCodabarValue(codigoBarras);
        const codabarSvg = this.buildCodabarSvg(codabarValue, {
            width: 170,
            moduleWidth: 0.8,
            barHeight: 26,
            showText: false
        });

        const labelContent = `
            <div class="label-sheet">
                <article class="product-label">
                    <p class="label-name">${produto.nome}</p>
                    <p class="label-price">${this.formatMoney(produto.preco)}</p>
                    <div class="label-barcode">
                        ${codabarSvg}
                    </div>
                    <p class="label-code">${codabarValue}</p>
                </article>
            </div>
        `;

        const printWindow = window.open('', 'EtiquetaProduto');
        if (!printWindow) {
            this.mostrarMsg('Não foi possível abrir a janela de impressão.', 'warning');
            return;
        }
        const labelPrintStyles = this.getLabelPrintStyles();

        printWindow.document.write(`
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Etiqueta - ${produto.nome}</title>
                    <style>${labelPrintStyles}</style>
                </head>
                <body>
                    ${labelContent}
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    getLabelPrintStyles() {
        return `
            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            html,
            body {
                margin: 0;
                padding: 0;
                background: #fff;
                color: #000;
                font-family: Arial, sans-serif;
            }

            body {
                padding: 3mm;
            }

            .label-sheet {
                display: grid;
                grid-template-columns: repeat(3, 33mm);
                grid-auto-rows: 22mm;
                gap: 1mm;
                width: 101mm;
                align-content: start;
            }

            .product-label {
                width: 33mm;
                height: 22mm;
                border: 0.25mm solid #111;
                padding: 1.1mm 1mm 0.9mm;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                break-inside: avoid;
                page-break-inside: avoid;
            }

            .label-name {
                margin: 0;
                min-height: 4.8mm;
                font-size: 2.2mm;
                line-height: 1.05;
                font-weight: 700;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .label-price {
                margin: 0.5mm 0 0.6mm;
                font-size: 4.4mm;
                line-height: 1;
                font-weight: 800;
            }

            .label-barcode {
                margin-top: auto;
                width: 100%;
                height: 8mm;
                display: flex;
                align-items: flex-end;
                justify-content: center;
            }

            .label-barcode svg {
                display: block;
                width: 100%;
                height: 100%;
            }

            .label-code {
                margin: 0.2mm 0 0;
                text-align: center;
                font-size: 1.9mm;
                line-height: 1;
                letter-spacing: 0.22mm;
                font-family: "Courier New", monospace;
            }

            @media print {
                @page {
                    size: A4 portrait;
                    margin: 4mm;
                }

                body {
                    padding: 0;
                }
            }
        `;
    }

    showFiscalNotePrintout(nota, printWindow = null) {
        const printerProfile = this.getFiscalPrinterProfile();
        const bodyContent = this.buildThermalFiscalNoteMarkup(nota, printerProfile);
        const printStyles = this.getThermalFiscalNotePrintStyles(printerProfile);

        const windowToUse = printWindow || window.open('', `NotaFiscal${nota.id}`);
        if (!windowToUse) {
            this.mostrarMsg('Popup bloqueado. A nota fiscal foi gerada e está disponível para visualização.', 'warning');
            this.showFiscalNoteModal(bodyContent, printStyles);
            return;
        }

        windowToUse.document.write(`
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${nota.tipo} Nº ${nota.numero}</title>
                    <style>${printStyles}</style>
                </head>
                <body>
                    ${bodyContent}
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
                </body>
            </html>
        `);
        windowToUse.document.close();
    }

    normalizeFiscalPrinterProfile(value) {
        const normalized = String(value || '').trim().toLowerCase();
        const allowedProfiles = ['auto', 'thermal80', 'thermal58', 'a4'];
        return allowedProfiles.includes(normalized) ? normalized : 'auto';
    }

    getFiscalPrinterProfile() {
        const config = db.getConfig();
        return this.normalizeFiscalPrinterProfile(config.fiscalPrinterProfile || this.elements.cfgFiscalPrinterProfile?.value);
    }

    getFiscalPrinterLayout(profile = 'auto') {
        const normalized = this.normalizeFiscalPrinterProfile(profile);
        const layouts = {
            auto: {
                pageSize: 'auto',
                pageMargin: '4mm',
                bodyWidth: 'auto',
                bodyMaxWidth: 'none',
                bodyPadding: '0',
                receiptWidth: '100%',
                receiptMaxWidth: '190mm',
                baseFont: '11px',
                lineHeight: '1.25',
                titleFont: '16px',
                itemBottomFont: '10px',
                totalFont: '14px'
            },
            thermal80: {
                pageSize: '80mm auto',
                pageMargin: '0',
                bodyWidth: '80mm',
                bodyMaxWidth: '80mm',
                bodyPadding: '2.5mm',
                receiptWidth: '74mm',
                receiptMaxWidth: '74mm',
                baseFont: '11px',
                lineHeight: '1.25',
                titleFont: '14px',
                itemBottomFont: '10px',
                totalFont: '13px'
            },
            thermal58: {
                pageSize: '58mm auto',
                pageMargin: '0',
                bodyWidth: '58mm',
                bodyMaxWidth: '58mm',
                bodyPadding: '2mm',
                receiptWidth: '54mm',
                receiptMaxWidth: '54mm',
                baseFont: '10px',
                lineHeight: '1.2',
                titleFont: '12px',
                itemBottomFont: '9px',
                totalFont: '12px'
            },
            a4: {
                pageSize: 'A4 portrait',
                pageMargin: '8mm',
                bodyWidth: '210mm',
                bodyMaxWidth: '210mm',
                bodyPadding: '0',
                receiptWidth: '190mm',
                receiptMaxWidth: '190mm',
                baseFont: '12px',
                lineHeight: '1.35',
                titleFont: '18px',
                itemBottomFont: '11px',
                totalFont: '16px'
            }
        };

        return layouts[normalized] || layouts.auto;
    }

    buildThermalFiscalNoteMarkup(nota, printerProfile = 'auto') {
        const layout = this.getFiscalPrinterLayout(printerProfile);
        const config = db.getConfig();
        const lojaNome = (config.nomeLoja || 'EasyStore').trim();
        const documento = (config.cnpj || '').trim() || 'Nao informado';
        const email = (config.email || '').trim() || 'Nao informado';
        const cidade = (config.pixCidade || '').trim() || 'Nao informada';
        const pagamento = this.getVendaPagamentoLabel({ pagamento: nota.pagamento });
        const itensHtml = (nota.itens || []).map((item) => `
            <article class="item-row">
                <div class="item-top">
                    <span class="item-qtd">${item.qtd}x</span>
                    <span class="item-nome">${item.nome}</span>
                </div>
                <div class="item-bottom">
                    <span class="item-unit">${this.formatMoney(item.preco)}</span>
                    <span class="item-subtotal">${this.formatMoney(item.preco * item.qtd)}</span>
                </div>
            </article>
        `).join('');
        return `
            <main class="thermal-receipt">
                <header class="receipt-header">
                    <h1>${lojaNome}</h1>
                    <p class="meta-line">CPF/CNPJ: ${documento}</p>
                    <p class="meta-line">E-mail: ${email}</p>
                    <p class="meta-line">Cidade: ${cidade}</p>
                    <p class="meta-line">${nota.tipo} No ${nota.numero} Serie ${nota.serie}</p>
                    <p class="meta-line">Data: ${this.formatDate(nota.dataEmissao)}</p>
                </header>

                <div class="separator"></div>
                <section class="receipt-items">
                    ${itensHtml}
                </section>

                <div class="separator"></div>
                <section class="receipt-summary">
                    <div class="summary-line">
                        <span>Pagamento</span>
                        <span>${pagamento}</span>
                    </div>
                    <div class="summary-line total">
                        <span>Total</span>
                        <span>${this.formatMoney(nota.total)}</span>
                    </div>
                </section>

                <div class="separator"></div>
                <footer class="receipt-footer">
                    <p>Documento auxiliar de venda.</p>
                </footer>
            </main>
        `;
    }

    getThermalFiscalNotePrintStyles(printerProfile = 'auto') {
        const layout = this.getFiscalPrinterLayout(printerProfile);
        return `
            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            html,
            body {
                margin: 0;
                padding: 0;
                background: #fff;
                color: #000;
            }

            body {
                width: ${layout.bodyWidth};
                max-width: ${layout.bodyMaxWidth};
                padding: ${layout.bodyPadding};
                margin: 0 auto;
                font-family: "Courier New", monospace;
                font-size: ${layout.baseFont};
                line-height: ${layout.lineHeight};
            }

            .thermal-receipt {
                width: ${layout.receiptWidth};
                max-width: ${layout.receiptMaxWidth};
                margin: 0 auto;
            }

            .receipt-header h1 {
                margin: 0 0 1mm;
                font-size: ${layout.titleFont};
                line-height: 1.2;
                text-align: center;
                text-transform: uppercase;
            }

            .meta-line {
                margin: 0 0 0.5mm;
                text-align: center;
            }

            .separator {
                border-top: 1px dashed #000;
                margin: 2mm 0;
            }

            .item-row {
                margin-bottom: 1.4mm;
            }

            .item-top,
            .item-bottom,
            .summary-line {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 8px;
            }

            .item-qtd {
                min-width: 24px;
                font-weight: 700;
            }

            .item-nome {
                flex: 1;
                text-align: left;
                word-break: break-word;
            }

            .item-bottom {
                margin-top: 0.4mm;
                font-size: ${layout.itemBottomFont};
            }

            .summary-line.total {
                margin-top: 1mm;
                font-size: ${layout.totalFont};
                font-weight: 700;
            }

            .obs-title {
                margin: 0 0 0.8mm;
                font-weight: 700;
            }

            .obs-text {
                margin: 0;
                white-space: pre-wrap;
                word-break: break-word;
            }

            .receipt-footer p {
                margin: 0 0 0.6mm;
                text-align: center;
            }

            @media print {
                @page {
                    size: ${layout.pageSize};
                    margin: ${layout.pageMargin};
                }

                html,
                body {
                    width: ${layout.bodyWidth};
                    max-width: ${layout.bodyMaxWidth};
                }
            }
        `;
    }

    showFiscalNoteModal(content, printStyles = '') {
        if (!this.elements.fiscalNoteModal || !this.elements.fiscalNoteContent) {
            return;
        }
        this.lastFiscalNoteHtml = content;
        this.lastFiscalNotePrintStyles = printStyles;
        this.elements.fiscalNoteContent.innerHTML = `
            ${content}
            <div style="margin-top: 16px; font-size: 0.95rem; color: #555;">
                <p>O popup de impressão foi bloqueado. Clique em Imprimir para abrir a nota em uma nova janela.</p>
            </div>
        `;
        this.elements.fiscalNoteModal.classList.add('show');
        this.elements.fiscalNoteModal.setAttribute('aria-hidden', 'false');
    }

    printFiscalNoteFromModal() {
        const content = this.lastFiscalNoteHtml || this.elements.fiscalNoteContent?.innerHTML;
        const printStyles = this.lastFiscalNotePrintStyles || this.getThermalFiscalNotePrintStyles(this.getFiscalPrinterProfile());
        if (!content) {
            return;
        }

        const printWindow = window.open('', 'NotaFiscalPrint');
        if (!printWindow) {
            this.mostrarMsg('Permita popups para imprimir a nota fiscal.', 'warning');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Nota Fiscal</title>
                    <style>${printStyles}</style>
                </head>
                <body>
                    ${content}
                    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    closeFiscalNoteModal() {
        if (!this.elements.fiscalNoteModal) {
            return;
        }
        this.elements.fiscalNoteModal.classList.remove('show');
        this.elements.fiscalNoteModal.setAttribute('aria-hidden', 'true');
        if (this.elements.fiscalNoteContent) {
            this.elements.fiscalNoteContent.innerHTML = '';
        }
        this.lastFiscalNoteHtml = null;
        this.lastFiscalNotePrintStyles = '';
    }

    formatCodabarValue(value) {
        const digits = String(value || '').replace(/\D/g, '');
        if (!digits) {
            return 'A000000000000B';
        }
        return `A${digits}B`;
    }

    buildCodabarSvg(
        code,
        {
            width = 420,
            height = null,
            moduleWidth = 1.8,
            barHeight = 72,
            showText = true,
            textSize = 16,
            textGap = 8
        } = {}
    ) {
        const pattern = this.encodeCodabar(code);
        if (!pattern.length) {
            return '<div style="color:#b00; font-size:14px;">Código Codabar inválido</div>';
        }

        let x = 0;

        const rects = pattern.map((width, index) => {
            const elementWidth = width * moduleWidth;
            const isBar = index % 2 === 0;
            const rect = isBar
                ? `<rect x="${x}" y="0" width="${elementWidth}" height="${barHeight}" fill="#000" />`
                : '';
            x += elementWidth;
            return rect;
        }).join('');

        const quietZone = moduleWidth * 10;
        const totalWidth = Math.max(x + (quietZone * 2), width);
        const startX = (totalWidth - x) / 2;
        const contentHeight = showText ? barHeight + textGap + textSize : barHeight;
        const svgHeight = height || contentHeight;
        const textNode = showText
            ? `<text x="50%" y="${barHeight + textGap + textSize - 2}" text-anchor="middle" font-family="monospace" font-size="${textSize}">${code}</text>`
            : '';

        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${svgHeight}" viewBox="0 0 ${totalWidth} ${contentHeight}">
                <rect width="100%" height="100%" fill="#fff" />
                <g transform="translate(${startX},0)">${rects}</g>
                ${textNode}
            </svg>
        `;
    }

    encodeCodabar(code) {
        const table = {
            '0': '101010011',
            '1': '101011001',
            '2': '101001011',
            '3': '110010101',
            '4': '101101001',
            '5': '110101001',
            '6': '100101011',
            '7': '100101101',
            '8': '100110101',
            '9': '110100101',
            '-': '101001101',
            '$': '101100101',
            ':': '1101011011',
            '/': '110101011',
            '.': '110110101',
            '+': '1011011011',
            'A': '1011001001',
            'B': '1001001011',
            'C': '1010010011',
            'D': '1010011001'
        };

        const characters = String(code || '').toUpperCase().split('');
        const segments = [];

        characters.forEach((char, index) => {
            const pattern = table[char];
            if (!pattern) {
                return;
            }
            segments.push(pattern);
            if (index !== characters.length - 1) {
                segments.push('0');
            }
        });

        return segments.join('').split('').map((digit) => (digit === '0' ? 2 : 1));
    }
    handleScanInputAutoAdd() {
        if (!this.isSectionActive('vendas')) {
            return;
        }

        if (this.scanInputTimer) {
            window.clearTimeout(this.scanInputTimer);
        }

        this.scanInputTimer = window.setTimeout(() => {
            const barcodeValue = this.elements.vendaScanInput.value.trim();
            const normalized = db.normalizeBarcode(barcodeValue);
            if (normalized.length < 6) {
                return;
            }
            this.addItemByScan({ source: 'scan-auto', forceQuantity: 1 });
        }, 140);
    }

    addItemByScan({ source = 'manual', forceQuantity = 1, focusScanInput = true } = {}) {
        const barcode = this.elements.vendaScanInput.value.trim();
        if (!barcode) {
            this.mostrarMsg('Informe o codigo de barras para adicionar o produto.', 'warning');
            return false;
        }

        const produto = this.findProductByBarcode(barcode);
        if (!produto) {
            this.mostrarMsg('Produto nao encontrado para este codigo de barras.', 'warning');
            return false;
        }

        this.elements.selectVenda.value = produto.id;
        const quantidadeInput = document.getElementById('venda-qty');
        const quantidade = Number(forceQuantity);
        quantidadeInput.value = Number.isFinite(quantidade) && quantidade > 0 ? String(Math.floor(quantidade)) : '1';

        const itemAdicionado = this.addItemVenda();
        if (!itemAdicionado) {
            return false;
        }

        this.mostrarMsg(`Scanner: "${produto.nome}" ${this.formatMoney(produto.preco)} adicionado.`, 'success');
        this.updateSaleEntryStatus(`Leitura confirmada: ${produto.nome} | ${this.formatMoney(produto.preco)} adicionado ao carrinho.`);
        this.elements.vendaScanInput.value = '';
        if (focusScanInput && this.isSectionActive('vendas')) {
            this.elements.vendaScanInput.focus();
        }
        return true;
    }

    findProductByBarcode(barcode) {
        const normalized = db.normalizeBarcode(barcode);
        return db.getProdutos().find((produto) => {
            const codigoBarras = db.normalizeBarcode(produto.codigoBarras || produto.codigo);
            return codigoBarras === normalized || produto.codigo.toLowerCase() === barcode.toLowerCase();
        }) || null;
    }

    async openScannerModal() {
        this.elements.scannerModal.classList.add('show');
        this.elements.scannerModal.setAttribute('aria-hidden', 'false');
        this.elements.scannerStatus.textContent = 'Aguardando câmera...';

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.elements.scannerStatus.textContent = 'Seu navegador não suporta acesso à câmera.';
            return;
        }

        try {
            this.scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            this.elements.scannerVideo.srcObject = this.scannerStream;
            await this.elements.scannerVideo.play();
            this.startBarcodeScanner();
        } catch (error) {
            this.elements.scannerStatus.textContent = `Falha ao iniciar câmera: ${error.message}`;
        }
    }

    async startBarcodeScanner() {
        if (!window.BarcodeDetector) {
            this.elements.scannerStatus.textContent = 'Seu navegador não suporta leitura automática de código de barras.';
            return;
        }

        try {
            this.scannerDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8'] });
            this.scannerInterval = window.setInterval(async () => {
                if (!this.elements.scannerVideo || this.elements.scannerVideo.readyState !== 4) {
                    return;
                }

                try {
                    const barcodes = await this.scannerDetector.detect(this.elements.scannerVideo);
                    if (barcodes.length) {
                        this.onBarcodeDetected(barcodes[0].rawValue);
                    }
                } catch (error) {
                    console.warn('Erro na leitura de código de barras:', error);
                }
            }, 600);
            this.elements.scannerStatus.textContent = 'Escaneando... aponte a câmera para o código de barras.';
        } catch (error) {
            this.elements.scannerStatus.textContent = 'Erro ao inicializar o leitor de código de barras.';
        }
    }
    onBarcodeDetected(rawValue) {
        const normalizedValue = String(rawValue || '').trim();
        if (!normalizedValue) {
            return;
        }

        const now = Date.now();
        const duplicateRead = normalizedValue === this.currentScannedBarcode && (now - this.lastBarcodeDetectedAt) < 1200;
        if (duplicateRead) {
            return;
        }

        this.currentScannedBarcode = normalizedValue;
        this.lastBarcodeDetectedAt = now;
        this.elements.vendaScanInput.value = normalizedValue;
        this.elements.scannerStatus.textContent = `Codigo detectado: ${normalizedValue}`;

        const added = this.addItemByScan({ source: 'camera', forceQuantity: 1, focusScanInput: false });
        if (added) {
            this.elements.scannerStatus.textContent = `Item adicionado: ${normalizedValue}. Continue escaneando...`;
        }

        window.setTimeout(() => {
            if (this.currentScannedBarcode === normalizedValue) {
                this.currentScannedBarcode = null;
            }
        }, 1200);
    }

    closeScannerModal() {
        if (this.scannerInterval) {
            window.clearInterval(this.scannerInterval);
            this.scannerInterval = null;
        }

        if (this.scannerStream) {
            this.scannerStream.getTracks().forEach((track) => track.stop());
            this.scannerStream = null;
        }

        if (this.elements.scannerVideo) {
            this.elements.scannerVideo.pause();
            this.elements.scannerVideo.srcObject = null;
        }

        this.elements.scannerModal.classList.remove('show');
        this.elements.scannerModal.setAttribute('aria-hidden', 'true');
        this.elements.scannerStatus.textContent = 'Aguardando permissao da camera.';
        this.currentScannedBarcode = null;
        this.lastBarcodeDetectedAt = 0;
    }

    handleGlobalShortcuts(event) {
        if (event.defaultPrevented) {
            return;
        }

        const target = event.target;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

        const saleSectionActive = this.isSectionActive('vendas');

        if (event.key === 'F10') {
            if (!saleSectionActive) {
                return;
            }
            event.preventDefault();
            this.elements.selectVenda.focus();
            return;
        }

        if (event.key === 'F9') {
            if (!saleSectionActive) {
                return;
            }
            event.preventDefault();
            if (this.elements.vendaQty) {
                this.elements.vendaQty.focus();
                this.elements.vendaQty.select();
            }
            return;
        }

        if (event.altKey && event.key.toLowerCase() === 'p') {
            if (!saleSectionActive) {
                return;
            }
            event.preventDefault();
            this.elements.vendaScanInput.focus();
            return;
        }

        if (event.key === 'F12' || (event.ctrlKey && event.key === 'Enter')) {
            if (this.isSectionActive('vendas')) {
                event.preventDefault();
                this.finalizarVenda();
            }
            return;
        }

        if (event.ctrlKey && event.key === 'Delete') {
            if (this.isSectionActive('vendas')) {
                event.preventDefault();
                this.cancelarVenda();
            }
            return;
        }

        if (event.ctrlKey && event.key === 'Backspace') {
            if (saleSectionActive && !isTyping) {
                event.preventDefault();
                this.removeLastSaleItem();
            }
            return;
        }

        if (event.key === 'F1') {
            if (this.isSectionActive('vendas')) {
                event.preventDefault();
                this.setSalePaymentMethod('dinheiro');
                if (this.elements.vendaValorRecebido) {
                    this.elements.vendaValorRecebido.focus();
                }
            }
            return;
        }

        if (event.key === 'F2') {
            if (this.isSectionActive('vendas')) {
                event.preventDefault();
                this.setSalePaymentMethod('debito');
            }
            return;
        }

        if (event.key === 'F3') {
            if (this.isSectionActive('vendas')) {
                event.preventDefault();
                this.setSalePaymentMethod('credito');
            }
            return;
        }

        if (event.key === 'F4') {
            if (saleSectionActive) {
                event.preventDefault();
                this.setSalePaymentMethod('pix');
            }
            return;
        }

        if (event.key === 'Escape') {
            if (this.elements.modal.classList.contains('show')) {
                this.fecharModalProd();
                event.preventDefault();
                return;
            }
            if (this.elements.scannerModal.classList.contains('show')) {
                this.closeScannerModal();
                event.preventDefault();
                return;
            }
            if (this.isSectionActive('vendas')) {
                this.cancelarVenda();
                event.preventDefault();
            }
            return;
        }
    }

    isSectionActive(sectionId) {
        const section = document.getElementById(sectionId);
        return section ? section.classList.contains('active') : false;
    }

    setSalePaymentMethod(method, { showFeedback = true } = {}) {
        if (!this.elements.vendaPagamento) {
            return;
        }

        this.elements.vendaPagamento.value = method;
        this.updatePaymentUI();
        if (showFeedback) {
            const label = method === 'dinheiro' ? 'Dinheiro' : method === 'pix' ? 'PIX' : method === 'debito' ? 'Débito' : 'Crédito';
            this.mostrarMsg(`Pagamento definido para ${label}.`, 'success');
        }

        if (method === 'dinheiro' && this.elements.vendaValorRecebido) {
            window.setTimeout(() => {
                this.elements.vendaValorRecebido.focus();
            }, 50);
        }
    }

    clearScanStatus() {
        if (this.elements.scannerStatus) {
            this.elements.scannerStatus.textContent = 'Aguardando permissão da câmera.';
        }
    }

    abrirModalProd() {
        this.prodEditando = null;
        this.elements.modalTitle.textContent = 'Novo Produto';
        this.elements.formProd.reset();
        document.getElementById('prod-minimo').value = '10';
        document.getElementById('prod-estoque').value = '0';
        this.elements.prodBarcode.value = '';
        document.getElementById('prod-cod-display').value = 'Será gerado automaticamente';
        this.elements.prodNcm.value = '';
        this.elements.prodNcmKeywords.value = '';
        this.elements.prodNcm.dataset.auto = 'true';
        this.renderNcmSuggestions([]);
        this.hideNcmValidation();
        this.resetNcmButtonState();
        this.setNcmHelp('A API consulta a base oficial da Receita Federal e tenta sugerir o NCM automaticamente.');
        this.elements.modal.classList.add('show');
        this.elements.modal.setAttribute('aria-hidden', 'false');
    }

    editarProd(id) {
        const produto = db.getProduto(id);
        if (!produto) {
            this.mostrarMsg('Produto não encontrado.', 'warning');
            return;
        }

        this.prodEditando = id;
        this.elements.modalTitle.textContent = 'Editar Produto';
        document.getElementById('prod-cod-display').value = produto.codigo;
        document.getElementById('prod-nome').value = produto.nome;
        this.elements.prodBarcode.value = produto.codigoBarras || '';
        document.getElementById('prod-cat').value = produto.categoria;
        this.elements.prodNcmKeywords.value = produto.ncmKeywords || '';
        this.elements.prodNcm.value = produto.ncm || '';
        this.elements.prodNcm.dataset.auto = 'false';
        this.renderNcmSuggestions([]);
        this.hideNcmValidation();
        this.resetNcmButtonState();
        document.getElementById('prod-custo').value = produto.custo;
        document.getElementById('prod-preco').value = produto.preco;
        document.getElementById('prod-estoque').value = produto.estoque;
        document.getElementById('prod-minimo').value = produto.minimo;
        this.setNcmHelp(produto.ncm
            ? `NCM atual: ${produto.ncm}. O sistema vai validar a coerência antes de salvar.`
            : 'Produto sem NCM salvo. A API vai tentar sugerir um código oficial.');
        this.elements.modal.classList.add('show');
        this.elements.modal.setAttribute('aria-hidden', 'false');
    }

    fecharModalProd() {
        this.elements.modal.classList.remove('show');
        this.elements.modal.setAttribute('aria-hidden', 'true');
    }

    async salvarProd(event) {
        event.preventDefault();

        const dados = this.getDadosProdutoDoFormulario();

        if (!this.validarCamposBasicosProduto(dados, { exigirNcm: false })) {
            return;
        }

        let validacao = null;
        if (dados.ncm) {
            try {
                validacao = await this.validarNcmComIa(dados);
                this.showNcmValidation(validacao);

                if (validacao.finalStatus === 'incoerente') {
                    const justificativa = validacao.ai?.justification || validacao.heuristic?.reason || 'A validação apontou incoerência.';
                    const continuar = window.confirm(`A validação do NCM encontrou possível incoerência:\n\n${justificativa}\n\nDeseja salvar mesmo assim?`);
                    if (!continuar) {
                        return;
                    }
                } else if (validacao.finalStatus === 'duvida') {
                    const justificativa = validacao.ai?.justification || validacao.heuristic?.reason || 'A validação pede revisão manual.';
                    this.mostrarMsg(`Revise este NCM: ${justificativa}`, 'warning');
                }
            } catch (error) {
                this.mostrarMsg('Não foi possível validar o NCM agora. O produto será salvo sem validação adicional.', 'warning');
            }
        } else {
            this.setNcmHelp('Produto será salvo sem NCM. Preencha o campo para validação manual mais tarde.');
        }

        try {
            if (this.prodEditando) {
                await db.editProduto(this.prodEditando, dados);
                this.mostrarMsg('Produto atualizado com sucesso.');
            } else {
                await db.addProduto(dados);
                this.mostrarMsg('Produto criado com sucesso.');
            }

            this.fecharModalProd();
            this.refreshDataViews();
        } catch (error) {
            this.mostrarMsg(error.message, 'warning');
        }
    }

    async deletarProd(id) {
        if (!window.confirm('Deseja realmente excluir este produto?')) {
            return;
        }

        try {
            await db.deleteProduto(id);
            this.mostrarMsg('Produto excluído.');
            this.refreshDataViews();
        } catch (error) {
            this.mostrarMsg(error.message, 'warning');
        }
    }

    renderSelectVenda() {
        const produtos = db.getProdutos();
        this.elements.selectVenda.innerHTML = '<option value="">Selecione...</option>';

        produtos.forEach((produto) => {
            const option = document.createElement('option');
            option.value = produto.id;
            option.textContent = `${produto.nome} | Est: ${produto.estoque} | ${this.formatMoney(produto.preco)}`;
            this.elements.selectVenda.appendChild(option);
        });
        this.updateSaleEntryStatus();
    }
    addItemVenda() {
        const produtoId = this.elements.selectVenda.value;
        const quantidade = Number(document.getElementById('venda-qty').value);

        if (!produtoId || quantidade <= 0) {
            this.mostrarMsg('Selecione um produto e informe uma quantidade valida.', 'warning');
            this.updateSaleEntryStatus('Selecione um produto e informe uma quantidade valida para seguir.');
            return false;
        }

        const produto = db.getProduto(produtoId);
        if (!produto) {
            this.mostrarMsg('Produto nao encontrado.', 'warning');
            this.updateSaleEntryStatus('Produto nao encontrado. Revise o cadastro antes de vender.');
            return false;
        }

        const itemExistente = this.vendaAtual.find((item) => item.id === produtoId);
        const quantidadeAtual = itemExistente ? itemExistente.qtd : 0;

        if (quantidade + quantidadeAtual > produto.estoque) {
            this.mostrarMsg('Estoque insuficiente para esta venda.', 'warning');
            this.updateSaleEntryStatus(`Estoque insuficiente para ${produto.nome}.`);
            return false;
        }

        if (itemExistente) {
            itemExistente.qtd += quantidade;
        } else {
            this.vendaAtual.push({
                id: produto.id,
                nome: produto.nome,
                qtd: quantidade,
                preco: produto.preco
            });
        }

        this.renderItensVenda();
        this.elements.selectVenda.value = '';
        document.getElementById('venda-qty').value = '1';
        this.updateSaleEntryStatus(`Item adicionado: ${produto.nome} x${quantidade}.`);
        return true;
    }

    renderItensVenda() {
        const total = this.getSaleTotal();

        if (!this.vendaAtual.length) {
            this.elements.tbItens.innerHTML = '<tr><td colspan="5" class="empty">Nenhum item</td></tr>';
            document.getElementById('venda-total').textContent = this.formatMoney(0);
            this.updateSaleKpis(0);
            this.updateChangePreview();
            this.updatePixPreview();
            return;
        }

        this.elements.tbItens.innerHTML = this.vendaAtual.map((item, index) => {
            const subtotal = item.preco * item.qtd;

            return `
                <tr>
                    <td>${item.nome}</td>
                    <td>${item.qtd}</td>
                    <td>${this.formatMoney(item.preco)}</td>
                    <td>${this.formatMoney(subtotal)}</td>
                    <td><button class="btn btn-danger btn-small" data-remove-item="${index}">Remover</button></td>
                </tr>
            `;
        }).join('');

        document.getElementById('venda-total').textContent = this.formatMoney(total);
        this.updateSaleKpis(total);
        this.updateChangePreview();
        this.updatePixPreview();
    }

    getSaleTotal() {
        return this.vendaAtual.reduce((soma, item) => soma + (item.qtd * item.preco), 0);
    }

    updateSaleEntryStatus(message = '') {
        if (!this.elements.saleAddStatus) {
            return;
        }

        if (message) {
            this.elements.saleAddStatus.textContent = message;
            return;
        }

        const produtoId = this.elements.selectVenda.value;
        if (!produtoId) {
            this.elements.saleAddStatus.textContent = 'Caixa pronto para leitura. Se preferir, use o leitor para incluir produtos rapidamente.';
            return;
        }

        const produto = db.getProduto(produtoId);
        if (!produto) {
            this.elements.saleAddStatus.textContent = 'Produto selecionado não foi encontrado no cadastro.';
            return;
        }

        const disponibilidade = produto.estoque > 0 ? `${produto.estoque} em estoque` : 'sem estoque';
        this.elements.saleAddStatus.textContent = `Selecionado: ${produto.nome} | ${this.formatMoney(produto.preco)} | ${disponibilidade}.`;
    }

    updateSaleKpis(total) {
        const itens = this.vendaAtual.length;
        const unidades = this.vendaAtual.reduce((soma, item) => soma + item.qtd, 0);

        if (this.elements.saleItemCount) {
            this.elements.saleItemCount.textContent = String(itens);
        }
        if (this.elements.saleUnitCount) {
            this.elements.saleUnitCount.textContent = String(unidades);
        }
        if (this.elements.saleStatusText) {
            if (!itens) {
                this.elements.saleStatusText.textContent = 'Nenhum item no carrinho.';
                return;
            }
            const itensLabel = itens === 1 ? 'item' : 'itens';
            const unidadesLabel = unidades === 1 ? 'unidade' : 'unidades';
            this.elements.saleStatusText.textContent = `${itens} ${itensLabel} | ${unidades} ${unidadesLabel} | Ticket atual ${this.formatMoney(total)}.`;
        }
    }

    removerItemVenda(index) {
        this.vendaAtual.splice(index, 1);
        this.renderItensVenda();
    }

    removeLastSaleItem() {
        if (!this.vendaAtual.length) {
            this.mostrarMsg('Não há itens no carrinho para remover.', 'warning');
            return;
        }

        const removido = this.vendaAtual.pop();
        this.renderItensVenda();
        this.updateSaleEntryStatus(`Último item removido: ${removido.nome}.`);
        this.mostrarMsg(`Item "${removido.nome}" removido da venda.`, 'success');
    }

    async finalizarVenda() {
        if (!this.vendaAtual.length) {
            this.mostrarMsg('Adicione pelo menos um item a venda.', 'warning');
            return;
        }

        try {
            const total = this.getSaleTotal();
            const pagamento = this.elements.vendaPagamento.value;
            const valorRecebido = Number(this.elements.vendaValorRecebido.value || 0);
            const troco = Math.max(0, valorRecebido - total);
            const config = db.getConfig();
            const maquininha = pagamento === 'debito' || pagamento === 'credito'
                ? (config.maquininhas || []).find((item) => item.id === this.elements.vendaMaquininha.value)
                : null;

            if ((pagamento === 'debito' || pagamento === 'credito') && !maquininha) {
                this.mostrarMsg('Selecione uma maquininha para pagamentos com cartao.', 'warning');
                return;
            }

            if (pagamento === 'dinheiro' && valorRecebido < total) {
                this.mostrarMsg('O valor recebido precisa ser igual ou maior que o total para calcular o troco.', 'warning');
                return;
            }

            let pix = null;
            if (pagamento === 'pix') {
                if (!config.pixChave) {
                    this.mostrarMsg('Cadastre a chave PIX da loja nas configuracoes.', 'warning');
                    return;
                }
                pix = this.buildPixPayment(config, total);
            }

            const perfilFiscal = this.elements.vendaPerfilFiscal ? this.elements.vendaPerfilFiscal.value : 'varejo';
            const notaWindow = window.open('', 'NotaFiscal');
            if (!notaWindow) {
                this.mostrarMsg('Permita popups para imprimir a nota fiscal.', 'warning');
            }

            const { venda, nota } = await db.addVenda({
                itens: this.vendaAtual,
                total,
                pagamento,
                valorRecebido: pagamento === 'dinheiro' ? valorRecebido : 0,
                troco: pagamento === 'dinheiro' ? troco : 0,
                maquininhaId: maquininha ? maquininha.id : '',
                maquininhaNome: maquininha ? maquininha.nome : '',
                pix,
                perfilFiscal,
            });

            this.mostrarMsg(`Venda registrada com sucesso. ${nota.tipo} nº ${nota.numero} gerada.`, 'success');
            this.showFiscalNotePrintout(nota, notaWindow);
            this.cancelarVenda({ fromFinalize: true });
            this.refreshDataViews();
        } catch (error) {
            this.mostrarMsg(error.message, 'warning');
        }
    }

    cancelarVenda({ fromFinalize = false } = {}) {
        this.vendaAtual = [];
        this.elements.vendaPagamento.value = 'dinheiro';
        if (this.elements.vendaPerfilFiscal) {
            this.elements.vendaPerfilFiscal.value = 'varejo';
        }
        this.elements.vendaValorRecebido.value = '';
        this.elements.vendaMaquininha.value = '';
        this.renderItensVenda();
        this.updateSaleEntryStatus(fromFinalize
            ? 'Venda concluida. Caixa pronto para iniciar uma nova compra.'
            : 'Venda cancelada. Caixa pronto para iniciar uma nova compra.');
        this.updatePaymentUI();
    }

    renderVendas() {
        const vendas = db.getVendas().slice(0, 10);

        if (!vendas.length) {
            this.elements.tbVendas.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma venda registrada</td></tr>';
            return;
        }

        this.elements.tbVendas.innerHTML = vendas.map((venda) => `
            <tr>
                <td>${this.formatDate(venda.data)}</td>
                <td>${venda.itens.length}</td>
                <td>${this.formatMoney(venda.total)}</td>
                <td>${this.getVendaPagamentoLabel(venda)}</td>
                <td>${this.getVendaDetalhes(venda)}</td>
            </tr>
        `).join('');
    }

    renderSelectMov() {
        const produtos = db.getProdutos();
        this.elements.selectMov.innerHTML = '<option value="">Selecione...</option>';

        produtos.forEach((produto) => {
            const option = document.createElement('option');
            option.value = produto.id;
            option.textContent = `${produto.nome} | Est: ${produto.estoque}`;
            this.elements.selectMov.appendChild(option);
        });
    }

    async registrarMov() {
        const produtoId = this.elements.selectMov.value;
        const tipo = document.getElementById('mov-tipo').value;
        const qtd = Number(document.getElementById('mov-qty').value);
        const obs = document.getElementById('mov-obs').value;
        const quantidadeInvalida = Number.isNaN(qtd) || qtd < 0 || (tipo !== 'ajuste' && qtd === 0);

        if (!produtoId || quantidadeInvalida) {
            this.mostrarMsg('Preencha o produto e a quantidade corretamente.', 'warning');
            return;
        }

        try {
            await db.addMovimento({ produtoId, tipo, qtd, obs });
            this.mostrarMsg('Movimentação registrada.');
            document.getElementById('mov-tipo').value = 'entrada';
            document.getElementById('mov-qty').value = '1';
            document.getElementById('mov-obs').value = '';
            this.elements.selectMov.value = '';
            this.refreshDataViews();
        } catch (error) {
            this.mostrarMsg(error.message, 'warning');
        }
    }

    async quickUpdateByCode() {
        const codigo = document.getElementById('codigo-rapido').value.trim().toLowerCase();
        const qtd = Number(document.getElementById('qty-rapido').value);
        const tipo = document.getElementById('tipo-rapido').value;
        const produto = db.getProdutos().find((item) => item.codigo.toLowerCase() === codigo);

        if (!codigo || Number.isNaN(qtd) || qtd < 0) {
            this.mostrarMsg('Informe um código e uma quantidade válidos.', 'warning');
            return;
        }

        if (!produto) {
            this.mostrarMsg('Produto não encontrado para o código informado.', 'warning');
            return;
        }

        try {
            await db.addMovimento({
                produtoId: produto.id,
                tipo,
                qtd,
                obs: 'Atualização rápida por código'
            });

            this.mostrarMsg(`Estoque atualizado para ${produto.nome}.`);
            document.getElementById('codigo-rapido').value = '';
            document.getElementById('qty-rapido').value = '1';
            this.refreshDataViews();
        } catch (error) {
            this.mostrarMsg(error.message, 'warning');
        }
    }

    renderBaixoEstoque() {
        const produtos = db.produtosBaixoEstoque();

        if (!produtos.length) {
            this.elements.tbBaixo.innerHTML = '<tr><td colspan="3" class="empty">Tudo em ordem</td></tr>';
            return;
        }

        this.elements.tbBaixo.innerHTML = produtos.map((produto) => `
            <tr>
                <td>${produto.nome}</td>
                <td><span class="stock-pill danger">${produto.estoque}</span></td>
                <td>${produto.minimo}</td>
            </tr>
        `).join('');
    }

    renderMovimentos() {
        const movimentos = db.getMovimentos().slice(0, 20);

        if (!movimentos.length) {
            this.elements.tbMov.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma movimentação registrada</td></tr>';
            return;
        }

        this.elements.tbMov.innerHTML = movimentos.map((movimento) => {
            const produto = db.getProduto(movimento.produtoId);
            return `
                <tr>
                    <td>${this.formatDate(movimento.data)}</td>
                    <td>${produto ? produto.nome : 'Produto removido'}</td>
                    <td>${this.capitalize(movimento.tipo)}</td>
                    <td>${movimento.qtd}</td>
                    <td>${movimento.obs || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    relProdutos() {
        const produtos = db.getProdutos();
        const totalEstoque = produtos.reduce((acc, produto) => acc + (produto.preco * produto.estoque), 0);

        this.elements.relatorioArea.innerHTML = `
            <h3>Relatório de Produtos</h3>
            <p>Gerado em ${this.formatDate(new Date().toISOString())}</p>
            ${this.buildReportTable(
                ['Código', 'Nome', 'NCM', 'Categoria', 'Preço', 'Estoque', 'Total'],
                produtos.map((produto) => [
                    produto.codigo,
                    produto.nome,
                    produto.ncm || '-',
                    this.capitalize(produto.categoria),
                    this.formatMoney(produto.preco),
                    produto.estoque,
                    this.formatMoney(produto.preco * produto.estoque)
                ])
            )}
            <p class="report-summary">Valor potencial em estoque: <strong>${this.formatMoney(totalEstoque)}</strong></p>
        `;
    }

    relVendas() {
        const vendas = db.getVendas();
        const total = vendas.reduce((soma, venda) => soma + venda.total, 0);
        const trocoTotal = vendas.reduce((soma, venda) => soma + Number(venda.troco || 0), 0);

        this.elements.relatorioArea.innerHTML = `
            <h3>Relatório de Vendas</h3>
            <p>Gerado em ${this.formatDate(new Date().toISOString())}</p>
            ${this.buildReportTable(
                ['Data', 'Itens', 'Total', 'Pagamento', 'Detalhes'],
                vendas.map((venda) => [
                    this.formatDate(venda.data),
                    venda.itens.length,
                    this.formatMoney(venda.total),
                    this.getVendaPagamentoLabel(venda),
                    this.getVendaDetalhes(venda)
                ])
            )}
            <p class="report-summary">Total vendido: <strong>${this.formatMoney(total)}</strong></p>
            <p class="report-summary">Troco entregue em dinheiro: <strong>${this.formatMoney(trocoTotal)}</strong></p>
        `;
    }

    relEstoque() {
        const produtos = db.getProdutos();

        this.elements.relatorioArea.innerHTML = `
            <h3>Relatório de Estoque</h3>
            <p>Gerado em ${this.formatDate(new Date().toISOString())}</p>
            ${this.buildReportTable(
                ['Código', 'Nome', 'NCM', 'Estoque', 'Mínimo', 'Custo', 'Preço', 'Margem'],
                produtos.map((produto) => {
                    const margem = produto.preco > 0 ? (((produto.preco - produto.custo) / produto.preco) * 100).toFixed(1) : '0.0';
                    return [
                        produto.codigo,
                        produto.nome,
                        produto.ncm || '-',
                        produto.estoque,
                        produto.minimo,
                        this.formatMoney(produto.custo),
                        this.formatMoney(produto.preco),
                        `${margem}%`
                    ];
                })
            )}
        `;
    }

    relMovimento() {
        const movimentos = db.getMovimentos();

        this.elements.relatorioArea.innerHTML = `
            <h3>Relatório de Movimentações</h3>
            <p>Gerado em ${this.formatDate(new Date().toISOString())}</p>
            ${this.buildReportTable(
                ['Data', 'Produto', 'Tipo', 'Quantidade', 'Observação'],
                movimentos.map((movimento) => {
                    const produto = db.getProduto(movimento.produtoId);
                    return [
                        this.formatDate(movimento.data),
                        produto ? produto.nome : 'Produto removido',
                        this.capitalize(movimento.tipo),
                        movimento.qtd,
                        movimento.obs || '-'
                    ];
                })
            )}
        `;
    }

    buildReportTable(headers, rows) {
        if (!rows.length) {
            return '<p class="empty">Nenhum dado disponível para este relatório.</p>';
        }

        const thead = headers.map((header) => `<th>${header}</th>`).join('');
        const tbody = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');

        return `<div class="table-wrap"><table class="table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
    }

    carregarConfig() {
        const config = db.getConfig();

        document.getElementById('cfg-nome').value = config.nomeLoja || '';
        document.getElementById('cfg-cnpj').value = config.cnpj || '';
        document.getElementById('cfg-email').value = config.email || '';
        this.elements.cfgPixChave.value = config.pixChave || '';
        this.elements.cfgPixCidade.value = config.pixCidade || '';
        if (this.elements.cfgFiscalPrinterProfile) {
            this.elements.cfgFiscalPrinterProfile.value = this.normalizeFiscalPrinterProfile(config.fiscalPrinterProfile);
        }
        this.renderMaquininhas();
        this.updatePaymentUI();
    }

    async salvarConfig() {
        try {
            await db.setConfig({
                nomeLoja: document.getElementById('cfg-nome').value,
                cnpj: document.getElementById('cfg-cnpj').value,
                email: document.getElementById('cfg-email').value,
                pixChave: this.elements.cfgPixChave.value,
                pixCidade: this.elements.cfgPixCidade.value,
                fiscalPrinterProfile: this.normalizeFiscalPrinterProfile(this.elements.cfgFiscalPrinterProfile?.value),
                maquininhas: db.getConfig().maquininhas || []
            });
            this.mostrarMsg('Informacoes da loja salvas.');
            this.renderMaquininhas();
            this.updatePaymentUI();
            this.renderCloudStatus();
        } catch (error) {
            this.mostrarMsg(error.message, 'warning');
        }
    }

    async cadastrarMaquininha() {
        const config = db.getConfig();
        const nome = this.elements.cfgMaqNome.value.trim();
        const modelo = this.elements.cfgMaqModelo.value.trim();
        const conexao = this.elements.cfgMaqConexao.value;

        if (!nome || !modelo) {
            this.mostrarMsg('Informe nome e modelo da maquininha.', 'warning');
            return;
        }

        const maquininhas = [...(config.maquininhas || []), {
            id: `maq_${Date.now()}`,
            nome,
            modelo,
            conexao,
            status: 'disponivel',
            pareadoEm: null
        }];

        await db.setConfig({ maquininhas });
        this.elements.cfgMaqNome.value = '';
        this.elements.cfgMaqModelo.value = '';
        this.elements.cfgMaqConexao.value = 'bluetooth';
        this.renderMaquininhas();
        this.updatePaymentUI();
        this.mostrarMsg('Maquininha cadastrada.');
    }

    async parearMaquininhaSelecionada() {
        const config = db.getConfig();
        const alvo = this.elements.vendaMaquininha.value || config.maquininhas?.[0]?.id;
        if (!alvo) {
            this.mostrarMsg('Cadastre uma maquininha antes de tentar parear.', 'warning');
            return;
        }
        await this.parearMaquininha(alvo);
    }

    async parearMaquininha(id) {
        const config = db.getConfig();
        const maquininhas = (config.maquininhas || []).map((maquininha) => ({
            ...maquininha,
            status: maquininha.id === id ? 'pareada' : (maquininha.status || 'disponivel'),
            pareadoEm: maquininha.id === id ? new Date().toISOString() : maquininha.pareadoEm || null
        }));

        await db.setConfig({ maquininhas });
        this.renderMaquininhas();
        this.updatePaymentUI();
        this.mostrarMsg('Maquininha pareada no sistema.');
    }

    async removerMaquininha(id) {
        const config = db.getConfig();
        const maquininhas = (config.maquininhas || []).filter((maquininha) => maquininha.id !== id);
        await db.setConfig({ maquininhas });
        if (this.elements.vendaMaquininha.value === id) {
            this.elements.vendaMaquininha.value = '';
        }
        this.renderMaquininhas();
        this.updatePaymentUI();
        this.mostrarMsg('Maquininha removida.');
    }

    renderMaquininhas() {
        const config = db.getConfig();
        const maquininhas = config.maquininhas || [];
        const selecionadaAtual = this.elements.vendaMaquininha.value;

        this.elements.vendaMaquininha.innerHTML = '<option value="">Selecione a maquininha</option>';
        maquininhas.forEach((maquininha) => {
            const option = document.createElement('option');
            option.value = maquininha.id;
            option.textContent = `${maquininha.nome} | ${maquininha.modelo} | ${this.capitalize(maquininha.conexao)}`;
            this.elements.vendaMaquininha.appendChild(option);
        });
        this.elements.vendaMaquininha.value = maquininhas.some((item) => item.id === selecionadaAtual) ? selecionadaAtual : '';

        if (!maquininhas.length) {
            this.elements.tbMaquininhas.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma maquininha cadastrada</td></tr>';
            this.elements.maquininhaStatusVenda.textContent = 'Cadastre e pareie uma maquininha na aba Configurações.';
            return;
        }

        this.elements.tbMaquininhas.innerHTML = maquininhas.map((maquininha) => `
            <tr>
                <td>${maquininha.nome}</td>
                <td>${maquininha.modelo}</td>
                <td>${this.capitalize(maquininha.conexao)}</td>
                <td><span class="stock-pill ${maquininha.status === 'pareada' ? 'ok' : 'danger'}">${this.capitalize(maquininha.status)}</span></td>
                <td>
                    <div class="action-row nowrap">
                        <button class="btn btn-secondary btn-small" data-maq-action="parear" data-id="${maquininha.id}">Parear</button>
                        <button class="btn btn-danger btn-small" data-maq-action="remover" data-id="${maquininha.id}">Remover</button>
                    </div>
                </td>
            </tr>
        `).join('');

        const pareada = maquininhas.find((maquininha) => maquininha.status === 'pareada');
        this.elements.maquininhaStatusVenda.textContent = pareada
            ? `Maquininha pronta para uso: ${pareada.nome} (${pareada.modelo}).`
            : 'Existe maquininha cadastrada, mas nenhuma esta marcada como pareada.';
    }

    updatePaymentUI() {
        const pagamento = this.elements.vendaPagamento.value;
        this.elements.moneyFields.hidden = pagamento !== 'dinheiro';
        this.elements.cardFields.hidden = !['debito', 'credito'].includes(pagamento);
        this.elements.pixFields.hidden = pagamento !== 'pix';
        this.updateQuickPayButtons(pagamento);
        this.updateChangePreview();
        this.updatePixPreview();
    }

    updateQuickPayButtons(pagamento) {
        if (!this.elements.saleQuickPayButtons) {
            return;
        }

        this.elements.saleQuickPayButtons.forEach((button) => {
            const ativo = button.dataset.salePay === pagamento;
            button.classList.toggle('is-active', ativo);
            button.setAttribute('aria-pressed', ativo ? 'true' : 'false');
        });
    }

    updateChangePreview() {
        const total = this.getSaleTotal();
        const valorRecebido = Number(this.elements.vendaValorRecebido.value || 0);
        const falta = total - valorRecebido;
        const troco = Math.max(0, valorRecebido - total);

        this.elements.vendaTroco.textContent = this.formatMoney(troco);
        if (this.elements.vendaPagamento.value !== 'dinheiro') {
            this.elements.trocoStatus.textContent = 'Troco calculado apenas para pagamentos em dinheiro.';
            return;
        }

        if (!valorRecebido) {
            this.elements.trocoStatus.textContent = 'Informe o valor recebido para calcular o troco.';
            return;
        }

        this.elements.trocoStatus.textContent = falta > 0
            ? `Faltam ${this.formatMoney(falta)} para completar a venda.`
            : 'Troco calculado automaticamente para o caixa.';
    }

    updatePixPreview() {
        const config = db.getConfig();
        const total = this.getSaleTotal();
        this.elements.pixChaveExibicao.textContent = config.pixChave || 'Nenhuma chave PIX configurada.';
        this.elements.pixBeneficiario.textContent = config.nomeLoja
            ? `${config.nomeLoja}${config.pixCidade ? ` • ${config.pixCidade}` : ''}`
            : '';

        if (this.elements.vendaPagamento.value !== 'pix') {
            return;
        }

        if (!config.pixChave) {
            this.elements.pixQrcodeArea.className = 'pix-qrcode-area empty-state';
            this.elements.pixQrcodeArea.textContent = 'Configure a chave PIX da loja para gerar o QR Code automaticamente.';
            return;
        }

        const pix = this.buildPixPayment(config, total);
        this.elements.pixQrcodeArea.className = 'pix-qrcode-area';
        this.elements.pixQrcodeArea.innerHTML = `
            <img src="${pix.qrCodeUrl}" alt="QR Code PIX para pagamento da venda">
            <div class="pix-code-box">
                <strong>PIX Copia e Cola</strong>
                <textarea readonly>${pix.payload}</textarea>
            </div>
        `;
    }

    buildPixPayment(config, total) {
        const payload = this.buildPixPayload({
            chave: config.pixChave,
            beneficiario: config.nomeLoja || 'LOJA',
            cidade: config.pixCidade || 'CUIABA',
            valor: total
        });
        return {
            chave: config.pixChave,
            payload,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`
        };
    }

    buildPixPayload({ chave, beneficiario, cidade, valor }) {
        const merchantAccount = this.buildPixField('00', 'br.gov.bcb.pix')
            + this.buildPixField('01', this.sanitizePixValue(chave, 77));
        const amount = Number(valor || 0) > 0 ? this.buildPixField('54', Number(valor).toFixed(2)) : '';
        const city = this.sanitizePixValue(cidade, 15).toUpperCase();
        const name = this.sanitizePixValue(beneficiario, 25).toUpperCase();
        const payloadWithoutCrc = [
            this.buildPixField('00', '01'),
            this.buildPixField('26', merchantAccount),
            this.buildPixField('52', '0000'),
            this.buildPixField('53', '986'),
            amount,
            this.buildPixField('58', 'BR'),
            this.buildPixField('59', name || 'LOJA'),
            this.buildPixField('60', city || 'CUIABA'),
            this.buildPixField('62', this.buildPixField('05', 'PDV'))
        ].join('') + '6304';

        return `${payloadWithoutCrc}${this.computePixCrc16(payloadWithoutCrc)}`;
    }

    buildPixField(id, value) {
        const content = String(value || '');
        return `${id}${String(content.length).padStart(2, '0')}${content}`;
    }

    sanitizePixValue(value, maxLength) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Za-z0-9 @._+\-]/g, '')
            .slice(0, maxLength);
    }

    computePixCrc16(value) {
        let crc = 0xFFFF;
        for (let index = 0; index < value.length; index += 1) {
            crc ^= value.charCodeAt(index) << 8;
            for (let bit = 0; bit < 8; bit += 1) {
                crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    getVendaPagamentoLabel(venda) {
        const labels = {
            dinheiro: 'Dinheiro',
            debito: 'Cartao de debito',
            credito: 'Cartao de credito',
            pix: 'PIX'
        };
        return labels[venda.pagamento] || this.capitalize(venda.pagamento);
    }

    getVendaDetalhes(venda) {
        if (venda.pagamento === 'dinheiro') {
            return `Recebido ${this.formatMoney(venda.valorRecebido)} | Troco ${this.formatMoney(venda.troco)}`;
        }
        if (venda.pagamento === 'pix') {
            return venda.pix?.chave ? `Chave PIX: ${venda.pix.chave}` : 'PIX sem chave configurada';
        }
        if (venda.maquininhaNome) {
            return `Maquininha: ${venda.maquininhaNome}`;
        }
        return '-';
    }

    renderCloudStatus() {
        const status = db.getSyncStatus();
        const badge = this.elements.syncBadge;
        badge.className = `sync-badge ${status.mode === 'cloud' && status.connected ? 'is-cloud' : 'is-local'}`;
        badge.textContent = status.mode === 'cloud' && status.connected ? 'API conectada' : 'Modo local';

        let text = status.message;
        if (status.lastSyncAt) {
            text += ` Última sincronização: ${this.formatDate(status.lastSyncAt)}.`;
        }
        this.elements.cloudStatus.textContent = text;
    }

    exportarBackup() {
        const dados = db.exportar();
        const blob = new Blob([dados], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-easystore-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.mostrarMsg('Backup exportado.');
    }

    async limparDados() {
        const firstConfirm = window.confirm('Deseja apagar todos os dados do sistema?');
        if (!firstConfirm) {
            return;
        }

        const secondConfirm = window.confirm('Esta ação não pode ser desfeita. Confirmar?');
        if (!secondConfirm) {
            return;
        }

        await db.limpar();
        this.vendaAtual = [];
        this.prodEditando = null;
        this.elements.formProd.reset();
        this.refreshDataViews();
        this.renderCloudStatus();
        this.mostrarMsg('Todos os dados foram limpos.');
    }

    refreshDataViews() {
        this.renderDashboard();
        this.renderProdutosFiltrados();
        this.renderSelectVenda();
        this.renderMaquininhas();
        this.renderSelectMov();
        this.renderVendas();
        this.renderMovimentos();
        this.renderBaixoEstoque();
        this.updatePaymentUI();
        this.renderCloudStatus();
    }

    formatMoney(value) {
        return this.moneyFormatter.format(Number(value || 0));
    }

    formatDate(value) {
        return this.dateFormatter.format(new Date(value));
    }

    capitalize(value) {
        if (!value) {
            return '-';
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    mostrarMsg(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'warning' ? 'warning' : 'success'}`;
        toast.textContent = message;
        this.elements.toastRoot.appendChild(toast);
        window.setTimeout(() => {
            toast.classList.add('hide');
            window.setTimeout(() => toast.remove(), 200);
        }, 2800);
    }
}

window.app = new App();



