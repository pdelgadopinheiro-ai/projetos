(function () {
    const API_BASE = '/api/v1';
    const currency = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    const elements = {
        search: document.getElementById('search'),
        productsBody: document.getElementById('products-body'),
        cartBody: document.getElementById('cart-body'),
        subtotal: document.getElementById('subtotal'),
        total: document.getElementById('total'),
        paymentMethod: document.getElementById('payment-method'),
        btnFinish: document.getElementById('btn-finish'),
        btnClear: document.getElementById('btn-clear'),
        saleStatus: document.getElementById('sale-status'),
        kpiSales: document.getElementById('kpi-sales'),
        kpiRevenue: document.getElementById('kpi-revenue'),
        kpiLowStock: document.getElementById('kpi-low-stock')
    };

    const state = {
        products: [],
        cart: new Map()
    };

    init().catch((error) => {
        console.error(error);
        setStatus('Falha ao iniciar módulo de vendas.');
    });

    async function init() {
        bindEvents();
        await refreshProducts();
        await refreshKpis();
        renderProducts();
        renderCart();
    }

    function bindEvents() {
        elements.search.addEventListener('input', () => renderProducts());
        elements.search.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addFirstFilteredProduct();
                return;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                focusFirstQuantityInput();
            }
        });
        elements.btnClear.addEventListener('click', () => {
            state.cart.clear();
            renderCart();
            setStatus('Carrinho limpo.');
        });
        elements.btnFinish.addEventListener('click', () => finalizeSale());
        document.addEventListener('keydown', (event) => handleShortcuts(event));
    }

    async function refreshProducts() {
        const response = await request(`${API_BASE}/products`);
        state.products = Array.isArray(response.items) ? response.items : [];
    }

    async function refreshKpis() {
        const [salesSummary, inventoryLowStock] = await Promise.all([
            request(`${API_BASE}/reports/sales-summary`),
            request(`${API_BASE}/inventory/low-stock`)
        ]);
        elements.kpiSales.textContent = String(salesSummary.totalSales || 0);
        elements.kpiRevenue.textContent = currency.format(Number(salesSummary.grossRevenue || 0));
        elements.kpiLowStock.textContent = String((inventoryLowStock.items || []).length);
    }

    function getFilteredProducts() {
        const query = String(elements.search.value || '').trim().toLowerCase();
        if (!query) {
            return state.products;
        }
        return state.products.filter((product) => (
            String(product.name || '').toLowerCase().includes(query)
            || String(product.code || '').toLowerCase().includes(query)
            || String(product.barcode || '').toLowerCase().includes(query)
        ));
    }

    function renderProducts() {
        const products = getFilteredProducts();
        if (!products.length) {
            elements.productsBody.innerHTML = '<tr><td colspan="6" class="muted">Nenhum produto encontrado.</td></tr>';
            return;
        }

        elements.productsBody.innerHTML = products.map((product) => {
            const disabled = Number(product.stock || 0) <= 0 ? 'disabled' : '';
            const qtyId = `qty-${product.id}`;
            return `
                <tr>
                    <td>${escapeHtml(product.code || '-')}</td>
                    <td>${escapeHtml(product.name || '-')}</td>
                    <td>${Number(product.stock || 0)}</td>
                    <td class="text-right">${currency.format(Number(product.price || 0))}</td>
                    <td><input id="${qtyId}" class="qty-input" type="number" min="1" value="1" ${disabled}></td>
                    <td><button type="button" class="btn-secondary" data-add-product="${product.id}" ${disabled}>Adicionar</button></td>
                </tr>
            `;
        }).join('');

        elements.productsBody.querySelectorAll('[data-add-product]').forEach((button) => {
            button.addEventListener('click', () => {
                const productId = button.dataset.addProduct;
                const qtyInput = document.getElementById(`qty-${productId}`);
                const quantity = Number(qtyInput?.value || 1);
                addToCart(productId, quantity);
            });
        });
    }

    function addToCart(productId, quantity) {
        const product = state.products.find((entry) => entry.id === productId);
        if (!product) {
            setStatus('Produto não encontrado.', true);
            return;
        }
        const parsedQty = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
        if (parsedQty <= 0) {
            setStatus('Quantidade inválida.', true);
            return;
        }
        const inCart = state.cart.get(productId) || 0;
        const totalQuantity = inCart + parsedQty;
        if (totalQuantity > Number(product.stock || 0)) {
            setStatus(`Estoque insuficiente para ${product.name}.`, true);
            return;
        }

        state.cart.set(productId, totalQuantity);
        renderCart();
        setStatus(`${product.name} adicionado ao carrinho.`);
    }

    function removeFromCart(productId) {
        state.cart.delete(productId);
        renderCart();
    }

    function renderCart() {
        if (!state.cart.size) {
            elements.cartBody.innerHTML = '<tr><td colspan="4" class="muted">Nenhum item no carrinho.</td></tr>';
            elements.subtotal.textContent = currency.format(0);
            elements.total.textContent = currency.format(0);
            return;
        }

        const rows = [];
        let subtotal = 0;
        state.cart.forEach((quantity, productId) => {
            const product = state.products.find((entry) => entry.id === productId);
            if (!product) {
                return;
            }
            const rowSubtotal = Number(product.price || 0) * quantity;
            subtotal += rowSubtotal;
            rows.push(`
                <tr>
                    <td>${escapeHtml(product.name || '-')}</td>
                    <td>${quantity}</td>
                    <td class="text-right">${currency.format(rowSubtotal)}</td>
                    <td><button type="button" class="btn-danger" data-remove-product="${productId}">X</button></td>
                </tr>
            `);
        });

        elements.cartBody.innerHTML = rows.join('');
        elements.subtotal.textContent = currency.format(subtotal);
        elements.total.textContent = currency.format(subtotal);
        elements.cartBody.querySelectorAll('[data-remove-product]').forEach((button) => {
            button.addEventListener('click', () => removeFromCart(button.dataset.removeProduct));
        });
    }

    async function finalizeSale() {
        if (!state.cart.size) {
            setStatus('Adicione itens para finalizar a venda.', true);
            return;
        }

        const items = Array.from(state.cart.entries()).map(([productId, quantity]) => ({
            productId,
            quantity
        }));

        const payload = {
            paymentMethod: elements.paymentMethod.value,
            items,
            customer: {
                name: '',
                document: '',
                email: '',
                city: ''
            }
        };

        try {
            const sale = await request(`${API_BASE}/sales`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            state.cart.clear();
            await Promise.all([refreshProducts(), refreshKpis()]);
            renderProducts();
            renderCart();
            setStatus(`Venda ${sale.id} finalizada com sucesso.`);
        } catch (error) {
            setStatus(error.message || 'Falha ao finalizar venda.', true);
        }
    }

    function handleShortcuts(event) {
        if (event.defaultPrevented) {
            return;
        }

        const isTyping = isTypingTarget(event.target);

        if (event.altKey && event.key.toLowerCase() === 'p') {
            event.preventDefault();
            focusSearch();
            return;
        }

        if (event.key === 'F10' || event.code === 'F10' || event.keyCode === 121) {
            event.preventDefault();
            focusSearch();
            return;
        }

        if (event.key === 'F9') {
            event.preventDefault();
            focusFirstQuantityInput();
            return;
        }

        if (event.key === 'F1') {
            event.preventDefault();
            setPaymentMethodShortcut('dinheiro', 'Dinheiro');
            return;
        }

        if (event.key === 'F2') {
            event.preventDefault();
            setPaymentMethodShortcut('debito', 'Cartão débito');
            return;
        }

        if (event.key === 'F3') {
            event.preventDefault();
            setPaymentMethodShortcut('credito', 'Cartão crédito');
            return;
        }

        if (event.key === 'F4') {
            event.preventDefault();
            setPaymentMethodShortcut('pix', 'PIX');
            return;
        }

        if (event.key === 'F12' || (event.ctrlKey && event.key === 'Enter')) {
            event.preventDefault();
            finalizeSale();
            return;
        }

        if (event.ctrlKey && event.key === 'Backspace') {
            event.preventDefault();
            removeLastCartItem();
            return;
        }

        if (event.ctrlKey && event.key === 'Delete') {
            event.preventDefault();
            clearCartWithFeedback();
            return;
        }

        if (event.key === 'Escape' && !isTyping) {
            event.preventDefault();
            clearCartWithFeedback();
        }
    }

    function setPaymentMethodShortcut(method, label) {
        elements.paymentMethod.value = method;
        setStatus(`Pagamento definido para ${label}.`);
    }

    function focusSearch() {
        elements.search.focus();
        elements.search.select();
    }

    function focusFirstQuantityInput() {
        const firstQtyInput = elements.productsBody.querySelector('.qty-input:not([disabled])');
        if (!firstQtyInput) {
            setStatus('Nenhum produto disponível para selecionar quantidade.', true);
            return;
        }
        firstQtyInput.focus();
        firstQtyInput.select();
    }

    function addFirstFilteredProduct() {
        const firstButton = elements.productsBody.querySelector('[data-add-product]:not([disabled])');
        if (!firstButton) {
            setStatus('Nenhum produto disponível para adicionar.', true);
            return;
        }
        const productId = firstButton.dataset.addProduct;
        const qtyInput = document.getElementById(`qty-${productId}`);
        const quantity = Number(qtyInput?.value || 1);
        addToCart(productId, quantity);
    }

    function removeLastCartItem() {
        const keys = Array.from(state.cart.keys());
        const lastProductId = keys[keys.length - 1];
        if (!lastProductId) {
            setStatus('Carrinho vazio.', true);
            return;
        }
        removeFromCart(lastProductId);
        setStatus('Último item removido do carrinho.');
    }

    function clearCartWithFeedback() {
        state.cart.clear();
        renderCart();
        setStatus('Carrinho limpo.');
    }

    function isTypingTarget(target) {
        if (!target) {
            return false;
        }
        const tagName = String(target.tagName || '').toUpperCase();
        return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable;
    }

    function setStatus(message, isError = false) {
        elements.saleStatus.textContent = message;
        elements.saleStatus.style.color = isError ? '#b34141' : '#4f6d5f';
    }

    async function request(url, options = {}) {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        return data;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
})();
