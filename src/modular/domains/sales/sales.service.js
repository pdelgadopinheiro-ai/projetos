const crypto = require('crypto');
const { ensurePositiveNumber, ensureString } = require('../../shared/validators');
const { NotFoundError, ValidationError } = require('../../shared/errors');

class SalesService {
    constructor(stateStore, salesRepository) {
        this.stateStore = stateStore;
        this.salesRepository = salesRepository;
    }

    async listSales(filters) {
        return this.salesRepository.list(filters);
    }

    async getSaleById(saleId) {
        const sale = await this.salesRepository.findById(saleId);
        if (!sale) {
            throw new NotFoundError('Venda nao encontrada.');
        }
        return sale;
    }

    async createSale(payload) {
        const paymentMethod = ensureString(payload?.paymentMethod || 'dinheiro', 'paymentMethod');
        const items = this.normalizeItems(payload?.items);
        const discount = Number(payload?.discount || 0);
        const surcharge = Number(payload?.surcharge || 0);
        const customer = {
            name: String(payload?.customer?.name || '').trim(),
            document: String(payload?.customer?.document || '').trim(),
            email: String(payload?.customer?.email || '').trim(),
            city: String(payload?.customer?.city || '').trim()
        };

        let createdSale = null;
        await this.stateStore.update((state) => {
            const saleId = crypto.randomUUID();
            const now = new Date().toISOString();
            const saleItems = items.map((item) => {
                const product = state.products.find((entry) => entry.id === item.productId);
                if (!product) {
                    throw new NotFoundError(`Produto ${item.productId} nao encontrado.`);
                }

                if (item.quantity > Number(product.stock || 0)) {
                    throw new ValidationError(`Estoque insuficiente para ${product.name}.`);
                }

                const unitPrice = Number(product.price || 0);
                return {
                    productId: product.id,
                    code: product.code,
                    name: product.name,
                    quantity: item.quantity,
                    unitPrice,
                    subtotal: Number((unitPrice * item.quantity).toFixed(2))
                };
            });

            const subtotal = Number(saleItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
            const total = Number((subtotal - discount + surcharge).toFixed(2));
            if (total < 0) {
                throw new ValidationError('Total da venda nao pode ser negativo.');
            }

            saleItems.forEach((item) => {
                const product = state.products.find((entry) => entry.id === item.productId);
                product.stock = Number((Number(product.stock || 0) - item.quantity).toFixed(3));
                product.updatedAt = new Date().toISOString();
                state.inventoryMovements.push({
                    id: crypto.randomUUID(),
                    productId: item.productId,
                    type: 'saida',
                    quantity: item.quantity,
                    reason: 'Baixa automatica por venda',
                    sourceSaleId: saleId,
                    createdAt: now
                });
            });

            const sale = {
                id: saleId,
                items: saleItems,
                subtotal,
                discount,
                surcharge,
                total,
                paymentMethod,
                customer,
                status: 'completed',
                createdAt: now,
                updatedAt: now
            };

            state.sales.push(sale);
            createdSale = sale;
        });

        return createdSale;
    }

    normalizeItems(rawItems) {
        if (!Array.isArray(rawItems) || !rawItems.length) {
            throw new ValidationError('items obrigatorio com pelo menos um item.');
        }

        const grouped = new Map();
        rawItems.forEach((item) => {
            const productId = ensureString(item?.productId || item?.id, 'items.productId');
            const quantity = ensurePositiveNumber(item?.quantity || item?.qtd, 'items.quantity');
            const current = grouped.get(productId) || 0;
            grouped.set(productId, current + quantity);
        });

        return Array.from(grouped.entries()).map(([productId, quantity]) => ({
            productId,
            quantity
        }));
    }
}

module.exports = { SalesService };
