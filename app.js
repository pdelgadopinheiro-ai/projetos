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
        this.scannerMode = 'sale';
        this.scannerCloseAfterSuccess = false;
        this.salesStaticFitTimer = null;
        this.salesOnlyEscExitArmedAt = 0;
        this.salesOnlyEscExitWindowMs = 1800;
        this.saleProductPickerResults = [];
        this.saleProductPickerIndex = -1;
        this.scanInputTimer = null;
        this.lastFiscalNoteHtml = '';
        this.lastFiscalNotePrintStyles = '';
        this.lastFiscalPrintPayload = null;
        this.desktopPrinters = [];
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
            mainContent: document.querySelector('.main-content'),
            header: document.querySelector('.header'),
            modal: document.getElementById('modal-prod'),
            modalTitle: document.getElementById('modal-title'),
            formProd: document.getElementById('form-prod'),
            btnValidarNcm: document.getElementById('btn-validar-ncm'),
            prodNome: document.getElementById('prod-nome'),
            prodBarcode: document.getElementById('prod-barcode'),
            btnScanProdBarcode: document.getElementById('btn-scan-prod-barcode'),
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
            saleProductModal: document.getElementById('sale-product-modal'),
            saleProductSearch: document.getElementById('sale-product-search'),
            saleProductQty: document.getElementById('sale-product-qty'),
            tbSaleProductPicker: document.getElementById('tb-sale-product-picker'),
            saleProductPickerStatus: document.getElementById('sale-product-picker-status'),
            btnCloseSaleProductModal: document.getElementById('btn-close-sale-product-modal'),
            selectMov: document.getElementById('select-mov-prod'),
            cloudStatus: document.getElementById('cloud-status'),
            vendaPerfilFiscal: document.getElementById('venda-perfil-fiscal'),
            vendaPagamento: document.getElementById('venda-pagamento'),
            saleItemCount: document.getElementById('sale-item-count'),
            saleUnitCount: document.getElementById('sale-unit-count'),
            saleStatusText: document.getElementById('sale-status-text'),
            saleAddStatus: document.getElementById('venda-add-status'),
            posSummaryPanel: document.querySelector('.pos-summary-panel'),
            saleQuickPayButtons: document.querySelectorAll('[data-sale-pay]'),
            vendaMaquininha: document.getElementById('venda-maquininha'),
            varejoCustomerFields: document.getElementById('varejo-customer-fields'),
            vendaClienteCpf: document.getElementById('venda-cliente-cpf'),
            atacadoCustomerFields: document.getElementById('atacado-customer-fields'),
            vendaClienteCnpj: document.getElementById('venda-cliente-cnpj'),
            vendaClienteNomeEmpresa: document.getElementById('venda-cliente-nome-empresa'),
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
            cfgNome: document.getElementById('cfg-nome'),
            cfgCnpj: document.getElementById('cfg-cnpj'),
            cfgInscricaoEstadual: document.getElementById('cfg-ie'),
            cfgEnderecoRua: document.getElementById('cfg-endereco-rua'),
            cfgEnderecoNumero: document.getElementById('cfg-endereco-numero'),
            cfgEnderecoBairro: document.getElementById('cfg-endereco-bairro'),
            cfgEnderecoUf: document.getElementById('cfg-endereco-uf'),
            cfgEnderecoCep: document.getElementById('cfg-endereco-cep'),
            cfgEmail: document.getElementById('cfg-email'),
            cfgPixChave: document.getElementById('cfg-pix-chave'),
            cfgPixCidade: document.getElementById('cfg-pix-cidade'),
            cfgFiscalPrinterProfileNfe: document.getElementById('cfg-fiscal-printer-profile-nfe'),
            cfgFiscalPrinterNameNfe: document.getElementById('cfg-fiscal-printer-name-nfe'),
            cfgFiscalPrinterProfileNfce: document.getElementById('cfg-fiscal-printer-profile-nfce'),
            cfgFiscalPrinterNameNfce: document.getElementById('cfg-fiscal-printer-name-nfce'),
            cfgFiscalPrintersList: document.getElementById('cfg-fiscal-printers-list'),
            cfgMaqProvider: document.getElementById('cfg-maq-provider'),
            cfgMaqNome: document.getElementById('cfg-maq-nome'),
            cfgMaqModelo: document.getElementById('cfg-maq-modelo'),
            cfgMaqConexao: document.getElementById('cfg-maq-conexao'),
            cfgMaqIdentificador: document.getElementById('cfg-maq-identificador'),
            cfgMaqEndpoint: document.getElementById('cfg-maq-endpoint'),
            tbMaquininhas: document.getElementById('tb-maquininhas'),
            fiscalNoteModal: document.getElementById('fiscal-note-modal'),
            fiscalNoteContent: document.getElementById('fiscal-note-content'),
            btnPrintFiscalNote: document.getElementById('btn-print-fiscal-note'),
            btnCloseFiscalNote: document.getElementById('btn-close-fiscal-note'),
            btnCloseFiscalNoteBottom: document.getElementById('btn-close-fiscal-note-bottom'),
            vendasSection: document.getElementById('vendas')
        };
    }

    async init() {
        await db.init();
        this.carregarConfig();
        await this.loadDesktopPrinters();
        this.atualizarData();
        this.forceSalesOnlySection();
        this.renderCurrentSection();
        this.renderDashboard();
        this.renderSelectVenda();
        this.renderSelectMov();
        this.renderMovimentos();
        this.renderBaixoEstoque();
        this.renderCloudStatus();
        this.scheduleSalesStaticFit();
        window.setInterval(() => this.atualizarData(), 60000);
        window.setInterval(() => this.renderCloudStatus(), 8000);
    }

    bindEvents() {
        window.addEventListener('easystore:sync-status', () => this.renderCloudStatus());
        window.addEventListener('online', () => {
            if (db && typeof db.syncNow === 'function') {
                db.syncNow({ silent: true }).finally(() => this.renderCloudStatus());
            }
        });
        window.addEventListener('offline', () => this.renderCloudStatus());

        document.querySelectorAll('.menu-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                const secao = event.currentTarget.dataset.section;
                if (secao === 'vendas' && !this.isSalesOnlyMode()) {
                    event.preventDefault();
                    window.location.href = '/vendas';
                    return;
                }
                this.mostrarSecao(secao);
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
        if (this.elements.btnScanProdBarcode) {
            this.elements.btnScanProdBarcode.addEventListener('click', () => this.openProductBarcodeScanner());
        }

        const btnAddItem = document.getElementById('btn-add-item');
        if (btnAddItem) {
            btnAddItem.addEventListener('click', () => this.addItemVenda());
        }
        const btnFinalizarVenda = document.getElementById('btn-finalizar-venda');
        if (btnFinalizarVenda) {
            btnFinalizarVenda.addEventListener('click', () => this.finalizarVenda());
        }
        const btnCancelarVenda = document.getElementById('btn-cancelar-venda');
        if (btnCancelarVenda) {
            btnCancelarVenda.addEventListener('click', () => this.cancelarVenda());
        }
        this.elements.vendaPagamento.addEventListener('change', () => this.updatePaymentUI());
        if (this.elements.vendaPerfilFiscal) {
            this.elements.vendaPerfilFiscal.addEventListener('change', () => this.handleSaleFiscalProfileChange({
                focusWholesalePrice: this.isWholesaleFiscalProfile()
            }));
        }
        if (this.elements.vendaClienteCpf) {
            this.elements.vendaClienteCpf.addEventListener('input', () => {
                this.elements.vendaClienteCpf.value = this.formatCpfInput(this.elements.vendaClienteCpf.value);
            });
            this.elements.vendaClienteCpf.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.finalizarVenda();
                }
            });
        }
        if (this.elements.vendaClienteCnpj) {
            this.elements.vendaClienteCnpj.addEventListener('input', () => {
                this.elements.vendaClienteCnpj.value = this.formatCnpjInput(this.elements.vendaClienteCnpj.value);
            });
            this.elements.vendaClienteCnpj.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.finalizarVenda();
                }
            });
        }
        if (this.elements.vendaClienteNomeEmpresa) {
            this.elements.vendaClienteNomeEmpresa.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.finalizarVenda();
                }
            });
        }
        this.elements.selectVenda.addEventListener('change', () => this.updateSaleEntryStatus());
        this.elements.vendaValorRecebido.addEventListener('input', () => this.updateChangePreview());
        if (this.elements.btnScanAdd) {
            this.elements.btnScanAdd.addEventListener('click', () => this.addItemByScan());
        }
        if (this.elements.btnOpenScanner) {
            this.elements.btnOpenScanner.addEventListener('click', () => this.openScannerModal());
        }
        this.elements.btnCloseScanner.addEventListener('click', () => this.closeScannerModal());
        if (this.elements.btnCloseSaleProductModal) {
            this.elements.btnCloseSaleProductModal.addEventListener('click', () => this.closeSaleProductPicker());
        }
        if (this.elements.saleProductModal) {
            this.elements.saleProductModal.addEventListener('click', (event) => {
                if (event.target === this.elements.saleProductModal) {
                    this.closeSaleProductPicker();
                }
            });
        }
        if (this.elements.saleProductSearch) {
            this.elements.saleProductSearch.addEventListener('input', () => this.renderSaleProductPicker());
            this.elements.saleProductSearch.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    this.moveSaleProductPickerSelection(1);
                    return;
                }
                if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    this.moveSaleProductPickerSelection(-1);
                    return;
                }
                if (event.key === 'Enter') {
                    event.preventDefault();
                    if (this.elements.saleProductQty) {
                        this.elements.saleProductQty.focus();
                        this.elements.saleProductQty.select();
                        return;
                    }
                    this.pickSaleProductFromCurrentSelection();
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.closeSaleProductPicker();
                }
            });
        }
        if (this.elements.saleProductQty) {
            this.elements.saleProductQty.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.pickSaleProductFromCurrentSelection();
                    return;
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.closeSaleProductPicker();
                }
            });
        }
        if (this.elements.tbSaleProductPicker) {
            this.elements.tbSaleProductPicker.addEventListener('click', (event) => {
                const pickButton = event.target.closest('[data-pick-product]');
                if (pickButton) {
                    this.pickSaleProductFromPicker(pickButton.dataset.pickProduct);
                    return;
                }

                const row = event.target.closest('tr[data-picker-index]');
                if (!row) {
                    return;
                }

                this.saleProductPickerIndex = Number(row.dataset.pickerIndex);
                this.renderSaleProductPicker();
                if (this.elements.saleProductQty) {
                    this.elements.saleProductQty.focus();
                    this.elements.saleProductQty.select();
                }
            });
            this.elements.tbSaleProductPicker.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    this.moveSaleProductPickerSelection(1);
                    return;
                }
                if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    this.moveSaleProductPickerSelection(-1);
                    return;
                }
                if (event.key === 'Enter') {
                    const activeButton = event.target.closest('[data-pick-product]');
                    if (!activeButton) {
                        return;
                    }
                    event.preventDefault();
                    this.pickSaleProductFromPicker(activeButton.dataset.pickProduct);
                }
            });
        }
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
        document.addEventListener('keydown', (event) => this.handleGlobalShortcuts(event), true);
        window.addEventListener('resize', () => this.scheduleSalesStaticFit());

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
        const btnAddVincularMaq = document.getElementById('btn-add-vincular-maq');
        if (btnAddVincularMaq) {
            btnAddVincularMaq.addEventListener('click', () => this.cadastrarMaquininha({ vincular: true }));
        }
        const btnVincularMaq = document.getElementById('btn-vincular-maq');
        if (btnVincularMaq) {
            btnVincularMaq.addEventListener('click', () => this.vincularMaquininhaSelecionada());
        }
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
        this.elements.tbItens.addEventListener('change', (event) => {
            const priceInput = event.target.closest('[data-item-price-index]');
            if (!priceInput) {
                return;
            }
            this.updateSaleItemPrice(Number(priceInput.dataset.itemPriceIndex), priceInput.value);
        });
        this.elements.tbItens.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') {
                return;
            }
            const priceInput = event.target.closest('[data-item-price-index]');
            if (!priceInput) {
                return;
            }
            event.preventDefault();
            this.confirmSaleItemPriceByEnter(Number(priceInput.dataset.itemPriceIndex), priceInput.value);
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
            if (maqAction === 'vincular') {
                this.vincularMaquininha(id);
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

        if (!suggestions.length) {
            const categoryFallback = {
                acessorios: {
                    codigo: '4202.99.00',
                    descricao: 'Acessórios diversos de uso pessoal'
                },
                brinquedos: {
                    codigo: '9503.00.99',
                    descricao: 'Brinquedos e modelos recreativos'
                },
                eletronicos: {
                    codigo: '8543.70.99',
                    descricao: 'Aparelhos e dispositivos eletrônicos diversos'
                },
                animais: {
                    codigo: '4201.00.90',
                    descricao: 'Artefatos e acessórios para animais'
                },
                papelaria: {
                    codigo: '4820.10.00',
                    descricao: 'Cadernos e artigos de papelaria'
                },
                outras: {
                    codigo: '3926.90.90',
                    descricao: 'Outros artefatos de uso diverso'
                }
            };
            const fallback = categoryFallback[categoria];
            if (fallback) {
                suggestions.push(fallback);
            }
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
            preco: Number(document.getElementById('prod-preco').value),
            estoque: Number(document.getElementById('prod-estoque').value),
            minimo: Number(document.getElementById('prod-minimo').value)
        };
    }

    validarCamposBasicosProduto(dados, { exigirNcm = true } = {}) {
        if (exigirNcm && !dados.ncm) {
            this.mostrarMsg('Informe um NCM válido com 8 dígitos para validar.', 'warning');
            return false;
        }

        if (!dados.nome || !dados.categoria || dados.preco < 0 || dados.estoque < 0 || dados.minimo < 1) {
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
        this.scheduleSalesStaticFit();
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
        this.scheduleSalesStaticFit();
    }

    forceSalesOnlySection() {
        if (!this.isSalesOnlyMode()) {
            return;
        }

        const vendasSection = document.getElementById('vendas');
        if (!vendasSection) {
            return;
        }

        document.querySelectorAll('.section').forEach((section) => section.classList.remove('active'));
        vendasSection.classList.add('active');

        document.querySelectorAll('.menu-btn').forEach((button) => button.classList.remove('active'));
        const vendasButton = document.querySelector('.menu-btn[data-section="vendas"]');
        if (vendasButton) {
            vendasButton.classList.add('active');
        }

        if (this.elements.title) {
            this.elements.title.textContent = '';
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
            this.elements.tbProdutos.innerHTML = '<tr><td colspan="7" class="empty">Nenhum produto encontrado</td></tr>';
            return;
        }

        this.elements.tbProdutos.innerHTML = produtos.map((produto) => `
            <tr>
                <td>${produto.codigo}</td>
                <td>${produto.nome}</td>
                <td>${produto.ncm || '-'}</td>
                <td>${this.capitalize(produto.categoria)}</td>
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

        const quantidadeInformada = window.prompt('Quantidade de etiquetas para imprimir:', '1');
        if (quantidadeInformada === null) {
            return;
        }
        const quantidade = Number.parseInt(quantidadeInformada, 10);
        if (!Number.isFinite(quantidade) || quantidade < 1 || quantidade > 500) {
            this.mostrarMsg('Informe uma quantidade válida entre 1 e 500 etiquetas.', 'warning');
            return;
        }

        const codigoBarras = produto.codigoBarras || produto.codigo;
        const codabarValue = this.formatCodabarValue(codigoBarras);
        const codabarSvg = this.buildCodabarSvg(codabarValue, {
            width: 220,
            moduleWidth: 1,
            barHeight: 34,
            showText: false
        });

        const etiquetaHtml = `
            <article class="product-label">
                <p class="label-name">${produto.nome}</p>
                <p class="label-price">${this.formatMoney(produto.preco)}</p>
                <div class="label-barcode">
                    ${codabarSvg}
                </div>
                <p class="label-code">${codabarValue}</p>
            </article>
        `;

        const labelContent = `
            <div class="label-sheet">
                ${Array.from({ length: quantidade }, () => etiquetaHtml).join('')}
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
                grid-auto-rows: 24mm;
                gap: 1mm;
                width: 101mm;
                align-content: start;
            }

            .product-label {
                width: 33mm;
                height: 24mm;
                border: 0.25mm solid #111;
                padding: 1.2mm 1mm 1mm;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                break-inside: avoid;
                page-break-inside: avoid;
            }

            .label-name {
                margin: 0;
                min-height: 5.2mm;
                font-size: 2.5mm;
                line-height: 1.1;
                font-weight: 700;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .label-price {
                margin: 0.4mm 0 0.5mm;
                font-size: 4.8mm;
                line-height: 1;
                font-weight: 800;
            }

            .label-barcode {
                margin-top: auto;
                width: 100%;
                height: 10.2mm;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .label-barcode svg {
                display: block;
                width: 100%;
                height: 100%;
                shape-rendering: crispEdges;
            }

            .label-code {
                margin: 0.25mm 0 0;
                text-align: center;
                font-size: 2.15mm;
                line-height: 1.05;
                letter-spacing: 0.18mm;
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

    isDesktopPrintAvailable() {
        return Boolean(window.desktopBridge && typeof window.desktopBridge.printFiscalDocument === 'function');
    }

    isDesktopPrinterListAvailable() {
        return Boolean(window.desktopBridge && typeof window.desktopBridge.listPrinters === 'function');
    }

    async loadDesktopPrinters() {
        if (!this.isDesktopPrinterListAvailable()) {
            this.desktopPrinters = [];
            this.renderFiscalPrinterDatalist();
            return;
        }

        try {
            const result = await window.desktopBridge.listPrinters();
            this.desktopPrinters = Array.isArray(result?.printers) ? result.printers : [];
            this.renderFiscalPrinterDatalist();
        } catch (error) {
            console.warn('Nao foi possivel listar impressoras do desktop:', error);
            this.desktopPrinters = [];
            this.renderFiscalPrinterDatalist();
        }
    }

    renderFiscalPrinterDatalist() {
        if (!this.elements.cfgFiscalPrintersList) {
            return;
        }

        this.elements.cfgFiscalPrintersList.innerHTML = this.desktopPrinters.map((printer) => {
            const name = String(printer.name || printer.displayName || '').trim();
            if (!name) {
                return '';
            }
            const displayName = String(printer.displayName || name).trim();
            const label = displayName && displayName !== name ? displayName : String(printer.description || '').trim();
            const labelAttr = label ? ` label="${this.escapeHtml(label)}"` : '';
            return `<option value="${this.escapeHtml(name)}"${labelAttr}></option>`;
        }).join('');
    }

    buildFiscalPrintDocument(title, bodyContent, printStyles) {
        return `
            <!doctype html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>${this.escapeHtml(title || 'Nota Fiscal')}</title>
                    <style>${printStyles}</style>
                </head>
                <body>
                    ${bodyContent}
                </body>
            </html>
        `;
    }

    buildFiscalPrintPayload(nota) {
        const printerRoute = this.getFiscalPrinterRouteForNote(nota);
        const effectivePrinterProfile = printerRoute.profile;
        const bodyContent = this.buildThermalFiscalNoteMarkup(nota, effectivePrinterProfile);
        const printStyles = this.getThermalFiscalNotePrintStyles(effectivePrinterProfile);
        const title = `${nota.tipo} No ${nota.numero}`;

        return {
            notaId: nota.id,
            documentType: String(nota.tipo || 'Nota Fiscal'),
            title,
            content: bodyContent,
            printStyles,
            html: this.buildFiscalPrintDocument(title, bodyContent, printStyles),
            profile: effectivePrinterProfile,
            printerName: printerRoute.printerName || '',
            printerLabel: printerRoute.targetLabel || '',
            route: printerRoute
        };
    }

    async showFiscalNotePrintout(nota) {
        const payload = this.buildFiscalPrintPayload(nota);
        this.lastFiscalPrintPayload = payload;
        this.lastFiscalNoteHtml = payload.content;
        this.lastFiscalNotePrintStyles = payload.printStyles;

        const result = await this.printFiscalPayload(payload);
        if (!result.ok) {
            this.showFiscalNoteModal(payload.content, payload.printStyles, payload);
        }
    }

    async printFiscalPayload(payload, { showSuccess = true } = {}) {
        if (!payload?.html) {
            return { ok: false, error: 'Documento fiscal vazio.' };
        }

        if (this.isDesktopPrintAvailable()) {
            const desktopResult = await this.tryPrintFiscalPayloadOnDesktop(payload);
            if (desktopResult.ok) {
                if (showSuccess) {
                    this.mostrarMsg(`${payload.documentType} enviada para ${desktopResult.printerName || 'a impressora padrão'}.`, 'success');
                }
                return desktopResult;
            }

            this.mostrarMsg(`Impressão automática indisponível: ${desktopResult.error} Abrindo impressão manual.`, 'warning');
        }

        let browserResult = await this.printInlineInCurrentWindow(payload);
        if (!browserResult.ok) {
            const legacyResult = await this.printHtmlInHiddenFrame(payload.html, payload.title);
            if (legacyResult.ok) {
                browserResult = legacyResult;
            } else if (legacyResult.error) {
                browserResult = legacyResult;
            }
        }
        if (browserResult.ok) {
            if (showSuccess && !this.isDesktopPrintAvailable()) {
                this.mostrarMsg(`${payload.documentType} preparada para impressão.`, 'success');
            }
            return browserResult;
        }

        this.mostrarMsg(browserResult.error || 'Não foi possível iniciar a impressão.', 'warning');
        return browserResult;
    }

    async tryPrintFiscalPayloadOnDesktop(payload) {
        try {
            const result = await window.desktopBridge.printFiscalDocument({
                html: payload.html,
                title: payload.title,
                profile: payload.profile,
                printerName: payload.printerName,
                documentType: payload.documentType
            });
            return result?.ok
                ? result
                : { ok: false, error: result?.error || 'Falha ao enviar para a impressora.' };
        } catch (error) {
            return { ok: false, error: error?.message || 'Falha ao acionar a impressão automática.' };
        }
    }

    async waitForPrintFrameImages(frameDocument) {
        const images = Array.from(frameDocument?.images || []);
        if (!images.length) {
            return;
        }

        await Promise.race([
            Promise.all(images.map((image) => {
                if (image.complete) {
                    return Promise.resolve();
                }
                return new Promise((resolve) => {
                    image.addEventListener('load', resolve, { once: true });
                    image.addEventListener('error', resolve, { once: true });
                });
            })),
            new Promise((resolve) => window.setTimeout(resolve, 2500))
        ]);
    }

    async waitForPrintContainerImages(container) {
        const images = Array.from(container?.querySelectorAll?.('img') || []);
        if (!images.length) {
            return;
        }

        await Promise.race([
            Promise.all(images.map((image) => {
                if (image.complete) {
                    return Promise.resolve();
                }
                return new Promise((resolve) => {
                    image.addEventListener('load', resolve, { once: true });
                    image.addEventListener('error', resolve, { once: true });
                });
            })),
            new Promise((resolve) => window.setTimeout(resolve, 2500))
        ]);
    }

    async printInlineInCurrentWindow(payload) {
        const hostId = 'fiscal-inline-print-host';
        const styleId = 'fiscal-inline-print-style';
        const hostExisting = document.getElementById(hostId);
        const styleExisting = document.getElementById(styleId);
        if (hostExisting) {
            hostExisting.remove();
        }
        if (styleExisting) {
            styleExisting.remove();
        }

        const host = document.createElement('section');
        host.id = hostId;
        host.setAttribute('aria-hidden', 'true');
        host.style.position = 'fixed';
        host.style.left = '-10000px';
        host.style.top = '0';
        host.style.width = '1px';
        host.style.height = '1px';
        host.style.overflow = 'hidden';
        host.style.opacity = '0';
        host.innerHTML = payload.content || '';

        const printStyle = document.createElement('style');
        printStyle.id = styleId;
        printStyle.media = 'print';
        printStyle.textContent = `
            ${payload.printStyles || ''}
            body > * {
                display: none !important;
            }
            #${hostId} {
                display: block !important;
                position: static !important;
                left: auto !important;
                top: auto !important;
                width: auto !important;
                height: auto !important;
                overflow: visible !important;
                opacity: 1 !important;
                margin: 0 !important;
            }
        `;

        document.body.appendChild(host);
        document.head.appendChild(printStyle);

        try {
            await new Promise((resolve) => window.setTimeout(resolve, 80));
            await this.waitForPrintContainerImages(host);

            const cleanup = () => {
                window.setTimeout(() => {
                    if (host.parentNode) {
                        host.remove();
                    }
                    if (printStyle.parentNode) {
                        printStyle.remove();
                    }
                }, 350);
            };
            window.addEventListener('afterprint', cleanup, { once: true });
            window.setTimeout(cleanup, 60000);
            window.print();
            return { ok: true, printerName: 'impressora selecionada', manual: true };
        } catch (error) {
            if (host.parentNode) {
                host.remove();
            }
            if (printStyle.parentNode) {
                printStyle.remove();
            }
            return { ok: false, error: error?.message || 'Falha ao iniciar impressao nesta tela.' };
        }
    }

    async printHtmlInHiddenFrame(html, title = 'Impressao') {
        const existingFrame = document.getElementById('fiscal-print-frame');
        if (existingFrame) {
            existingFrame.remove();
        }

        const frame = document.createElement('iframe');
        frame.id = 'fiscal-print-frame';
        frame.title = title;
        frame.setAttribute('aria-hidden', 'true');
        frame.style.position = 'fixed';
        frame.style.right = '0';
        frame.style.bottom = '0';
        frame.style.width = '0';
        frame.style.height = '0';
        frame.style.border = '0';
        frame.style.opacity = '0';
        frame.style.pointerEvents = 'none';
        document.body.appendChild(frame);

        try {
            const frameWindow = frame.contentWindow;
            const frameDocument = frame.contentDocument || frameWindow?.document;
            if (!frameWindow || !frameDocument) {
                frame.remove();
                return { ok: false, error: 'Nao foi possivel preparar a impressao.' };
            }

            frameDocument.open();
            frameDocument.write(html);
            frameDocument.close();

            await new Promise((resolve) => window.setTimeout(resolve, 120));
            await this.waitForPrintFrameImages(frameDocument);

            const cleanup = () => {
                window.setTimeout(() => {
                    if (frame.parentNode) {
                        frame.remove();
                    }
                }, 800);
            };
            frameWindow.onafterprint = cleanup;
            window.setTimeout(cleanup, 60000);

            frameWindow.focus();
            frameWindow.print();
            return { ok: true, printerName: 'impressora selecionada', manual: true };
        } catch (error) {
            if (frame.parentNode) {
                frame.remove();
            }
            return { ok: false, error: error?.message || 'Falha ao iniciar impressao.' };
        }
    }

    normalizeFiscalPrinterProfile(value) {
        const normalized = String(value || '').trim().toLowerCase();
        const allowedProfiles = ['auto', 'thermal80', 'thermal58', 'a4'];
        return allowedProfiles.includes(normalized) ? normalized : 'auto';
    }

    normalizeNfcePrinterProfile(value) {
        const normalized = this.normalizeFiscalPrinterProfile(value);
        return ['thermal80', 'thermal58'].includes(normalized) ? normalized : 'thermal80';
    }

    normalizeNfePrinterProfile() {
        return 'a4';
    }

    getFiscalPrinterRouteForNote(nota) {
        const config = db.getConfig ? db.getConfig() : {};
        const tipoNota = String(nota?.tipo || '').toUpperCase();
        const nfeProfile = this.normalizeNfePrinterProfile(config.fiscalPrinterProfileNfe || this.elements.cfgFiscalPrinterProfileNfe?.value);
        const nfceProfile = this.normalizeNfcePrinterProfile(
            config.fiscalPrinterProfileNfce || config.fiscalPrinterProfile || this.elements.cfgFiscalPrinterProfileNfce?.value
        );
        const nfePrinterName = String(config.fiscalPrinterNameNfe || this.elements.cfgFiscalPrinterNameNfe?.value || '').trim();
        const nfcePrinterName = String(config.fiscalPrinterNameNfce || this.elements.cfgFiscalPrinterNameNfce?.value || '').trim();

        if (tipoNota === 'NF-E') {
            const target = nfePrinterName || 'Impressora comum A4';
            return {
                profile: nfeProfile,
                printerName: nfePrinterName,
                title: 'Destino NF-e (atacado)',
                targetLabel: target,
                message: 'NF-e deve ser impressa apenas em impressora comum (papel A4).'
            };
        }

        if (tipoNota === 'NFC-E') {
            const papelTermico = nfceProfile === 'thermal58' ? 'térmica 58mm' : 'térmica 80mm';
            const target = nfcePrinterName || `Impressora ${papelTermico}`;
            return {
                profile: nfceProfile,
                printerName: nfcePrinterName,
                title: 'Destino NFC-e (varejo)',
                targetLabel: target,
                message: 'NFC-e deve ser impressa apenas em impressora térmica.'
            };
        }

        return {
            profile: this.normalizeFiscalPrinterProfile(config.fiscalPrinterProfile || 'auto'),
            printerName: '',
            title: 'Destino de impressão',
            targetLabel: '',
            message: 'Confirme a impressora correta antes de imprimir.'
        };
    }

    buildFiscalPrintRoutingBanner(route) {
        if (!route) {
            return '';
        }
        const title = this.escapeHtml(route.title || 'Destino de impressão');
        const target = route.targetLabel
            ? `<p><strong>Impressora recomendada:</strong> ${this.escapeHtml(route.targetLabel)}</p>`
            : '';
        const message = this.escapeHtml(route.message || '');
        return `
            <section class="fiscal-print-routing">
                <p><strong>${title}</strong></p>
                ${target}
                ${message ? `<p>${message}</p>` : ''}
            </section>
        `;
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
                bodyPadding: '1.5mm 2mm 8mm',
                receiptWidth: '72mm',
                receiptMaxWidth: '72mm',
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
                bodyPadding: '1.5mm 2mm 8mm',
                receiptWidth: '50mm',
                receiptMaxWidth: '50mm',
                baseFont: '10px',
                lineHeight: '1.2',
                titleFont: '12px',
                itemBottomFont: '9px',
                totalFont: '12px'
            },
            a4: {
                pageSize: 'A4 portrait',
                pageMargin: '8mm',
                bodyWidth: 'auto',
                bodyMaxWidth: '194mm',
                bodyPadding: '0',
                receiptWidth: '194mm',
                receiptMaxWidth: '194mm',
                baseFont: '12px',
                lineHeight: '1.35',
                titleFont: '18px',
                itemBottomFont: '11px',
                totalFont: '16px'
            }
        };

        return layouts[normalized] || layouts.auto;
    }

    getFiscalLinkedSale(nota) {
        if (!nota?.vendaId || typeof db.getVendas !== 'function') {
            return null;
        }
        return db.getVendas().find((venda) => venda.id === nota.vendaId) || null;
    }

    getFiscalStatusLabel(status) {
        const normalized = String(status || '').toLowerCase();
        const labels = {
            autorizada: 'Autorizada',
            pendente: 'Pendente',
            rejeitada: 'Rejeitada',
            cancelada: 'Cancelada'
        };
        return labels[normalized] || this.capitalize(normalized);
    }

    formatDocument(value) {
        const digits = String(value || '').replace(/\D/g, '');
        if (digits.length === 11) {
            return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        if (digits.length === 14) {
            return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return String(value || '').trim() || 'Não informado';
    }

    hashToDigits(value, length = 8) {
        const source = String(value || '');
        let hash = 0;
        for (let index = 0; index < source.length; index += 1) {
            hash = (hash * 31 + source.charCodeAt(index)) % 1000000000;
        }
        return String(hash).padStart(length, '0').slice(-length);
    }

    computeNfeMod11(baseValue) {
        const digits = String(baseValue || '').replace(/\D/g, '').padStart(43, '0').slice(-43);
        let multiplier = 2;
        let total = 0;

        for (let index = digits.length - 1; index >= 0; index -= 1) {
            total += Number(digits[index]) * multiplier;
            multiplier = multiplier === 9 ? 2 : multiplier + 1;
        }

        const remainder = total % 11;
        const digit = remainder <= 1 ? 0 : 11 - remainder;
        return String(digit);
    }

    buildLocalFiscalAccessKey(nota, documento) {
        const tipoNota = String(nota?.tipo || '').toUpperCase();
        const modeloPadrao = tipoNota === 'NF-E' ? '55' : '65';
        const modelo = String(nota?.modelo || modeloPadrao).replace(/\D/g, '').padStart(2, '0').slice(-2);
        const docDigits = String(documento || '').replace(/\D/g, '').padStart(14, '0').slice(-14);
        const issueDate = new Date(nota?.dataEmissao || Date.now());
        const year = String(issueDate.getFullYear()).slice(-2);
        const month = String(issueDate.getMonth() + 1).padStart(2, '0');
        const serie = String(nota?.serie || 1).replace(/\D/g, '').padStart(3, '0').slice(-3);
        const numero = String(nota?.numero || 0).replace(/\D/g, '').padStart(9, '0').slice(-9);
        const cnfSeed = `${nota?.id || ''}${nota?.vendaId || ''}${docDigits}${numero}`;
        const cnf = this.hashToDigits(cnfSeed, 8);
        const base43 = `50${year}${month}${docDigits}${modelo}${serie}${numero}1${cnf}`;
        const dv = this.computeNfeMod11(base43);
        return `${base43}${dv}`;
    }

    formatAccessKey(value) {
        const digits = String(value || '').replace(/\D/g, '');
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }

    formatIsoDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '-';
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatIsoTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '-';
        }
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');
        return `${hour}:${minute}:${second}`;
    }

    getStoreAddressLine(config = {}) {
        const rua = String(config.enderecoRua || '').trim();
        const numero = String(config.enderecoNumero || '').trim();
        const bairro = String(config.enderecoBairro || '').trim();
        const cidade = String(config.pixCidade || '').trim();
        const uf = String(config.enderecoUf || '').trim().toUpperCase();
        const cep = String(config.enderecoCep || '').trim();

        const parts = [];
        if (rua) {
            parts.push(rua);
        }
        if (numero) {
            parts.push(`N ${numero}`);
        }
        if (bairro) {
            parts.push(bairro);
        }
        if (cidade) {
            parts.push(cidade);
        }
        if (uf) {
            parts.push(uf);
        }
        if (cep) {
            parts.push(`CEP ${cep}`);
        }

        return parts.length ? parts.join(', ') : 'Não informado';
    }

    getClientAddressLine(nota, venda) {
        const notaAddress = String(nota?.clienteEndereco || '').trim();
        if (notaAddress) {
            return notaAddress;
        }
        const saleAddress = String(venda?.cliente?.endereco || '').trim();
        if (saleAddress) {
            return saleAddress;
        }
        return 'Não informado';
    }

    buildNfeConsultaUrl(chaveAcesso) {
        const key = String(chaveAcesso || '').replace(/\D/g, '');
        if (!key) {
            return '';
        }
        return `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?chNFe=${encodeURIComponent(key)}`;
    }

    buildNfeQrCodeUrl(consultaUrl) {
        const url = String(consultaUrl || '').trim();
        if (!url) {
            return '';
        }
        return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
    }

    isValidPaymentLine(value) {
        const digits = String(value || '').replace(/\D/g, '');
        if (!/^\d{47}$|^\d{48}$/.test(digits)) {
            return false;
        }
        return !/^(\d)\1+$/.test(digits);
    }

    formatPaymentLine(value) {
        const digits = String(value || '').replace(/\D/g, '');
        if (!digits) {
            return '';
        }
        return digits.replace(/(\d{5})(?=\d)/g, '$1 ').trim();
    }

    getStoreInitials(name) {
        const tokens = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!tokens.length) {
            return 'NF';
        }
        if (tokens.length === 1) {
            return tokens[0].slice(0, 2).toUpperCase();
        }
        return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
    }

    buildThermalFiscalNoteMarkup(nota, printerProfile = 'auto') {
        const config = db.getConfig();
        const venda = this.getFiscalLinkedSale(nota);
        const documentoBruto = (config.cnpj || '').trim();
        const chaveAcesso = String(nota?.chaveAcesso || '').replace(/\D/g, '') || this.buildLocalFiscalAccessKey(nota, documentoBruto);
        const urlConsultaSefaz = String(nota?.urlConsultaSefaz || '').trim() || this.buildNfeConsultaUrl(chaveAcesso);
        const context = {
            lojaNome: (config.nomeLoja || 'EasyStore').trim() || 'EasyStore',
            documento: this.formatDocument(documentoBruto),
            inscricaoEstadual: String(config.inscricaoEstadual || '').trim() || 'Não informado',
            enderecoEmitente: this.getStoreAddressLine(config),
            enderecoDestinatario: this.getClientAddressLine(nota, venda),
            cidade: (config.pixCidade || '').trim(),
            email: (config.email || '').trim(),
            pagamentoLabel: this.getVendaPagamentoLabel({ pagamento: nota.pagamento }),
            emitidoEm: this.formatDate(nota.dataEmissao || new Date().toISOString()),
            emitidoDataIso: this.formatIsoDate(nota.dataEmissao || new Date().toISOString()),
            emitidoHoraIso: this.formatIsoTime(nota.dataEmissao || new Date().toISOString()),
            statusLabel: this.getFiscalStatusLabel(nota.status),
            chaveAcesso,
            protocoloAutorizacao: String(nota?.protocoloAutorizacao || '').trim() || '-',
            urlConsultaSefaz,
            nfeQrCodeUrl: this.buildNfeQrCodeUrl(urlConsultaSefaz),
            venda
        };

        if (String(nota.tipo || '').toUpperCase() === 'NF-E') {
            return this.buildFiscalNfeMarkup(nota, context);
        }

        return this.buildFiscalCouponMarkup(nota, context, printerProfile);
    }

    buildFiscalCouponMarkup(nota, context, printerProfile = 'auto') {
        const itens = Array.isArray(nota.itens) ? nota.itens : [];
        const venda = context.venda;
        const unidades = itens.reduce((sum, item) => sum + Number(item.qtd || 0), 0);
        const couponTitle = String(nota.tipo || '').toUpperCase() === 'NFC-E'
            ? 'DOCUMENTO AUXILIAR DA NFC-E'
            : `DOCUMENTO AUXILIAR - ${String(nota.tipo || 'FISCAL').toUpperCase()}`;
        const isNarrow = printerProfile === 'thermal58';

        const itensHtml = itens.map((item, index) => {
            const produto = db.getProduto ? db.getProduto(item.id) : null;
            const codigo = produto?.codigo || produto?.codigoBarras || item.id || '-';
            const ncm = String(produto?.ncm || '').replace(/\D/g, '').slice(0, 8);
            const quantidade = Number(item.qtd || 0);
            const valorUnitario = Number(item.preco || 0);
            const subtotal = quantidade * valorUnitario;

            return `
                <article class="fiscal-item">
                    <div class="fiscal-item-top">
                        <span>${String(index + 1).padStart(3, '0')} ${this.escapeHtml(codigo)}</span>
                        <span>${this.formatMoney(subtotal)}</span>
                    </div>
                    <p class="fiscal-item-name">${this.escapeHtml(item.nome || 'Produto')}</p>
                    <div class="fiscal-item-bottom">
                        <span>${quantidade} x ${this.formatMoney(valorUnitario)}</span>
                        <span>NCM ${ncm || '00000000'}</span>
                    </div>
                </article>
            `;
        }).join('');

        const recebido = venda?.pagamento === 'dinheiro'
            ? this.formatMoney(venda.valorRecebido || 0)
            : '-';
        const troco = venda?.pagamento === 'dinheiro'
            ? this.formatMoney(venda.troco || 0)
            : this.formatMoney(0);
        const maquininha = venda?.maquininhaNome ? this.escapeHtml(venda.maquininhaNome) : '-';
        const pixKey = venda?.pix?.chave ? this.escapeHtml(venda.pix.chave) : '-';
        const observacoes = String(nota.observacoes || '').trim();
        const clienteDocumento = String(nota?.cliente?.documento || '').replace(/\D/g, '');
        const clienteDocLabel = clienteDocumento ? this.formatDocument(clienteDocumento) : 'Não informado';

        return `
            <main class="fiscal-doc fiscal-doc-cupom${isNarrow ? ' cupom-narrow' : ''}">
                <header class="fiscal-center">
                    <h1>${this.escapeHtml(context.lojaNome)}</h1>
                    <p>CNPJ/CPF: ${this.escapeHtml(context.documento)}</p>
                    <p>Cidade: ${this.escapeHtml(context.cidade || 'Não informada')}</p>
                    <p>Email: ${this.escapeHtml(context.email || 'Não informado')}</p>
                </header>

                <section class="fiscal-box fiscal-center">
                    <p class="fiscal-title">${this.escapeHtml(couponTitle)}</p>
                    <p class="fiscal-small">Não permite aproveitamento de crédito de ICMS</p>
                </section>

                <section class="fiscal-box fiscal-meta-grid">
                    <p><strong>Documento:</strong> ${this.escapeHtml(nota.tipo)} ${this.escapeHtml(String(nota.numero))} / Serie ${this.escapeHtml(String(nota.serie || 1))}</p>
                    <p><strong>Emissao:</strong> ${this.escapeHtml(context.emitidoEm)}</p>
                    <p><strong>Status:</strong> ${this.escapeHtml(context.statusLabel)}</p>
                </section>

                <section class="fiscal-box">
                    <p class="fiscal-list-head">ITEM CÓDIGO DESCRIÇÃO</p>
                    ${itensHtml || '<p class="fiscal-empty">Sem itens na nota.</p>'}
                </section>

                <section class="fiscal-box fiscal-totals">
                    <div><span>Qtd. itens</span><strong>${itens.length}</strong></div>
                    <div><span>Total unidades</span><strong>${unidades}</strong></div>
                    <div><span>Valor total</span><strong>${this.formatMoney(nota.total)}</strong></div>
                    <div><span>Pagamento</span><strong>${this.escapeHtml(context.pagamentoLabel)}</strong></div>
                    <div><span>Valor recebido</span><strong>${recebido}</strong></div>
                    <div><span>Troco</span><strong>${troco}</strong></div>
                </section>

                <section class="fiscal-box">
                    <p><strong>CPF/CNPJ cliente:</strong> ${this.escapeHtml(clienteDocLabel)}</p>
                    <p><strong>Maquininha:</strong> ${maquininha}</p>
                    <p><strong>Chave PIX:</strong> ${pixKey}</p>
                    ${observacoes ? `<p><strong>Obs:</strong> ${this.escapeHtml(observacoes)}</p>` : ''}
                </section>

                <section class="fiscal-box fiscal-center">
                    <p class="fiscal-small">Chave de acesso local (simulada)</p>
                    <p class="fiscal-key">${this.escapeHtml(this.formatAccessKey(context.chaveAcesso))}</p>
                    <p class="fiscal-warning">EMISSÃO LOCAL PARA CONFERÊNCIA. SEM VALIDADE FISCAL OFICIAL.</p>
                </section>
            </main>
        `;
    }

    buildFiscalNfeMarkup(nota, context) {
        const itens = Array.isArray(nota.itens) ? nota.itens : [];
        const venda = context.venda;
        const clienteNome = (nota.cliente?.nome || 'CONSUMIDOR FINAL').trim() || 'CONSUMIDOR FINAL';
        const clienteDoc = this.formatDocument(nota.cliente?.documento || '');
        const clienteEndereco = context.enderecoDestinatario || 'Não informado';
        const naturezaOperacao = String(nota.naturezaOperacao || 'Venda de mercadoria').trim();
        const finalidade = String(nota.finalidade || 'Normal').trim();
        const dataEmissao = context.emitidoDataIso;
        const horaEmissao = context.emitidoHoraIso;
        const frete = Number(nota.frete ?? venda?.frete ?? 0);
        const seguro = Number(nota.seguro ?? venda?.seguro ?? 0);
        const desconto = Number(nota.desconto ?? venda?.desconto ?? 0);
        const totalProdutos = itens.reduce((sum, item) => sum + (Number(item.qtd || 0) * Number(item.preco || 0)), 0);
        const totalIcms = itens.reduce((sum, item) => {
            const subtotal = Number(item.qtd || 0) * Number(item.preco || 0);
            return sum + (subtotal * 0.18);
        }, 0);
        const totalBaseIcms = totalProdutos;
        const valorTotal = Number(nota.total || 0);
        const formaPagamento = String(nota.formaPagamento || context.pagamentoLabel || '').trim() || context.pagamentoLabel;
        const dataVencimento = nota.dataVencimento ? this.formatIsoDate(nota.dataVencimento) : dataEmissao;
        const instrucoesPagamento = String(nota.instrucoesPagamento || 'Pagamento conforme condicoes comerciais da venda.').trim();
        const protocoloAutorizacao = String(nota.protocoloAutorizacao || context.protocoloAutorizacao || '-').trim() || '-';
        const chaveAcessoDigits = String(context.chaveAcesso || '').replace(/\D/g, '');
        const chaveAcessoFormatada = this.formatAccessKey(context.chaveAcesso);
        const chaveAcessoBarcode = chaveAcessoDigits
            ? this.buildNfeAccessKeyBarcodeSvg(chaveAcessoDigits, {
                width: 560,
                moduleWidth: 1.02,
                barHeight: 72,
                showText: true
            })
            : '';
        const consultaUrl = context.urlConsultaSefaz || this.buildNfeConsultaUrl(context.chaveAcesso);
        const qrCodeUrl = context.nfeQrCodeUrl || this.buildNfeQrCodeUrl(consultaUrl);
        const incluirBoleto = Boolean(nota.cobrancaPropria) && this.isValidPaymentLine(nota.linhaDigitavel);
        const linhaDigitavel = incluirBoleto ? this.formatPaymentLine(nota.linhaDigitavel) : '';
        const pagamentoBarcode = incluirBoleto
            ? this.buildCodabarSvg(this.formatCodabarValue(String(nota.linhaDigitavel || '').replace(/\D/g, '')), {
                width: 760,
                moduleWidth: 1.15,
                barHeight: 58,
                showText: false
            })
            : '';
        const logoMonograma = this.getStoreInitials(context.lojaNome);

        const rowsHtml = itens.map((item, index) => {
            const produto = db.getProduto ? db.getProduto(item.id) : null;
            const codigo = produto?.codigo || produto?.codigoBarras || item.id || '-';
            const ncm = String(produto?.ncm || '').replace(/\D/g, '').slice(0, 8) || '00000000';
            const cfop = String(item.cfop || produto?.cfop || '5102').replace(/\D/g, '').slice(0, 4) || '5102';
            const unidade = String(item.unidade || 'UN').trim() || 'UN';
            const quantidade = Number(item.qtd || 0);
            const valorUnitario = Number(item.preco || 0);
            const subtotal = quantidade * valorUnitario;
            const aliquotaIcms = Number(item.aliquotaIcms || 18);
            const valorIcms = subtotal * (aliquotaIcms / 100);
            const outrosTributos = subtotal * 0.0925;
            return `
                <tr>
                    <td>${this.escapeHtml(String(codigo))}</td>
                    <td>${this.escapeHtml(item.nome || 'Produto')}</td>
                    <td>${this.escapeHtml(ncm)}</td>
                    <td>${this.escapeHtml(cfop)}</td>
                    <td>${this.escapeHtml(unidade)}</td>
                    <td>${quantidade.toFixed(2)}</td>
                    <td>${this.formatMoney(valorUnitario)}</td>
                    <td>${this.formatMoney(subtotal)}</td>
                    <td>${aliquotaIcms.toFixed(2)}%</td>
                    <td>${this.formatMoney(valorIcms)}</td>
                    <td>${this.formatMoney(outrosTributos)}</td>
                </tr>
            `;
        }).join('');

        return `
            <main class="fiscal-doc fiscal-doc-nfe">
                <header class="nfe-main-header">
                    <section class="nfe-logo-block">
                        <div class="nfe-logo-mark">${this.escapeHtml(logoMonograma)}</div>
                        <div class="nfe-logo-text">
                            <p class="nfe-logo-store">${this.escapeHtml(context.lojaNome)}</p>
                            <p class="nfe-logo-doc">CNPJ ${this.escapeHtml(context.documento)}</p>
                        </div>
                    </section>
                    <section class="nfe-title-block">
                        <h1>NOTA FISCAL ELETRONICA</h1>
                    </section>
                </header>

                <section class="danfe-box nfe-key-box">
                    <p><strong>Chave de Acesso:</strong> ${this.escapeHtml(chaveAcessoFormatada || '-')}</p>
                    <p><strong>Protocolo SEFAZ:</strong> ${this.escapeHtml(protocoloAutorizacao)}</p>
                    <p><strong>Consulta:</strong> ${consultaUrl ? this.escapeHtml(consultaUrl) : '-'}</p>
                </section>

                <section class="danfe-grid nfe-data-grid">
                    <section class="danfe-box">
                        <h4>Emitente</h4>
                        <p><strong>Nome:</strong> ${this.escapeHtml(context.lojaNome)}</p>
                        <p><strong>CNPJ:</strong> ${this.escapeHtml(context.documento)}</p>
                        <p><strong>Inscrição Estadual:</strong> ${this.escapeHtml(context.inscricaoEstadual)}</p>
                        <p><strong>Endereço:</strong> ${this.escapeHtml(context.enderecoEmitente)}</p>
                    </section>
                    <section class="danfe-box">
                        <h4>Destinatario</h4>
                        <p><strong>Nome:</strong> ${this.escapeHtml(clienteNome)}</p>
                        <p><strong>CPF/CNPJ:</strong> ${this.escapeHtml(clienteDoc)}</p>
                        <p><strong>Endereço:</strong> ${this.escapeHtml(clienteEndereco)}</p>
                    </section>
                </section>

                <section class="danfe-grid nfe-data-grid">
                    <section class="danfe-box">
                        <h4>Identificação da NF-e</h4>
                        <p><strong>NF-e No:</strong> ${this.escapeHtml(String(nota.numero || '-'))}</p>
                        <p><strong>Serie:</strong> ${this.escapeHtml(String(nota.serie || 1))}</p>
                        <p><strong>Data Emissao:</strong> ${this.escapeHtml(dataEmissao)}</p>
                        <p><strong>Hora Emissao:</strong> ${this.escapeHtml(horaEmissao)}</p>
                    </section>
                    <section class="danfe-box">
                        <h4>Operação</h4>
                        <p><strong>Natureza da Operação:</strong> ${this.escapeHtml(naturezaOperacao)}</p>
                        <p><strong>Finalidade:</strong> ${this.escapeHtml(finalidade)}</p>
                    </section>
                </section>

                <section class="danfe-box">
                    <h4>Itens</h4>
                    <table class="danfe-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descricao</th>
                                <th>NCM</th>
                                <th>CFOP</th>
                                <th>UN</th>
                                <th>Qtd</th>
                                <th>Vl. unit</th>
                                <th>Vl. total</th>
                                <th>Aliq. ICMS</th>
                                <th>Vl. ICMS</th>
                                <th>Outros trib.</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml || '<tr><td colspan="11">Sem itens.</td></tr>'}
                        </tbody>
                    </table>
                </section>

                <section class="danfe-grid nfe-data-grid">
                    <section class="danfe-box">
                        <h4>Totais</h4>
                        <p><strong>Base ICMS:</strong> ${this.formatMoney(totalBaseIcms)}</p>
                        <p><strong>Valor ICMS:</strong> ${this.formatMoney(totalIcms)}</p>
                        <p><strong>Valor Produtos:</strong> ${this.formatMoney(totalProdutos)}</p>
                        <p><strong>Frete:</strong> ${this.formatMoney(frete)}</p>
                        <p><strong>Seguro:</strong> ${this.formatMoney(seguro)}</p>
                        <p><strong>Desconto:</strong> ${this.formatMoney(desconto)}</p>
                        <p><strong>Valor Total:</strong> ${this.formatMoney(valorTotal)}</p>
                    </section>
                    <section class="danfe-box">
                        <h4>Informações de Pagamento</h4>
                        <p><strong>Forma:</strong> ${this.escapeHtml(formaPagamento)}</p>
                        <p><strong>Vencimento:</strong> ${this.escapeHtml(dataVencimento)}</p>
                        <p><strong>Instru??es:</strong> ${this.escapeHtml(instrucoesPagamento)}</p>
                        ${incluirBoleto
                ? `<p><strong>Linha digit?vel:</strong> ${this.escapeHtml(linhaDigitavel)}</p>`
                : '<p><strong>Cobrança própria:</strong> Não informada.</p>'}
                    </section>
                </section>

                <section class="danfe-grid nfe-footer-grid">
                    <section class="danfe-box">
                        <h4>Observa??es</h4>
                        <p>${this.escapeHtml(String(nota.observacoes || 'Documento auxiliar local para conferência e impressão.'))}</p>
                        <p><strong>Assinatura/Autentica??o:</strong> Protocolo ${this.escapeHtml(protocoloAutorizacao)} | Chave ${this.escapeHtml(chaveAcessoFormatada || '-')}</p>
                        <p class="fiscal-warning">Preencha NCM, CFOP, CST/CSOSN, base e alíquotas conforme legislação e regime tribut?rio.</p>
                    </section>
                    <section class="danfe-box nfe-qr-barcode-box">
                        <div class="nfe-qr-barcode-grid">
                            <div class="nfe-qr-box">
                                <p class="danfe-label">QR Code NF-e</p>
                                ${qrCodeUrl
                ? `<img src="${this.escapeHtml(qrCodeUrl)}" alt="QR Code de consulta da NF-e">`
                : '<p>QR Code indispon?vel sem chave de acesso.</p>'}
                            </div>
                            <div class="nfe-access-inline-box">
                                <p class="danfe-label">Chave de acesso</p>
                                <div class="nfe-access-barcode nfe-access-barcode-inline">
                                    ${chaveAcessoBarcode || '<p>C?digo de barras indispon?vel sem chave de acesso.</p>'}
                                </div>
                            </div>
                        </div>
                    </section>
                </section>

                ${incluirBoleto ? `
                    <section class="danfe-box nfe-payment-barcode-box">
                        <h4>Código de Barras para pagamento (cobrança própria)</h4>
                        <div class="nfe-payment-barcode">${pagamentoBarcode}</div>
                    </section>
                ` : ''}

                <section class="nfe-bottom-note">
                    <p>${this.escapeHtml(context.lojaNome)} | ${this.escapeHtml(context.documento)} | ${this.escapeHtml(context.enderecoEmitente)}</p>
                    <p>${consultaUrl ? `Consulta NF-e: ${this.escapeHtml(consultaUrl)}` : 'Consulta NF-e disponível após autorização na SEFAZ.'}</p>
                </section>
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

            .fiscal-doc {
                width: ${layout.receiptWidth};
                max-width: ${layout.receiptMaxWidth};
                margin: 0 auto;
                color: #000;
            }

            .fiscal-doc p,
            .fiscal-doc h1,
            .fiscal-doc h2,
            .fiscal-doc h3,
            .fiscal-doc h4 {
                margin: 0;
            }

            .fiscal-print-routing {
                border: 1px dashed #000;
                padding: 6px;
                margin-bottom: 8px;
                font-size: ${layout.itemBottomFont};
                line-height: 1.35;
            }

            .fiscal-print-routing p {
                margin-bottom: 3px;
            }

            .fiscal-center {
                text-align: center;
            }

            .fiscal-center h1 {
                font-size: ${layout.titleFont};
                text-transform: uppercase;
                line-height: 1.15;
                margin-bottom: 1mm;
            }

            .fiscal-center p {
                margin-bottom: 0.7mm;
            }

            .fiscal-box {
                border-top: 1px dashed #000;
                padding-top: 1.5mm;
                margin-top: 1.5mm;
            }

            .fiscal-title {
                font-weight: 700;
                letter-spacing: 0.2px;
                margin-bottom: 0.7mm;
            }

            .fiscal-small {
                font-size: ${layout.itemBottomFont};
            }

            .fiscal-meta-grid p {
                margin-bottom: 0.8mm;
                word-break: break-word;
            }

            .fiscal-list-head {
                font-weight: 700;
                border-bottom: 1px solid #000;
                padding-bottom: 0.7mm;
                margin-bottom: 1mm;
            }

            .fiscal-item {
                border-bottom: 1px dotted #000;
                padding-bottom: 1mm;
                margin-bottom: 1mm;
            }

            .fiscal-item-top,
            .fiscal-item-bottom,
            .fiscal-totals div {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 8px;
            }

            .fiscal-item-top {
                font-weight: 700;
            }

            .fiscal-item-name {
                margin-top: 0.5mm;
                margin-bottom: 0.6mm;
                word-break: break-word;
            }

            .fiscal-item-bottom {
                font-size: ${layout.itemBottomFont};
            }

            .fiscal-empty {
                text-align: center;
                padding: 3mm 0;
                color: #444;
            }

            .fiscal-totals div {
                margin-bottom: 0.8mm;
            }

            .fiscal-totals strong {
                font-size: ${layout.totalFont};
            }

            .fiscal-key {
                margin-top: 1mm;
                margin-bottom: 1mm;
                font-weight: 700;
                letter-spacing: 0.3px;
                word-break: break-all;
            }

            .fiscal-warning {
                font-weight: 700;
                font-size: ${layout.itemBottomFont};
                line-height: 1.3;
            }

            .fiscal-doc-cupom {
                padding-bottom: 6mm;
            }

            .fiscal-doc-cupom::after {
                content: '';
                display: block;
                height: 6mm;
            }

            .cupom-narrow .fiscal-item-top,
            .cupom-narrow .fiscal-item-bottom,
            .cupom-narrow .fiscal-totals div {
                gap: 4px;
            }

            .fiscal-doc-nfe {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 10px;
                line-height: 1.35;
                position: relative;
                min-height: 260mm;
            }

            .nfe-watermark {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
                color: rgba(0, 0, 0, 0.06);
                font-size: 56px;
                font-weight: 700;
                text-transform: uppercase;
                transform: rotate(-28deg);
                letter-spacing: 3px;
                z-index: 0;
            }

            .nfe-main-header {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 10px;
                align-items: center;
                margin-bottom: 8px;
                border: 1px solid #000;
                padding: 8px;
                position: relative;
                z-index: 1;
            }

            .nfe-logo-block {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .nfe-logo-mark {
                width: 52px;
                height: 52px;
                border: 1px solid #000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: 700;
                border-radius: 6px;
            }

            .nfe-logo-store {
                font-weight: 700;
                text-transform: uppercase;
                font-size: 11px;
                margin-bottom: 2px;
            }

            .nfe-logo-doc {
                font-size: 9px;
            }

            .nfe-title-block {
                text-align: center;
            }

            .nfe-title-block h1 {
                margin: 0 0 4px;
                font-size: 24px;
                letter-spacing: 0.8px;
                text-transform: uppercase;
            }

            .nfe-title-block p {
                margin: 0;
                font-size: 11px;
                text-transform: uppercase;
            }

            .nfe-key-box {
                position: relative;
                z-index: 1;
            }

            .nfe-key-box p {
                margin-bottom: 3px;
            }

            .nfe-access-barcode-box {
                margin-bottom: 6px;
            }

            .nfe-access-barcode {
                margin-top: 4px;
                border: 1px solid #000;
                padding: 4px;
                background: #fff;
            }

            .nfe-access-barcode svg {
                width: 100%;
                height: auto;
                display: block;
            }

            .nfe-access-barcode-inline {
                margin-top: 0;
                min-height: 170px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 6px;
            }

            .nfe-access-barcode-note {
                margin-top: 4px;
                font-size: 9px;
                line-height: 1.35;
            }

            .danfe-header {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 300px;
                gap: 6px;
                margin-bottom: 6px;
            }

            .danfe-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 6px;
                margin-bottom: 6px;
            }

            .danfe-box {
                border: 1px solid #000;
                padding: 6px;
                position: relative;
                z-index: 1;
            }

            .danfe-highlight {
                text-align: center;
            }

            .danfe-highlight h3 {
                font-size: 18px;
                margin-bottom: 2px;
            }

            .danfe-highlight p {
                margin-bottom: 2px;
            }

            .danfe-box h2 {
                font-size: 17px;
                text-transform: uppercase;
                margin-bottom: 4px;
            }

            .danfe-box h4 {
                font-size: 12px;
                margin-bottom: 6px;
                text-transform: uppercase;
            }

            .danfe-box p {
                margin-bottom: 3px;
            }

            .danfe-label {
                font-size: 10px;
                text-transform: uppercase;
            }

            .nfe-data-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .danfe-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
            }

            .danfe-table th,
            .danfe-table td {
                border: 1px solid #000;
                padding: 4px;
                vertical-align: top;
            }

            .danfe-table th {
                background: #f2f2f2;
                text-transform: uppercase;
                font-size: 9px;
                font-weight: 700;
            }

            .nfe-footer-grid {
                grid-template-columns: minmax(0, 1.8fr) minmax(220px, 0.8fr);
                align-items: stretch;
            }

            .nfe-qr-barcode-box {
                display: flex;
                align-items: stretch;
            }

            .nfe-qr-barcode-grid {
                width: 100%;
                display: grid;
                grid-template-columns: minmax(180px, 0.9fr) minmax(0, 1.1fr);
                gap: 8px;
                align-items: stretch;
            }

            .nfe-qr-box,
            .nfe-access-inline-box {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            .nfe-qr-box img {
                width: 160px;
                height: 160px;
                object-fit: contain;
                border: 1px solid #000;
                padding: 4px;
                background: #fff;
            }

            .nfe-access-inline-box {
                align-items: stretch;
            }

            .nfe-payment-barcode-box {
                margin-top: 6px;
                position: relative;
                z-index: 1;
            }

            .nfe-payment-barcode {
                margin-top: 6px;
                border: 1px solid #000;
                padding: 5px;
                background: #fff;
            }

            .nfe-bottom-note {
                margin-top: 8px;
                border-top: 1px solid #000;
                padding-top: 6px;
                font-size: 9px;
                line-height: 1.3;
                position: relative;
                z-index: 1;
            }

            .nfe-bottom-note p {
                margin-bottom: 2px;
            }

            @media (max-width: 960px) {
                .nfe-main-header,
                .danfe-header {
                    grid-template-columns: 1fr;
                }

                .danfe-grid,
                .nfe-footer-grid {
                    grid-template-columns: 1fr;
                }

                .nfe-qr-barcode-grid {
                    grid-template-columns: 1fr;
                }
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
    showFiscalNoteModal(content, printStyles = '', printPayload = null) {
        if (!this.elements.fiscalNoteModal || !this.elements.fiscalNoteContent) {
            return;
        }
        this.lastFiscalNoteHtml = content;
        this.lastFiscalNotePrintStyles = printStyles;
        if (printPayload) {
            this.lastFiscalPrintPayload = printPayload;
        }
        this.elements.fiscalNoteContent.innerHTML = `
            ${content}
            <div style="margin-top: 16px; font-size: 0.95rem; color: #555;">
                <p>A impressão automática não foi concluída. Clique em Imprimir para tentar novamente sem abrir uma segunda tela.</p>
            </div>
        `;
        this.elements.fiscalNoteModal.classList.add('show');
        this.elements.fiscalNoteModal.setAttribute('aria-hidden', 'false');
    }

    async printFiscalNoteFromModal() {
        const content = this.lastFiscalNoteHtml || this.elements.fiscalNoteContent?.innerHTML;
        const config = db.getConfig ? db.getConfig() : {};
        const fallbackProfile = this.normalizeNfcePrinterProfile(config.fiscalPrinterProfileNfce || config.fiscalPrinterProfile);
        const printStyles = this.lastFiscalNotePrintStyles || this.getThermalFiscalNotePrintStyles(fallbackProfile);
        if (!content) {
            return;
        }

        const payload = this.lastFiscalPrintPayload || {
            documentType: 'Nota Fiscal',
            title: 'Nota Fiscal',
            content,
            printStyles,
            html: this.buildFiscalPrintDocument('Nota Fiscal', content, printStyles),
            profile: fallbackProfile,
            printerName: '',
            printerLabel: ''
        };

        const result = await this.printFiscalPayload(payload);
        if (result.ok) {
            this.closeFiscalNoteModal();
        }
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
        this.lastFiscalPrintPayload = null;
    }

    buildNfeAccessKeyBarcodeSvg(
        accessKey,
        {
            width = 860,
            height = null,
            moduleWidth = 1.1,
            barHeight = 58,
            showText = true,
            textSize = 13,
            textGap = 7
        } = {}
    ) {
        const digits = String(accessKey || '').replace(/\D/g, '');
        if (!digits) {
            return '';
        }

        const pattern = this.encodeInterleaved2of5(digits);
        if (!pattern.length) {
            return '<div style="color:#b00; font-size:12px;">Código da chave de acesso inválido para código de barras.</div>';
        }

        let x = 0;
        const rects = pattern.map((widthUnit, index) => {
            const elementWidth = widthUnit * moduleWidth;
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
        const label = this.formatAccessKey(digits);
        const contentHeight = showText ? barHeight + textGap + textSize : barHeight;
        const svgHeight = height || contentHeight;
        const textNode = showText
            ? `<text x="50%" y="${barHeight + textGap + textSize - 2}" text-anchor="middle" font-family="monospace" font-size="${textSize}">${this.escapeHtml(label)}</text>`
            : '';

        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${svgHeight}" viewBox="0 0 ${totalWidth} ${contentHeight}" role="img" aria-label="Código de barras da chave de acesso da NF-e">
                <rect width="100%" height="100%" fill="#fff" />
                <g transform="translate(${startX},0)">${rects}</g>
                ${textNode}
            </svg>
        `;
    }

    encodeInterleaved2of5(value) {
        const digits = String(value || '').replace(/\D/g, '');
        if (!digits) {
            return [];
        }

        const normalized = digits.length % 2 === 0 ? digits : `0${digits}`;
        const map = {
            '0': 'nnwwn',
            '1': 'wnnnw',
            '2': 'nwnnw',
            '3': 'wwnnn',
            '4': 'nnwnw',
            '5': 'wnwnn',
            '6': 'nwwnn',
            '7': 'nnnww',
            '8': 'wnnwn',
            '9': 'nwnwn'
        };

        const units = [];

        // Start pattern (bar/space/bar/space) for Interleaved 2 of 5.
        units.push(1, 1, 1, 1);

        for (let index = 0; index < normalized.length; index += 2) {
            const barPattern = map[normalized[index]];
            const spacePattern = map[normalized[index + 1]];
            if (!barPattern || !spacePattern) {
                return [];
            }

            for (let patternIndex = 0; patternIndex < 5; patternIndex += 1) {
                units.push(barPattern[patternIndex] === 'w' ? 3 : 1);
                units.push(spacePattern[patternIndex] === 'w' ? 3 : 1);
            }
        }

        // Stop pattern (bar/space/bar) for Interleaved 2 of 5.
        units.push(3, 1, 1);

        return units;
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
            this.mostrarMsg('Informe o código de barras para adicionar o produto.', 'warning');
            return false;
        }

        const produto = this.findProductByBarcode(barcode);
        if (!produto) {
            this.mostrarMsg('Produto não encontrado para este código de barras.', 'warning');
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

        const precoScanner = this.isWholesaleFiscalProfile()
            ? `${this.formatMoney(0)} (editável)`
            : this.formatMoney(produto.preco);
        this.mostrarMsg(`Scanner: "${produto.nome}" ${precoScanner} adicionado.`, 'success');
        this.updateSaleEntryStatus(`Leitura confirmada: ${produto.nome} | ${precoScanner} adicionado ao carrinho.`);
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

    async openScannerModal({ mode = 'sale', closeAfterSuccess = false } = {}) {
        this.scannerMode = mode;
        this.scannerCloseAfterSuccess = Boolean(closeAfterSuccess);
        this.elements.scannerModal.classList.add('show');
        this.elements.scannerModal.setAttribute('aria-hidden', 'false');
        this.elements.scannerStatus.textContent = mode === 'product'
            ? 'Aguardando câmera para ler o código do produto...'
            : 'Aguardando câmera...';

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
        this.elements.scannerStatus.textContent = `Código detectado: ${normalizedValue}`;

        if (this.scannerMode === 'product') {
            this.handleProductBarcodeDetected(normalizedValue);
        } else {
            this.elements.vendaScanInput.value = normalizedValue;
            const added = this.addItemByScan({ source: 'camera', forceQuantity: 1, focusScanInput: false });
            if (added) {
                this.elements.scannerStatus.textContent = `Item adicionado: ${normalizedValue}. Continue escaneando...`;
            }
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
        this.elements.scannerStatus.textContent = 'Aguardando permissão da câmera.';
        this.currentScannedBarcode = null;
        this.lastBarcodeDetectedAt = 0;
        this.scannerMode = 'sale';
        this.scannerCloseAfterSuccess = false;
    }

    openProductBarcodeScanner() {
        this.openScannerModal({ mode: 'product', closeAfterSuccess: true });
    }

    handleProductBarcodeDetected(barcodeValue) {
        if (!this.elements.prodBarcode) {
            return;
        }

        this.elements.prodBarcode.value = barcodeValue;
        this.elements.scannerStatus.textContent = `Código detectado: ${barcodeValue}`;

        const produtoExistente = this.findProductByBarcode(barcodeValue);
        const isProdutoEditado = Boolean(produtoExistente && this.prodEditando && produtoExistente.id === this.prodEditando);

        if (produtoExistente && !isProdutoEditado) {
            const abrirExistente = window.confirm(
                `Este código já está cadastrado para "${produtoExistente.nome}". Deseja abrir este produto para edição?`
            );
            this.closeScannerModal();

            if (abrirExistente) {
                this.editarProd(produtoExistente.id);
                return;
            }

            if (!this.elements.modal.classList.contains('show')) {
                this.abrirModalProd();
            }
            this.elements.prodBarcode.focus();
            this.elements.prodBarcode.select();
            this.mostrarMsg(`Código lido para cadastro. Já existe produto com este código: ${produtoExistente.nome}.`, 'warning');
            return;
        }

        this.mostrarMsg(`Código de barras ${barcodeValue} preenchido no cadastro do produto.`, 'success');
        if (this.scannerCloseAfterSuccess) {
            this.closeScannerModal();
        }
        if (this.elements.modal.classList.contains('show')) {
            this.elements.prodBarcode.focus();
            this.elements.prodBarcode.select();
        }
    }

    openSaleProductPicker() {
        if (!this.isSectionActive('vendas') || !this.elements.saleProductModal) {
            return;
        }

        this.saleProductPickerResults = [];
        this.saleProductPickerIndex = -1;
        if (this.elements.saleProductSearch) {
            this.elements.saleProductSearch.value = '';
        }
        if (this.elements.saleProductQty) {
            const rawCurrentQty = Number(this.elements.vendaQty?.value);
            const currentQty = Number.isFinite(rawCurrentQty) ? Math.floor(rawCurrentQty) : 1;
            this.elements.saleProductQty.value = String(currentQty > 0 ? currentQty : 1);
        }
        this.renderSaleProductPicker();
        this.elements.saleProductModal.classList.add('show');
        this.elements.saleProductModal.setAttribute('aria-hidden', 'false');

        window.setTimeout(() => {
            if (this.elements.saleProductSearch) {
                this.elements.saleProductSearch.focus();
                this.elements.saleProductSearch.select();
            }
        }, 50);
    }

    closeSaleProductPicker({ restoreFocus = true } = {}) {
        if (!this.elements.saleProductModal) {
            return;
        }

        this.elements.saleProductModal.classList.remove('show');
        this.elements.saleProductModal.setAttribute('aria-hidden', 'true');

        if (restoreFocus && this.isSectionActive('vendas') && this.elements.vendaScanInput) {
            this.elements.vendaScanInput.focus();
        }
    }

    renderSaleProductPicker() {
        if (!this.elements.tbSaleProductPicker) {
            return;
        }

        const query = (this.elements.saleProductSearch?.value || '').trim().toLowerCase();
        const produtos = db.getProdutos().filter((produto) => {
            if (!query) {
                return true;
            }
            const codigoBarras = String(produto.codigoBarras || '').toLowerCase();
            return String(produto.nome || '').toLowerCase().includes(query)
                || String(produto.codigo || '').toLowerCase().includes(query)
                || codigoBarras.includes(query);
        });
        const selectedId = this.saleProductPickerResults[this.saleProductPickerIndex]?.id;
        this.saleProductPickerResults = produtos;

        if (!produtos.length) {
            this.saleProductPickerIndex = -1;
            this.elements.tbSaleProductPicker.innerHTML = '<tr><td colspan="5" class="empty">Nenhum produto encontrado</td></tr>';
            if (this.elements.saleProductPickerStatus) {
                this.elements.saleProductPickerStatus.textContent = 'Nenhum produto encontrado para essa busca.';
            }
            return;
        }
        const previousSelectionIndex = selectedId
            ? produtos.findIndex((produto) => produto.id === selectedId && this.isSaleProductSelectable(produto))
            : -1;
        this.saleProductPickerIndex = previousSelectionIndex >= 0
            ? previousSelectionIndex
            : this.getFirstAvailableSaleProductIndex(produtos);

        this.elements.tbSaleProductPicker.innerHTML = produtos.map((produto, index) => {
            const semEstoque = Number(produto.estoque || 0) <= 0;
            const selectedClass = index === this.saleProductPickerIndex ? ' sale-product-row-selected' : '';
            return `
                <tr class="${selectedClass.trim()}" data-picker-index="${index}">
                    <td>${produto.codigo}</td>
                    <td>${produto.nome}</td>
                    <td>${produto.estoque}</td>
                    <td>${this.formatMoney(produto.preco)}</td>
                    <td>
                        <button
                            type="button"
                            class="btn btn-primary btn-small sale-product-action-btn"
                            data-pick-product="${produto.id}"
                            ${semEstoque ? 'disabled' : ''}
                        >
                            ${semEstoque ? 'Sem estoque' : 'Selecionar'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        this.ensureSaleProductSelectionVisible();

        if (this.elements.saleProductPickerStatus) {
            const disponiveis = produtos.filter((produto) => this.isSaleProductSelectable(produto)).length;
            this.elements.saleProductPickerStatus.textContent = `${produtos.length} produto(s) listado(s), ${disponiveis} disponível(is). Use setas para navegar, TAB para botões e ENTER para selecionar.`;
        }
    }

    pickFirstSaleProductFromPicker() {
        this.pickSaleProductFromCurrentSelection();
    }

    isSaleProductSelectable(produto) {
        return Number(produto?.estoque || 0) > 0;
    }

    getFirstAvailableSaleProductIndex(produtos = this.saleProductPickerResults) {
        return produtos.findIndex((produto) => this.isSaleProductSelectable(produto));
    }

    moveSaleProductPickerSelection(step) {
        const produtos = this.saleProductPickerResults;
        if (!produtos.length) {
            return;
        }

        const availableIndexes = produtos
            .map((produto, index) => (this.isSaleProductSelectable(produto) ? index : -1))
            .filter((index) => index >= 0);

        if (!availableIndexes.length) {
            this.mostrarMsg('Nenhum produto com estoque disponível nesta lista.', 'warning');
            return;
        }

        if (this.saleProductPickerIndex < 0 || !this.isSaleProductSelectable(produtos[this.saleProductPickerIndex])) {
            this.saleProductPickerIndex = availableIndexes[0];
        } else {
            const currentPosition = availableIndexes.indexOf(this.saleProductPickerIndex);
            const nextPosition = (currentPosition + step + availableIndexes.length) % availableIndexes.length;
            this.saleProductPickerIndex = availableIndexes[nextPosition];
        }

        this.renderSaleProductPicker();
    }

    ensureSaleProductSelectionVisible() {
        if (!this.elements.tbSaleProductPicker || this.saleProductPickerIndex < 0) {
            return;
        }

        const selectedRow = this.elements.tbSaleProductPicker.querySelector(`tr[data-picker-index="${this.saleProductPickerIndex}"]`);
        if (selectedRow) {
            selectedRow.scrollIntoView({ block: 'nearest' });
        }
    }

    getSaleProductPickerQuantity() {
        const rawQuantity = Number(this.elements.saleProductQty?.value);
        const quantity = Number.isFinite(rawQuantity) ? Math.floor(rawQuantity) : 1;
        return quantity > 0 ? quantity : 1;
    }

    pickSaleProductFromCurrentSelection() {
        if (!this.saleProductPickerResults.length) {
            this.mostrarMsg('Nenhum produto encontrado para selecionar.', 'warning');
            return;
        }

        let selectedProduct = this.saleProductPickerResults[this.saleProductPickerIndex];
        if (!this.isSaleProductSelectable(selectedProduct)) {
            const fallbackIndex = this.getFirstAvailableSaleProductIndex();
            selectedProduct = fallbackIndex >= 0 ? this.saleProductPickerResults[fallbackIndex] : null;
            if (fallbackIndex >= 0) {
                this.saleProductPickerIndex = fallbackIndex;
            }
        }

        if (!selectedProduct) {
            this.mostrarMsg('Nenhum produto disponível para selecionar.', 'warning');
            return;
        }

        this.pickSaleProductFromPicker(selectedProduct.id);
    }

    pickSaleProductFromPicker(productId) {
        if (!productId) {
            return;
        }

        const quantity = this.getSaleProductPickerQuantity();
        if (this.elements.saleProductQty) {
            this.elements.saleProductQty.value = String(quantity);
        }
        this.elements.selectVenda.value = productId;
        if (this.elements.vendaQty) {
            this.elements.vendaQty.value = String(quantity);
        }

        const added = this.addItemVenda();
        if (!added) {
            return;
        }

        this.closeSaleProductPicker({ restoreFocus: false });
        this.focusSaleSummaryPayment();
        this.mostrarMsg(`Produto selecionado com quantidade ${quantity}. Indo para resumo e pagamento.`, 'success');
    }

    focusSaleSummaryPayment() {
        if (this.elements.posSummaryPanel) {
            this.elements.posSummaryPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        window.setTimeout(() => {
            if (this.elements.vendaPagamento) {
                this.elements.vendaPagamento.focus();
            }
        }, 220);
    }

    handleGlobalShortcuts(event) {
        if (event.defaultPrevented) {
            return;
        }

        const target = event.target;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

        const saleSectionActive = this.isSectionActive('vendas') || this.isSalesOnlyMode();

        if (event.key === 'F10' || event.code === 'F10' || event.keyCode === 121) {
            if (!saleSectionActive) {
                return;
            }
            event.preventDefault();
            this.openSaleProductPicker();
            return;
        }

        if (event.key === 'F9') {
            if (!saleSectionActive) {
                return;
            }
            event.preventDefault();
            const saleProductModalOpen = this.elements.saleProductModal
                && this.elements.saleProductModal.classList.contains('show');
            if (saleProductModalOpen && this.elements.saleProductQty) {
                this.elements.saleProductQty.focus();
                this.elements.saleProductQty.select();
                return;
            }
            if (this.elements.vendaQty) {
                this.elements.vendaQty.focus();
                this.elements.vendaQty.select();
            }
            return;
        }

        if (event.key === 'F6') {
            if (!saleSectionActive) {
                return;
            }
            event.preventDefault();
            this.setSaleFiscalProfile('varejo');
            return;
        }

        if (event.key === 'F7') {
            if (!saleSectionActive) {
                return;
            }
            event.preventDefault();
            this.setSaleFiscalProfile('atacado', { focusWholesalePrice: true });
            return;
        }

        if (
            event.ctrlKey
            && !event.shiftKey
            && !event.altKey
            && !event.metaKey
            && event.key.toLowerCase() === 'c'
        ) {
            if (!saleSectionActive || !this.isRetailFiscalProfile()) {
                return;
            }
            const selectedText = window.getSelection ? String(window.getSelection() || '').trim() : '';
            if (isTyping || selectedText) {
                return;
            }
            event.preventDefault();
            this.showCustomerDocumentField('cpf');
            return;
        }

        if (
            event.ctrlKey
            && !event.shiftKey
            && !event.altKey
            && !event.metaKey
            && event.key.toLowerCase() === 'm'
        ) {
            if (!saleSectionActive || !this.isWholesaleFiscalProfile()) {
                return;
            }
            if (isTyping) {
                return;
            }
            event.preventDefault();
            this.showCustomerDocumentField('cnpj');
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

        if (event.ctrlKey && event.key === 'Enter') {
            if (saleSectionActive) {
                event.preventDefault();
                this.addItemVenda();
            }
            return;
        }

        if (event.key === 'F12') {
            if (saleSectionActive) {
                event.preventDefault();
                this.finalizarVenda();
            }
            return;
        }

        if (event.ctrlKey && event.key === 'Delete') {
            if (saleSectionActive) {
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
            if (saleSectionActive) {
                event.preventDefault();
                this.setSalePaymentMethod('dinheiro');
                if (this.elements.vendaValorRecebido) {
                    this.elements.vendaValorRecebido.focus();
                }
            }
            return;
        }

        if (event.key === 'F2') {
            if (saleSectionActive) {
                event.preventDefault();
                this.setSalePaymentMethod('debito');
            }
            return;
        }

        if (event.key === 'F3') {
            if (saleSectionActive) {
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

        if (event.key === 'F5') {
            if (saleSectionActive) {
                event.preventDefault();
                this.openScannerModal();
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
            if (this.elements.saleProductModal && this.elements.saleProductModal.classList.contains('show')) {
                this.closeSaleProductPicker();
                event.preventDefault();
                return;
            }
            if (saleSectionActive) {
                if (this.vendaAtual.length > 0) {
                    this.cancelarVenda();
                    event.preventDefault();
                    return;
                }
                if (this.isSalesOnlyMode()) {
                    event.preventDefault();
                    this.handleSalesOnlyEscExit();
                    return;
                }
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

    isSalesOnlyMode() {
        return Boolean(document.body?.classList.contains('sales-only'));
    }

    handleSalesOnlyEscExit() {
        const now = Date.now();
        const isSecondEsc = (now - this.salesOnlyEscExitArmedAt) <= this.salesOnlyEscExitWindowMs;
        if (isSecondEsc) {
            window.location.href = '/';
            return;
        }

        this.salesOnlyEscExitArmedAt = now;
        this.mostrarMsg('Pressione Esc novamente para sair da pagina de vendas.', 'warning');
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

    isWholesaleFiscalProfile() {
        return this.elements.vendaPerfilFiscal?.value === 'atacado';
    }

    isRetailFiscalProfile() {
        return this.elements.vendaPerfilFiscal?.value === 'varejo';
    }

    normalizeCpf(value) {
        return String(value || '').replace(/\D/g, '').slice(0, 11);
    }

    formatCpfInput(value) {
        const digits = this.normalizeCpf(value);
        if (!digits) {
            return '';
        }
        if (digits.length <= 3) {
            return digits;
        }
        if (digits.length <= 6) {
            return digits.replace(/(\d{3})(\d+)/, '$1.$2');
        }
        if (digits.length <= 9) {
            return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
        }
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
    }

    isValidCpf(value) {
        const cpf = this.normalizeCpf(value);
        if (cpf.length !== 11) {
            return false;
        }
        if (/^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        const calculateDigit = (base, factorStart) => {
            const total = base
                .split('')
                .reduce((sum, digit, index) => sum + (Number(digit) * (factorStart - index)), 0);
            const remainder = (total * 10) % 11;
            return remainder === 10 ? 0 : remainder;
        };

        const baseNine = cpf.slice(0, 9);
        const digit1 = calculateDigit(baseNine, 10);
        const digit2 = calculateDigit(`${baseNine}${digit1}`, 11);
        return cpf === `${baseNine}${digit1}${digit2}`;
    }

    normalizeCnpj(value) {
        return String(value || '').replace(/\D/g, '').slice(0, 14);
    }

    formatCnpjInput(value) {
        const digits = this.normalizeCnpj(value);
        if (!digits) {
            return '';
        }
        if (digits.length <= 2) {
            return digits;
        }
        if (digits.length <= 5) {
            return digits.replace(/(\d{2})(\d+)/, '$1.$2');
        }
        if (digits.length <= 8) {
            return digits.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
        }
        if (digits.length <= 12) {
            return digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
        }
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
    }

    isValidCnpj(value) {
        const cnpj = this.normalizeCnpj(value);
        if (cnpj.length !== 14) {
            return false;
        }
        if (/^(\d)\1{13}$/.test(cnpj)) {
            return false;
        }

        const calculateDigit = (base, factors) => {
            const total = base
                .split('')
                .reduce((sum, digit, index) => sum + (Number(digit) * factors[index]), 0);
            const remainder = total % 11;
            return remainder < 2 ? 0 : 11 - remainder;
        };

        const base12 = cnpj.slice(0, 12);
        const digit1 = calculateDigit(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        const digit2 = calculateDigit(`${base12}${digit1}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        return cnpj === `${base12}${digit1}${digit2}`;
    }

    updateCustomerDocumentUi() {
        const profile = this.elements.vendaPerfilFiscal?.value || 'varejo';
        const varejo = profile === 'varejo';
        const atacado = profile === 'atacado';

        if (this.elements.varejoCustomerFields) {
            if (!varejo) {
                this.elements.varejoCustomerFields.hidden = true;
            }
        }
        if (this.elements.atacadoCustomerFields) {
            if (!atacado) {
                this.elements.atacadoCustomerFields.hidden = true;
            }
        }
    }

    updateWholesaleCustomerUi() {
        this.updateCustomerDocumentUi();
    }

    showCustomerDocumentField(type) {
        const normalizedType = type === 'cnpj' ? 'cnpj' : 'cpf';
        const profile = this.elements.vendaPerfilFiscal?.value || 'varejo';
        if (normalizedType === 'cpf' && profile !== 'varejo') {
            return false;
        }
        if (normalizedType === 'cnpj' && profile !== 'atacado') {
            return false;
        }

        if (this.elements.varejoCustomerFields) {
            this.elements.varejoCustomerFields.hidden = normalizedType !== 'cpf';
        }
        if (this.elements.atacadoCustomerFields) {
            this.elements.atacadoCustomerFields.hidden = normalizedType !== 'cnpj';
        }

        const field = normalizedType === 'cpf' ? this.elements.vendaClienteCpf : this.elements.vendaClienteCnpj;
        if (!field) {
            return false;
        }
        field.focus();
        field.select();
        return true;
    }

    hideCustomerDocumentFields() {
        if (this.elements.varejoCustomerFields) {
            this.elements.varejoCustomerFields.hidden = true;
        }
        if (this.elements.atacadoCustomerFields) {
            this.elements.atacadoCustomerFields.hidden = true;
        }
    }

    setSaleFiscalProfile(profile, { focusWholesalePrice = false } = {}) {
        if (!this.elements.vendaPerfilFiscal) {
            return;
        }

        const normalizedProfile = profile === 'atacado' ? 'atacado' : 'varejo';
        this.elements.vendaPerfilFiscal.value = normalizedProfile;
        this.handleSaleFiscalProfileChange({ showFeedback: false, focusWholesalePrice });
        const label = normalizedProfile === 'atacado' ? 'Atacado (NF-e)' : 'Varejo (NFC-e)';
        this.mostrarMsg(`Perfil fiscal definido: ${label}.`, 'success');
    }

    getUnitPriceForCurrentFiscalProfile(produto) {
        if (!produto) {
            return 0;
        }
        return this.isWholesaleFiscalProfile() ? 0 : Number(produto.preco || 0);
    }

    handleSaleFiscalProfileChange({ showFeedback = true, focusWholesalePrice = false } = {}) {
        this.updateCustomerDocumentUi();

        if (!this.vendaAtual.length) {
            this.updateSaleEntryStatus();
            this.renderItensVenda();
            if (focusWholesalePrice && this.isWholesaleFiscalProfile()) {
                this.focusWholesalePriceInput();
            }
            return;
        }

        if (this.isWholesaleFiscalProfile()) {
            this.vendaAtual = this.vendaAtual.map((item) => ({
                ...item,
                precoBase: Number(item.precoBase ?? db.getProduto(item.id)?.preco ?? item.preco ?? 0),
                preco: 0
            }));
            if (showFeedback) {
                this.mostrarMsg('Perfil atacado ativo: preços dos itens zerados para edição manual.', 'success');
            }
        } else {
            this.vendaAtual = this.vendaAtual.map((item) => {
                const produto = db.getProduto(item.id);
                const precoBase = Number(produto?.preco ?? item.precoBase ?? item.preco ?? 0);
                return {
                    ...item,
                    precoBase,
                    preco: precoBase
                };
            });
            if (showFeedback) {
                this.mostrarMsg('Perfil fiscal alterado: preços padrão restaurados.', 'success');
            }
        }

        this.updateSaleEntryStatus();
        this.renderItensVenda();
        if (focusWholesalePrice && this.isWholesaleFiscalProfile()) {
            this.focusWholesalePriceInput();
        }
    }

    focusWholesalePriceInput(index = 0) {
        window.setTimeout(() => {
            if (!this.isWholesaleFiscalProfile()) {
                return;
            }

            const totalItems = this.vendaAtual.length;
            if (!totalItems) {
                if (this.elements.selectVenda) {
                    this.elements.selectVenda.focus();
                }
                return;
            }

            const safeIndex = Math.max(0, Math.min(index, totalItems - 1));
            const priceInput = this.elements.tbItens?.querySelector(`[data-item-price-index="${safeIndex}"]`);
            if (!priceInput) {
                return;
            }
            priceInput.focus();
            priceInput.select();
        }, 50);
    }

    updateSaleItemPrice(index, rawValue) {
        if (!this.isWholesaleFiscalProfile()) {
            return;
        }

        if (!Number.isInteger(index) || index < 0 || index >= this.vendaAtual.length) {
            return;
        }

        const parsedValue = Number(String(rawValue || '').replace(',', '.'));
        const novoPreco = Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
        this.vendaAtual[index].preco = novoPreco;
        this.renderItensVenda();
        this.updateSaleEntryStatus(`Preço do item "${this.vendaAtual[index].nome}" atualizado para ${this.formatMoney(novoPreco)}.`);
    }

    confirmSaleItemPriceByEnter(index, rawValue) {
        if (!this.isWholesaleFiscalProfile()) {
            return;
        }
        if (!Number.isInteger(index) || index < 0 || index >= this.vendaAtual.length) {
            return;
        }

        this.updateSaleItemPrice(index, rawValue);
        const nextIndex = Math.min(index + 1, this.vendaAtual.length - 1);
        this.focusWholesalePriceInput(nextIndex);
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
            this.mostrarMsg('Produto não encontrado.', 'warning');
            this.updateSaleEntryStatus('Produto não encontrado. Revise o cadastro antes de vender.');
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
            const precoBase = Number(produto.preco || 0);
            this.vendaAtual.push({
                id: produto.id,
                nome: produto.nome,
                qtd: quantidade,
                precoBase,
                preco: this.getUnitPriceForCurrentFiscalProfile(produto)
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
        const atacadoAtivo = this.isWholesaleFiscalProfile();

        if (!this.vendaAtual.length) {
            this.elements.tbItens.innerHTML = '<tr><td colspan="5" class="empty">Nenhum item</td></tr>';
            document.getElementById('venda-total').textContent = this.formatMoney(0);
            this.updateSaleKpis(0);
            this.updateChangePreview();
            this.updatePixPreview();
            this.scheduleSalesStaticFit();
            return;
        }

        this.elements.tbItens.innerHTML = this.vendaAtual.map((item, index) => {
            const subtotal = item.preco * item.qtd;
            const precoUnitario = atacadoAtivo
                ? `
                    <input
                        type="number"
                        class="sale-item-price-input"
                        data-item-price-index="${index}"
                        min="0"
                        step="0.01"
                        value="${Number(item.preco || 0).toFixed(2)}"
                    >
                `
                : this.formatMoney(item.preco);

            return `
                <tr>
                    <td>${item.nome}</td>
                    <td>${item.qtd}</td>
                    <td>${precoUnitario}</td>
                    <td>${this.formatMoney(subtotal)}</td>
                    <td><button class="btn btn-danger btn-small" data-remove-item="${index}">Remover</button></td>
                </tr>
            `;
        }).join('');

        document.getElementById('venda-total').textContent = this.formatMoney(total);
        this.updateSaleKpis(total);
        this.updateChangePreview();
        this.updatePixPreview();
        this.scheduleSalesStaticFit();
    }

    getSaleTotal() {
        return this.vendaAtual.reduce((soma, item) => soma + (item.qtd * item.preco), 0);
    }

    buildAtacadoNfePayload(venda, nota) {
        const config = db.getConfig ? db.getConfig() : {};
        const cidadePadrao = (config.pixCidade || 'CAMPO GRANDE').trim().toUpperCase();
        const customerDoc = String(venda?.cliente?.documento || '').trim();
        const customerName = String(venda?.cliente?.nome || '').trim() || 'CONSUMIDOR FINAL';
        const customerEmail = String(config.email || '').trim();
        const customerCity = cidadePadrao;

        const items = (venda?.itens || []).map((item) => {
            const produto = db.getProduto(item.id);
            const ncmDigits = String(produto?.ncm || '').replace(/\D/g, '').slice(0, 8);
            const ncm = ncmDigits.padStart(8, '0');
            return {
                code: String(produto?.codigo || item.id || ''),
                description: String(item.nome || produto?.nome || 'Produto'),
                ncm: ncm || '00000000',
                cfop: '5102',
                unit: 'UN',
                quantity: Number(item.qtd || 0),
                unitPrice: Number(item.preco || 0),
                barcode: String(produto?.codigoBarras || produto?.codigo || ''),
                taxes: {
                    icmsRate: 18,
                    pisRate: 1.65,
                    cofinsRate: 7.6
                }
            };
        });

        return {
            saleId: venda.id,
            invoiceNumber: nota.numero,
            serie: nota.serie || 1,
            issueDate: venda.data || new Date().toISOString(),
            paymentMethod: venda.pagamento || 'dinheiro',
            customer: {
                name: customerName,
                document: customerDoc,
                email: customerEmail,
                city: customerCity,
                uf: 'MS',
                address: {
                    street: 'NÃO INFORMADO',
                    number: 'S/N',
                    neighborhood: 'CENTRO',
                    city: customerCity,
                    cityCode: '5002704',
                    uf: 'MS',
                    cep: '79000000'
                }
            },
            items,
            additionalInfo: `NF-e emitida automaticamente pela finalização da venda ${venda.id}.`
        };
    }

    getNfeEmissionEndpoints(baseApi) {
        const relativePath = '/api/v1/fiscal/nfe/emitir';
        const candidateSet = new Set();
        const addCandidate = (value) => {
            if (!value) {
                return;
            }
            candidateSet.add(String(value).replace(/\/+$/, ''));
        };

        const base = String(baseApi || '').trim().replace(/\/+$/, '');
        if (base) {
            addCandidate(`${base}${relativePath}`);
            const withoutApiSuffix = base.replace(/\/api(?:\/v1)?$/i, '');
            if (withoutApiSuffix && withoutApiSuffix !== base) {
                addCandidate(`${withoutApiSuffix}${relativePath}`);
            }
        }

        addCandidate(`${String(window.location.origin || '').replace(/\/+$/, '')}${relativePath}`);
        addCandidate(relativePath);
        return Array.from(candidateSet);
    }

    async emitirNfeAtacado(venda, nota) {
        const baseApi = typeof db.getApiBaseUrl === 'function'
            ? db.getApiBaseUrl()
            : window.location.origin;
        const endpoints = this.getNfeEmissionEndpoints(baseApi);
        const payload = this.buildAtacadoNfePayload(venda, nota);
        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const raw = await response.text();
                let parsed = null;
                try {
                    parsed = raw ? JSON.parse(raw) : null;
                } catch (_error) {
                    parsed = null;
                }

                if (!response.ok) {
                    const reason = parsed?.error || parsed?.xMotivo || parsed?.message || raw || `HTTP ${response.status}`;
                    const shouldTryNext = (response.status === 404 || response.status === 405) && endpoint !== endpoints[endpoints.length - 1];
                    if (shouldTryNext) {
                        lastError = reason;
                        continue;
                    }
                    return { ok: false, reason, data: parsed, status: response.status, endpoint };
                }

                const authorized = parsed?.status === 'AUTORIZADA';
                const reason = parsed?.xMotivo || (authorized ? 'Autorizada.' : 'Sem motivo informado.');
                return { ok: authorized, reason, data: parsed, status: response.status, endpoint };
            } catch (error) {
                lastError = error?.message || 'Falha de comunicação com o módulo fiscal.';
            }
        }

        return {
            ok: false,
            reason: lastError || 'Falha de comunicação com o módulo fiscal.'
        };
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
            this.elements.saleAddStatus.textContent = '';
            return;
        }

        const produto = db.getProduto(produtoId);
        if (!produto) {
            this.elements.saleAddStatus.textContent = 'Produto selecionado não foi encontrado no cadastro.';
            return;
        }

        const disponibilidade = produto.estoque > 0 ? `${produto.estoque} em estoque` : 'sem estoque';
        const precoPerfil = this.isWholesaleFiscalProfile()
            ? `${this.formatMoney(0)} (editável no atacado)`
            : this.formatMoney(produto.preco);
        this.elements.saleAddStatus.textContent = `Selecionado: ${produto.nome} | ${precoPerfil} | ${disponibilidade}.`;
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
            const perfilFiscal = this.elements.vendaPerfilFiscal ? this.elements.vendaPerfilFiscal.value : 'varejo';
            const clienteCpf = this.normalizeCpf(this.elements.vendaClienteCpf?.value);
            const clienteCnpj = this.normalizeCnpj(this.elements.vendaClienteCnpj?.value);
            const clienteNomeEmpresa = String(this.elements.vendaClienteNomeEmpresa?.value || '').trim();
            const valorRecebido = Number(this.elements.vendaValorRecebido.value || 0);
            const troco = Math.max(0, valorRecebido - total);
            const config = db.getConfig();
            const maquininha = pagamento === 'debito' || pagamento === 'credito'
                ? (config.maquininhas || []).find((item) => item.id === this.elements.vendaMaquininha.value)
                : null;

            if (perfilFiscal === 'atacado' && clienteCnpj && !this.isValidCnpj(clienteCnpj)) {
                this.mostrarMsg('O CNPJ informado para atacado é inválido. Revise os dados do cliente.', 'warning');
                this.showCustomerDocumentField('cnpj');
                return;
            }

            if (perfilFiscal === 'varejo' && clienteCpf && !this.isValidCpf(clienteCpf)) {
                this.mostrarMsg('O CPF informado para varejo é inválido. Revise os dados do cliente.', 'warning');
                this.showCustomerDocumentField('cpf');
                return;
            }

            const clienteDocumento = perfilFiscal === 'atacado'
                ? clienteCnpj
                : perfilFiscal === 'varejo'
                    ? clienteCpf
                    : '';
            const clienteNome = perfilFiscal === 'atacado' ? clienteNomeEmpresa : '';

            if ((pagamento === 'debito' || pagamento === 'credito') && !maquininha) {
                this.mostrarMsg('Selecione uma maquininha para pagamentos com cartão.', 'warning');
                return;
            }
            if ((pagamento === 'debito' || pagamento === 'credito') && maquininha) {
                const statusMaquininha = String(maquininha.status || '').toLowerCase();
                const conectada = statusMaquininha === 'conectada' || statusMaquininha === 'pareada';
                if (!conectada) {
                    this.mostrarMsg('Conecte a maquininha na aba Configurações antes de finalizar pagamento com cartão.', 'warning');
                    return;
                }
            }

            if (pagamento === 'dinheiro' && valorRecebido < total) {
                this.mostrarMsg('O valor recebido precisa ser igual ou maior que o total para calcular o troco.', 'warning');
                return;
            }

            let pix = null;
            if (pagamento === 'pix') {
                if (!config.pixChave) {
                    this.mostrarMsg('Cadastre a chave PIX da loja nas configurações.', 'warning');
                    return;
                }
                pix = this.buildPixPayment(config, total);
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
                cliente: {
                    nome: clienteNome,
                    documento: clienteDocumento
                }
            });

            this.mostrarMsg(`Venda registrada com sucesso. ${nota.tipo} nÂº ${nota.numero} gerada.`, 'success');

            if (perfilFiscal === 'atacado') {
                const emissaoNfe = await this.emitirNfeAtacado(venda, nota);
                const chaveAcesso = String(emissaoNfe.data?.accessKey || '').trim();
                const urlConsultaSefaz = chaveAcesso
                    ? `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?chNFe=${encodeURIComponent(chaveAcesso)}`
                    : '';

                if (emissaoNfe.ok) {
                    const metadata = {
                        chaveAcesso,
                        protocoloAutorizacao: String(emissaoNfe.data?.nProt || '').trim(),
                        dataRecebimentoSefaz: emissaoNfe.data?.dhRecbto || null,
                        reciboSefaz: String(emissaoNfe.data?.nRec || '').trim(),
                        motivoSefaz: String(emissaoNfe.data?.xMotivo || emissaoNfe.reason || '').trim(),
                        codigoStatusSefaz: String(emissaoNfe.data?.cStat || '').trim(),
                        urlConsultaSefaz
                    };
                    await db.updateNotaStatus(nota.id, 'autorizada', metadata);
                    Object.assign(nota, metadata, { status: 'autorizada' });
                    const protocolo = emissaoNfe.data?.nProt ? ` Protocolo: ${emissaoNfe.data.nProt}.` : '';
                    this.mostrarMsg(`NF-e autorizada com sucesso.${protocolo}`, 'success');
                } else {
                    const metadata = {
                        chaveAcesso,
                        protocoloAutorizacao: String(emissaoNfe.data?.nProt || '').trim(),
                        dataRecebimentoSefaz: emissaoNfe.data?.dhRecbto || null,
                        reciboSefaz: String(emissaoNfe.data?.nRec || '').trim(),
                        motivoSefaz: String(emissaoNfe.data?.xMotivo || emissaoNfe.reason || '').trim(),
                        codigoStatusSefaz: String(emissaoNfe.data?.cStat || '').trim(),
                        urlConsultaSefaz
                    };
                    await db.updateNotaStatus(nota.id, 'rejeitada', metadata);
                    Object.assign(nota, metadata, { status: 'rejeitada' });
                    this.mostrarMsg(`NF-e não autorizada: ${emissaoNfe.reason}`, 'warning');
                }
            }

            await this.showFiscalNotePrintout(nota);
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
        if (this.elements.vendaClienteCnpj) {
            this.elements.vendaClienteCnpj.value = '';
        }
        if (this.elements.vendaClienteCpf) {
            this.elements.vendaClienteCpf.value = '';
        }
        if (this.elements.vendaClienteNomeEmpresa) {
            this.elements.vendaClienteNomeEmpresa.value = '';
        }
        this.hideCustomerDocumentFields();
        this.elements.vendaValorRecebido.value = '';
        this.elements.vendaMaquininha.value = '';
        this.renderItensVenda();
        this.updateSaleEntryStatus(fromFinalize
            ? 'Venda concluída. Pronto para nova compra.'
            : 'Venda cancelada. Pronto para nova compra.');
        this.updatePaymentUI();
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
                ['Código', 'Nome', 'NCM', 'Estoque', 'Mínimo', 'Preço', 'Total em estoque'],
                produtos.map((produto) => {
                    return [
                        produto.codigo,
                        produto.nome,
                        produto.ncm || '-',
                        produto.estoque,
                        produto.minimo,
                        this.formatMoney(produto.preco),
                        this.formatMoney(produto.preco * produto.estoque)
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

        if (this.elements.cfgNome) {
            this.elements.cfgNome.value = config.nomeLoja || '';
        }
        if (this.elements.cfgCnpj) {
            this.elements.cfgCnpj.value = config.cnpj || '';
        }
        if (this.elements.cfgInscricaoEstadual) {
            this.elements.cfgInscricaoEstadual.value = config.inscricaoEstadual || '';
        }
        if (this.elements.cfgEnderecoRua) {
            this.elements.cfgEnderecoRua.value = config.enderecoRua || '';
        }
        if (this.elements.cfgEnderecoNumero) {
            this.elements.cfgEnderecoNumero.value = config.enderecoNumero || '';
        }
        if (this.elements.cfgEnderecoBairro) {
            this.elements.cfgEnderecoBairro.value = config.enderecoBairro || '';
        }
        if (this.elements.cfgEnderecoUf) {
            this.elements.cfgEnderecoUf.value = config.enderecoUf || '';
        }
        if (this.elements.cfgEnderecoCep) {
            this.elements.cfgEnderecoCep.value = config.enderecoCep || '';
        }
        if (this.elements.cfgEmail) {
            this.elements.cfgEmail.value = config.email || '';
        }
        this.elements.cfgPixChave.value = config.pixChave || '';
        this.elements.cfgPixCidade.value = config.pixCidade || '';
        if (this.elements.cfgFiscalPrinterProfileNfe) {
            this.elements.cfgFiscalPrinterProfileNfe.value = this.normalizeNfePrinterProfile(config.fiscalPrinterProfileNfe);
        }
        if (this.elements.cfgFiscalPrinterNameNfe) {
            this.elements.cfgFiscalPrinterNameNfe.value = config.fiscalPrinterNameNfe || '';
        }
        if (this.elements.cfgFiscalPrinterProfileNfce) {
            this.elements.cfgFiscalPrinterProfileNfce.value = this.normalizeNfcePrinterProfile(
                config.fiscalPrinterProfileNfce || config.fiscalPrinterProfile
            );
        }
        if (this.elements.cfgFiscalPrinterNameNfce) {
            this.elements.cfgFiscalPrinterNameNfce.value = config.fiscalPrinterNameNfce || '';
        }
        this.renderMaquininhas();
        this.updatePaymentUI();
    }

    async salvarConfig() {
        try {
            const nomeLoja = this.elements.cfgNome?.value?.trim() || '';
            const cnpj = this.elements.cfgCnpj?.value?.trim() || '';
            const inscricaoEstadual = this.elements.cfgInscricaoEstadual?.value?.trim() || '';
            const enderecoRua = this.elements.cfgEnderecoRua?.value?.trim() || '';
            const enderecoNumero = this.elements.cfgEnderecoNumero?.value?.trim() || '';
            const enderecoBairro = this.elements.cfgEnderecoBairro?.value?.trim() || '';
            const enderecoUf = (this.elements.cfgEnderecoUf?.value || '').trim().toUpperCase().slice(0, 2);
            const enderecoCep = this.elements.cfgEnderecoCep?.value?.trim() || '';
            const email = this.elements.cfgEmail?.value?.trim() || '';

            await db.setConfig({
                nomeLoja,
                cnpj,
                inscricaoEstadual,
                enderecoRua,
                enderecoNumero,
                enderecoBairro,
                enderecoUf,
                enderecoCep,
                email,
                pixChave: this.elements.cfgPixChave.value,
                pixCidade: this.elements.cfgPixCidade.value,
                fiscalPrinterProfileNfe: this.normalizeNfePrinterProfile(this.elements.cfgFiscalPrinterProfileNfe?.value),
                fiscalPrinterNameNfe: String(this.elements.cfgFiscalPrinterNameNfe?.value || '').trim(),
                fiscalPrinterProfileNfce: this.normalizeNfcePrinterProfile(this.elements.cfgFiscalPrinterProfileNfce?.value),
                fiscalPrinterNameNfce: String(this.elements.cfgFiscalPrinterNameNfce?.value || '').trim(),
                maquininhas: db.getConfig().maquininhas || []
            });
            this.mostrarMsg('Informações da loja salvas.');
            this.renderMaquininhas();
            this.updatePaymentUI();
            this.renderCloudStatus();
        } catch (error) {
            this.mostrarMsg(error.message, 'warning');
        }
    }

    normalizeMaquininhaConexao(value) {
        const normalized = String(value || '').trim().toLowerCase();
        const allowed = ['manual', 'bluetooth', 'wifi', 'usb', 'serial', 'api', 'outro'];
        return allowed.includes(normalized) ? normalized : 'manual';
    }

    getMaquininhaConexaoLabel(value) {
        const labels = {
            manual: 'Manual',
            bluetooth: 'Bluetooth',
            wifi: 'Wi-Fi',
            usb: 'USB',
            serial: 'Serial',
            api: 'API/TEF',
            outro: 'Outro'
        };
        return labels[this.normalizeMaquininhaConexao(value)] || this.capitalize(String(value || 'manual'));
    }

    getMaquininhaStatusLabel(status) {
        const normalized = String(status || 'disponivel').trim().toLowerCase();
        const labels = {
            disponivel: 'Disponível',
            conectada: 'Conectada',
            pareada: 'Pareada',
            erro: 'Erro'
        };
        return labels[normalized] || this.capitalize(normalized);
    }

    resolveMaquininhaNome({ nome, provider, modelo, fallbackIndex = 1 }) {
        const normalizedNome = String(nome || '').trim();
        if (normalizedNome) {
            return normalizedNome;
        }

        const normalizedProvider = String(provider || '').trim();
        const normalizedModelo = String(modelo || '').trim();
        if (normalizedProvider && normalizedModelo) {
            return `${normalizedProvider} ${normalizedModelo}`;
        }
        if (normalizedProvider) {
            return normalizedProvider;
        }
        if (normalizedModelo) {
            return normalizedModelo;
        }
        return `Maquininha ${fallbackIndex}`;
    }

    async cadastrarMaquininha({ vincular = false } = {}) {
        const config = db.getConfig();
        const provider = String(this.elements.cfgMaqProvider?.value || '').trim();
        const modelo = this.elements.cfgMaqModelo.value.trim();
        const conexaoSelecionada = this.normalizeMaquininhaConexao(this.elements.cfgMaqConexao.value);
        const identificador = String(this.elements.cfgMaqIdentificador?.value || '').trim();
        const endpoint = String(this.elements.cfgMaqEndpoint?.value || '').trim();
        const nome = this.resolveMaquininhaNome({
            nome: this.elements.cfgMaqNome.value,
            provider,
            modelo,
            fallbackIndex: (config.maquininhas || []).length + 1
        });
        const conexao = (endpoint && conexaoSelecionada === 'manual') ? 'api' : conexaoSelecionada;

        const novaMaquininha = {
            id: `maq_${Date.now()}`,
            provider,
            nome,
            modelo,
            conexao,
            identificador,
            endpoint,
            status: 'disponivel',
            connectedAt: null,
            connectedDetails: '',
            lastError: '',
            pareadoEm: null
        };
        const maquininhas = [...(config.maquininhas || []), novaMaquininha];

        await db.setConfig({ maquininhas });
        if (this.elements.cfgMaqProvider) {
            this.elements.cfgMaqProvider.value = '';
        }
        this.elements.cfgMaqNome.value = '';
        this.elements.cfgMaqModelo.value = '';
        this.elements.cfgMaqConexao.value = 'manual';
        if (this.elements.cfgMaqIdentificador) {
            this.elements.cfgMaqIdentificador.value = '';
        }
        if (this.elements.cfgMaqEndpoint) {
            this.elements.cfgMaqEndpoint.value = '';
        }
        this.elements.vendaMaquininha.value = novaMaquininha.id;
        this.renderMaquininhas();
        this.elements.vendaMaquininha.value = novaMaquininha.id;
        this.updatePaymentUI();

        if (vincular) {
            await this.vincularMaquininha(novaMaquininha.id);
            return;
        }

        const mensagemConexao = endpoint && conexaoSelecionada === 'manual'
            ? ' Endpoint detectado; tipo de conex?o ajustado para API/TEF automaticamente.'
            : '';
        this.mostrarMsg(`Maquininha cadastrada com sucesso.${mensagemConexao} Clique em "Vincular Selecionada" para finalizar.`);
    }

    async vincularMaquininhaSelecionada() {
        const config = db.getConfig();
        const alvo = this.elements.vendaMaquininha.value || config.maquininhas?.[0]?.id;
        if (!alvo) {
            this.mostrarMsg('Cadastre uma maquininha antes de vincular.', 'warning');
            return;
        }
        await this.vincularMaquininha(alvo);
    }

    async conectarMaquininhaSelecionada() {
        await this.vincularMaquininhaSelecionada();
    }

    async vincularMaquininha(id) {
        const resultado = await this.conectarMaquininha(id, { silent: true });
        if (!resultado?.ok) {
            this.mostrarMsg(resultado?.message || 'N?o foi poss?vel conectar a maquininha.', 'warning');
            return false;
        }

        const pareada = await this.parearMaquininha(id, { silent: true });
        if (!pareada) {
            this.mostrarMsg('A maquininha foi conectada, mas n?o foi poss?vel concluir o pareamento.', 'warning');
            return false;
        }

        this.elements.vendaMaquininha.value = id;
        this.renderMaquininhas();
        this.updatePaymentUI();
        const config = db.getConfig();
        const maquininha = (config.maquininhas || []).find((item) => item.id === id);
        const nome = maquininha?.nome || 'Maquininha';
        this.mostrarMsg(`Maquininha vinculada e pronta para uso: ${nome}.`);
        return true;
    }

    async conectarMaquininha(id, { silent = false } = {}) {
        const config = db.getConfig();
        const alvo = (config.maquininhas || []).find((maquininha) => maquininha.id === id);
        if (!alvo) {
            const message = 'Maquininha n?o encontrada para conex?o.';
            if (!silent) {
                this.mostrarMsg(message, 'warning');
            }
            return { ok: false, message };
        }

        const resultado = await this.testarConexaoMaquininha(alvo);
        const connectedAt = resultado.ok ? new Date().toISOString() : alvo.connectedAt || null;
        const connectedDetails = resultado.ok ? (resultado.details || '') : alvo.connectedDetails || '';
        const lastError = resultado.ok ? '' : String(resultado.message || '').trim();
        const maquininhas = (config.maquininhas || []).map((maquininha) => {
            if (maquininha.id !== id) {
                return maquininha;
            }
            const statusAtual = String(maquininha.status || '').toLowerCase();
            const status = resultado.ok
                ? (statusAtual === 'pareada' ? 'pareada' : 'conectada')
                : 'erro';
            return {
                ...maquininha,
                status,
                connectedAt,
                connectedDetails,
                lastError
            };
        });

        await db.setConfig({ maquininhas });
        this.renderMaquininhas();
        this.updatePaymentUI();
        if (!silent) {
            this.mostrarMsg(resultado.message, resultado.ok ? 'success' : 'warning');
        }
        return resultado;
    }

    async testarConexaoMaquininha(maquininha) {
        const conexao = this.normalizeMaquininhaConexao(maquininha?.conexao);
        const nome = maquininha?.nome || 'Maquininha';

        try {
            if (conexao === 'manual' || conexao === 'outro') {
                return {
                    ok: true,
                    message: `Conexão manual registrada para ${nome}.`,
                    details: 'Conexão manual (suporte genérico).'
                };
            }

            if (conexao === 'api' || conexao === 'wifi') {
                const endpoint = String(maquininha?.endpoint || '').trim();
                if (!endpoint) {
                    return {
                        ok: true,
                        message: `Conexão registrada para ${nome}. Informe endpoint para validação online quando disponível.`,
                        details: 'Sem endpoint informado.'
                    };
                }
                try {
                    await fetch(endpoint, { method: 'GET', mode: 'no-cors' });
                    return {
                        ok: true,
                        message: `Conexão por ${this.getMaquininhaConexaoLabel(conexao)} iniciada para ${nome}.`,
                        details: `Endpoint configurado: ${endpoint}`
                    };
                } catch (error) {
                    return {
                        ok: false,
                        message: `Falha ao testar endpoint da maquininha: ${error.message || 'erro de rede'}.`
                    };
                }
            }

            if (conexao === 'bluetooth') {
                if (!('bluetooth' in navigator)) {
                    return { ok: false, message: 'Este navegador não suporta Web Bluetooth para conectar a maquininha.' };
                }
                if (!window.isSecureContext) {
                    return { ok: false, message: 'Conexão Bluetooth exige HTTPS ou localhost.' };
                }
                const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
                return {
                    ok: true,
                    message: `Bluetooth conectado: ${device.name || device.id || nome}.`,
                    details: device.name || device.id || 'Dispositivo Bluetooth conectado.'
                };
            }

            if (conexao === 'usb') {
                if (!('usb' in navigator)) {
                    return { ok: false, message: 'Este navegador não suporta WebUSB para conectar a maquininha.' };
                }
                if (!window.isSecureContext) {
                    return { ok: false, message: 'Conexão USB exige HTTPS ou localhost.' };
                }
                const device = await navigator.usb.requestDevice({ filters: [] });
                return {
                    ok: true,
                    message: `USB conectado: ${device.productName || nome}.`,
                    details: device.productName || 'Dispositivo USB conectado.'
                };
            }

            if (conexao === 'serial') {
                if (!('serial' in navigator)) {
                    return { ok: false, message: 'Este navegador não suporta Web Serial para conectar a maquininha.' };
                }
                if (!window.isSecureContext) {
                    return { ok: false, message: 'Conexão Serial exige HTTPS ou localhost.' };
                }
                await navigator.serial.requestPort();
                return {
                    ok: true,
                    message: `Porta serial conectada para ${nome}.`,
                    details: 'Porta serial autorizada no navegador.'
                };
            }

            return {
                ok: true,
                message: `Conexão registrada para ${nome}.`,
                details: `Modo ${this.getMaquininhaConexaoLabel(conexao)}.`
            };
        } catch (error) {
            return {
                ok: false,
                message: `Conexão cancelada ou falhou: ${error.message || 'erro desconhecido'}.`
            };
        }
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

    async parearMaquininha(id, { silent = false } = {}) {
        const config = db.getConfig();
        const alvo = (config.maquininhas || []).find((maquininha) => maquininha.id === id);
        if (!alvo) {
            if (!silent) {
                this.mostrarMsg('Maquininha n?o encontrada para pareamento.', 'warning');
            }
            return false;
        }
        const now = new Date().toISOString();
        const maquininhas = (config.maquininhas || []).map((maquininha) => {
            if (maquininha.id === id) {
                const statusAtual = String(maquininha.status || '').toLowerCase();
                return {
                    ...maquininha,
                    status: 'pareada',
                    connectedAt: maquininha.connectedAt || (statusAtual === 'disponivel' ? now : maquininha.connectedAt || now),
                    pareadoEm: now,
                    lastError: ''
                };
            }

            if (String(maquininha.status || '').toLowerCase() === 'pareada') {
                return {
                    ...maquininha,
                    status: maquininha.connectedAt ? 'conectada' : 'disponivel'
                };
            }
            return maquininha;
        });

        await db.setConfig({ maquininhas });
        this.renderMaquininhas();
        this.updatePaymentUI();
        if (!silent) {
            this.mostrarMsg('Maquininha pareada no sistema.');
        }
        return true;
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
            const provider = maquininha.provider ? `${maquininha.provider} | ` : '';
            const modelo = maquininha.modelo || 'Modelo livre';
            option.textContent = `${provider}${maquininha.nome} | ${modelo} | ${this.getMaquininhaConexaoLabel(maquininha.conexao)}`;
            this.elements.vendaMaquininha.appendChild(option);
        });
        this.elements.vendaMaquininha.value = maquininhas.some((item) => item.id === selecionadaAtual) ? selecionadaAtual : '';

        if (!maquininhas.length) {
            this.elements.tbMaquininhas.innerHTML = '<tr><td colspan="7" class="empty">Nenhuma maquininha cadastrada</td></tr>';
            this.elements.maquininhaStatusVenda.textContent = 'Cadastre e vincule uma maquininha na aba Configura??es.';
            return;
        }

        this.elements.tbMaquininhas.innerHTML = maquininhas.map((maquininha) => {
            const normalizedStatus = String(maquininha.status || 'disponivel').toLowerCase();
            const statusClass = normalizedStatus === 'pareada' || normalizedStatus === 'conectada'
                ? 'ok'
                : normalizedStatus === 'erro'
                    ? 'danger'
                    : '';
            const conectadoEm = maquininha.connectedAt ? this.formatDate(maquininha.connectedAt) : '-';
            const provider = maquininha.provider || '-';
            const modelo = maquininha.modelo || '-';
            const tooltip = maquininha.lastError ? ` title="${this.escapeHtml(maquininha.lastError)}"` : '';
            return `
                <tr>
                    <td>${this.escapeHtml(provider)}</td>
                    <td>${this.escapeHtml(maquininha.nome || '-')}</td>
                    <td>${this.escapeHtml(modelo)}</td>
                    <td>${this.escapeHtml(this.getMaquininhaConexaoLabel(maquininha.conexao))}</td>
                    <td><span class="stock-pill ${statusClass}"${tooltip}>${this.escapeHtml(this.getMaquininhaStatusLabel(maquininha.status))}</span></td>
                    <td>${this.escapeHtml(conectadoEm)}</td>
                    <td>
                        <div class="action-row nowrap">
                            <button class="btn btn-secondary btn-small" data-maq-action="vincular" data-id="${maquininha.id}">Vincular</button>
                            <button class="btn btn-danger btn-small" data-maq-action="remover" data-id="${maquininha.id}">Remover</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        const pareada = maquininhas.find((maquininha) => maquininha.status === 'pareada');
        const conectada = pareada || maquininhas.find((maquininha) => maquininha.status === 'conectada');
        this.elements.maquininhaStatusVenda.textContent = conectada
            ? `Maquininha pronta para uso: ${conectada.nome} (${conectada.modelo || 'modelo livre'}).`
            : 'Existe maquininha cadastrada, mas nenhuma foi vinculada.';
    }
    updatePaymentUI() {
        const pagamento = this.elements.vendaPagamento.value;
        this.elements.moneyFields.hidden = pagamento !== 'dinheiro';
        this.elements.cardFields.hidden = !['debito', 'credito'].includes(pagamento);
        this.elements.pixFields.hidden = pagamento !== 'pix';
        this.updateCustomerDocumentUi();
        this.updateQuickPayButtons(pagamento);
        this.updateChangePreview();
        this.updatePixPreview();
        this.scheduleSalesStaticFit();
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
            ? `${config.nomeLoja}${config.pixCidade ? ` â€¢ ${config.pixCidade}` : ''}`
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
            debito: 'Cartão de débito',
            credito: 'Cartão de crédito',
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
        this.renderMovimentos();
        this.renderBaixoEstoque();
        this.updatePaymentUI();
        this.renderCloudStatus();
        this.scheduleSalesStaticFit();
    }

    scheduleSalesStaticFit() {
        if (this.salesStaticFitTimer) {
            window.clearTimeout(this.salesStaticFitTimer);
        }
        this.salesStaticFitTimer = window.setTimeout(() => this.applySalesStaticFit(), 20);
    }

    applySalesStaticFit() {
        const vendasSection = this.elements.vendasSection;
        if (!vendasSection) {
            return;
        }

        const shouldFit = this.isSectionActive('vendas') || this.isSalesOnlyMode();
        document.body.classList.toggle('sales-static-fit', shouldFit);

        if (!shouldFit) {
            vendasSection.style.removeProperty('--sales-fit-scale');
            vendasSection.style.removeProperty('--sales-fit-height');
            return;
        }

        vendasSection.style.setProperty('--sales-fit-scale', '1');

        window.requestAnimationFrame(() => {
            const header = this.elements.header;
            const mainContent = this.elements.mainContent;
            const headerVisible = header && window.getComputedStyle(header).display !== 'none';
            const headerHeight = headerVisible ? header.getBoundingClientRect().height : 0;
            const viewportHeight = Math.max(300, window.innerHeight - headerHeight - 8);
            const viewportWidth = Math.max(320, mainContent?.clientWidth || window.innerWidth);
            vendasSection.style.setProperty('--sales-fit-height', `${Math.round(viewportHeight)}px`);
            const naturalHeight = Math.max(1, vendasSection.scrollHeight);
            const naturalWidth = Math.max(1, vendasSection.scrollWidth);
            const scaleByHeight = viewportHeight / naturalHeight;
            const scaleByWidth = viewportWidth / naturalWidth;
            const computedScale = Math.min(scaleByHeight, scaleByWidth);
            const maxScale = 1;
            const clampedScale = Math.min(maxScale, computedScale);
            const safeScale = Number.isFinite(clampedScale) && clampedScale > 0 ? clampedScale : 1;
            vendasSection.style.setProperty('--sales-fit-scale', safeScale.toFixed(3));
        });
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

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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





