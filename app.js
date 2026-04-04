class App {
    constructor() {
        this.vendaAtual = [];
        this.prodEditando = null;
        this.ncmSuggestionTimer = null;
        this.latestNcmSuggestionRequest = 0;
        this.ncmSuggestions = [];
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
            selectMov: document.getElementById('select-mov-prod'),
            cloudStatus: document.getElementById('cloud-status'),
            vendaPagamento: document.getElementById('venda-pagamento'),
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
            cfgMaqNome: document.getElementById('cfg-maq-nome'),
            cfgMaqModelo: document.getElementById('cfg-maq-modelo'),
            cfgMaqConexao: document.getElementById('cfg-maq-conexao'),
            tbMaquininhas: document.getElementById('tb-maquininhas')
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
        this.elements.vendaValorRecebido.addEventListener('input', () => this.updateChangePreview());

        document.getElementById('btn-reg-mov').addEventListener('click', () => this.registrarMov());
        document.getElementById('btn-rapido').addEventListener('click', () => this.quickUpdateByCode());

        document.getElementById('btn-rel-prod').addEventListener('click', () => this.relProdutos());
        document.getElementById('btn-rel-vend').addEventListener('click', () => this.relVendas());
        document.getElementById('btn-rel-estq').addEventListener('click', () => this.relEstoque());
        document.getElementById('btn-rel-mov').addEventListener('click', () => this.relMovimento());

        document.getElementById('btn-salvar-cfg').addEventListener('click', () => this.salvarConfig());
        document.getElementById('btn-add-maq').addEventListener('click', () => this.cadastrarMaquininha());
        document.getElementById('btn-parear-maq').addEventListener('click', () => this.parearMaquininhaSelecionada());
        document.getElementById('btn-export').addEventListener('click', () => this.exportarBackup());
        document.getElementById('btn-limpar').addEventListener('click', () => this.limparDados());

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

        this.setNcmHelp(`NCM informado manualmente: ${this.elements.prodNcm.value}. O sistema vai validar a coerencia antes de salvar.`);
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
                this.setNcmHelp('Nenhuma sugestao oficial foi encontrada automaticamente para esse produto. Voce pode informar o NCM manualmente.');
                return;
            }

            const suggestion = suggestions[0];
            if (canOverwrite) {
                this.elements.prodNcm.value = suggestion.codigo;
                this.elements.prodNcm.dataset.auto = 'true';
            }

            this.setNcmHelp(`Sugestao oficial: ${suggestion.codigo} - ${suggestion.descricao}. A IA ainda vai conferir a coerencia antes do salvamento.`);
        } catch (error) {
            if (requestId !== this.latestNcmSuggestionRequest) {
                return;
            }

            this.renderNcmSuggestions([]);
            this.setNcmHelp('Nao foi possivel consultar a base oficial agora. Voce ainda pode informar o NCM manualmente.');
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
        const response = await fetch(`/api/ncm/search?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Falha na busca de NCM (HTTP ${response.status}).`);
        }

        const data = await response.json();
        return data.items && data.items.length ? data.items : [];
    }

    async validarNcmComIa(dados) {
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
            throw new Error(payload?.error || `Falha na validacao de NCM (HTTP ${response.status}).`);
        }

        return response.json();
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
        this.setNcmHelp(`Sugestao oficial selecionada: ${suggestion.codigo} - ${suggestion.descricao}.`);
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
                ? 'Possivel incoerencia'
                : 'Revisao recomendada';

        let extra = '';
        if (validacao.ai?.available) {
            extra = ` Confianca da IA: ${Math.round((validacao.ai.confidence || 0) * 100)}%.`;
        } else if (validacao.ai?.status === 'nao_configurado') {
            extra = ' OpenAI nao configurada; validacao feita com a base oficial e a regra local.';
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
            vendas: 'Registrar Venda',
            estoque: 'Movimentacao de Estoque',
            relatorios: 'Relatorios',
            config: 'Configuracoes'
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
                        <button class="btn btn-danger btn-small" data-action="delete" data-id="${produto.id}">Excluir</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    abrirModalProd() {
        this.prodEditando = null;
        this.elements.modalTitle.textContent = 'Novo Produto';
        this.elements.formProd.reset();
        document.getElementById('prod-minimo').value = '10';
        document.getElementById('prod-estoque').value = '0';
        document.getElementById('prod-cod-display').value = 'Sera gerado automaticamente';
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
            this.mostrarMsg('Produto nao encontrado.', 'warning');
            return;
        }

        this.prodEditando = id;
        this.elements.modalTitle.textContent = 'Editar Produto';
        document.getElementById('prod-cod-display').value = produto.codigo;
        document.getElementById('prod-nome').value = produto.nome;
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
            ? `NCM atual: ${produto.ncm}. O sistema vai validar a coerencia antes de salvar.`
            : 'Produto sem NCM salvo. A API vai tentar sugerir um codigo oficial.');
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

        if (!this.validarCamposBasicosProduto(dados, { exigirNcm: true })) {
            return;
        }

        try {
            const validacao = await this.validarNcmComIa(dados);
            this.showNcmValidation(validacao);

            if (validacao.finalStatus === 'incoerente') {
                const justificativa = validacao.ai?.justification || validacao.heuristic?.reason || 'A validacao apontou incoerencia.';
                const continuar = window.confirm(`A validacao do NCM encontrou possivel incoerencia:\n\n${justificativa}\n\nDeseja salvar mesmo assim?`);
                if (!continuar) {
                    return;
                }
            } else if (validacao.finalStatus === 'duvida') {
                const justificativa = validacao.ai?.justification || validacao.heuristic?.reason || 'A validacao pede revisao manual.';
                this.mostrarMsg(`Revise este NCM: ${justificativa}`, 'warning');
            }

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
            this.mostrarMsg('Produto excluido.');
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
    }

    addItemVenda() {
        const produtoId = this.elements.selectVenda.value;
        const quantidade = Number(document.getElementById('venda-qty').value);

        if (!produtoId || quantidade <= 0) {
            this.mostrarMsg('Selecione um produto e informe uma quantidade valida.', 'warning');
            return;
        }

        const produto = db.getProduto(produtoId);
        if (!produto) {
            this.mostrarMsg('Produto nao encontrado.', 'warning');
            return;
        }

        const itemExistente = this.vendaAtual.find((item) => item.id === produtoId);
        const quantidadeAtual = itemExistente ? itemExistente.qtd : 0;

        if (quantidade + quantidadeAtual > produto.estoque) {
            this.mostrarMsg('Estoque insuficiente para esta venda.', 'warning');
            return;
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
    }

    renderItensVenda() {
        if (!this.vendaAtual.length) {
            this.elements.tbItens.innerHTML = '<tr><td colspan="4" class="empty">Nenhum item</td></tr>';
            document.getElementById('venda-total').textContent = this.formatMoney(0);
            return;
        }

        let total = 0;
        this.elements.tbItens.innerHTML = this.vendaAtual.map((item, index) => {
            const subtotal = item.preco * item.qtd;
            total += subtotal;

            return `
                <tr>
                    <td>${item.nome}</td>
                    <td>${item.qtd}</td>
                    <td>${this.formatMoney(subtotal)}</td>
                    <td><button class="btn btn-danger btn-small" data-remove-item="${index}">Remover</button></td>
                </tr>
            `;
        }).join('');

        document.getElementById('venda-total').textContent = this.formatMoney(total);
        this.updateChangePreview();
        this.updatePixPreview();
    }

    removerItemVenda(index) {
        this.vendaAtual.splice(index, 1);
        this.renderItensVenda();
    }

    async finalizarVenda() {
        if (!this.vendaAtual.length) {
            this.mostrarMsg('Adicione pelo menos um item a venda.', 'warning');
            return;
        }

        try {
            const total = this.vendaAtual.reduce((soma, item) => soma + (item.qtd * item.preco), 0);
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

            await db.addVenda({
                itens: this.vendaAtual,
                total,
                pagamento,
                valorRecebido: pagamento === 'dinheiro' ? valorRecebido : 0,
                troco: pagamento === 'dinheiro' ? troco : 0,
                maquininhaId: maquininha ? maquininha.id : '',
                maquininhaNome: maquininha ? maquininha.nome : '',
                pix
            });

            this.mostrarMsg('Venda registrada com sucesso.');
            this.cancelarVenda();
            this.refreshDataViews();
        } catch (error) {
            this.mostrarMsg(error.message, 'warning');
        }
    }

    cancelarVenda() {
        this.vendaAtual = [];
        this.elements.vendaPagamento.value = 'dinheiro';
        this.elements.vendaValorRecebido.value = '';
        this.elements.vendaMaquininha.value = '';
        this.renderItensVenda();
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
            this.mostrarMsg('Movimentacao registrada.');
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
            this.mostrarMsg('Informe um codigo e uma quantidade validos.', 'warning');
            return;
        }

        if (!produto) {
            this.mostrarMsg('Produto nao encontrado para o codigo informado.', 'warning');
            return;
        }

        try {
            await db.addMovimento({
                produtoId: produto.id,
                tipo,
                qtd,
                obs: 'Atualizacao rapida por codigo'
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
            this.elements.tbMov.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma movimentacao registrada</td></tr>';
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
            <h3>Relatorio de Produtos</h3>
            <p>Gerado em ${this.formatDate(new Date().toISOString())}</p>
            ${this.buildReportTable(
                ['Codigo', 'Nome', 'NCM', 'Categoria', 'Preco', 'Estoque', 'Total'],
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
            <h3>Relatorio de Vendas</h3>
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
            <h3>Relatorio de Estoque</h3>
            <p>Gerado em ${this.formatDate(new Date().toISOString())}</p>
            ${this.buildReportTable(
                ['Codigo', 'Nome', 'NCM', 'Estoque', 'Minimo', 'Custo', 'Preco', 'Margem'],
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
            <h3>Relatorio de Movimentacoes</h3>
            <p>Gerado em ${this.formatDate(new Date().toISOString())}</p>
            ${this.buildReportTable(
                ['Data', 'Produto', 'Tipo', 'Quantidade', 'Observacao'],
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
            return '<p class="empty">Nenhum dado disponivel para este relatorio.</p>';
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
            this.elements.maquininhaStatusVenda.textContent = 'Cadastre e pareie uma maquininha na aba Configuracoes.';
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
        this.updateChangePreview();
        this.updatePixPreview();
    }

    updateChangePreview() {
        const total = this.vendaAtual.reduce((soma, item) => soma + (item.qtd * item.preco), 0);
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
        const total = this.vendaAtual.reduce((soma, item) => soma + (item.qtd * item.preco), 0);
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
            text += ` Ultima sincronizacao: ${this.formatDate(status.lastSyncAt)}.`;
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

        const secondConfirm = window.confirm('Esta acao nao pode ser desfeita. Confirmar?');
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
