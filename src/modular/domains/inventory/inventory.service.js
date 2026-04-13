const crypto = require('crypto');
const { ensurePositiveNumber, ensureString } = require('../../shared/validators');
const { NotFoundError, ValidationError } = require('../../shared/errors');

class InventoryService {
    constructor(stateStore, inventoryRepository) {
        this.stateStore = stateStore;
        this.inventoryRepository = inventoryRepository;
    }

    async listMovements(filters) {
        return this.inventoryRepository.listMovements(filters);
    }

    async listLowStockProducts() {
        return this.inventoryRepository.listLowStockProducts();
    }

    async registerManualMovement(payload) {
        const productId = ensureString(payload?.productId, 'productId');
        const type = ensureString(payload?.type, 'type').toLowerCase();
        const quantity = ensurePositiveNumber(payload?.quantity, 'quantity');
        const reason = String(payload?.reason || 'Movimentacao manual').trim();

        if (!['entrada', 'saida', 'ajuste'].includes(type)) {
            throw new ValidationError('type deve ser entrada, saida ou ajuste.');
        }

        let response = null;
        await this.stateStore.update((state) => {
            const product = state.products.find((entry) => entry.id === productId);
            if (!product) {
                throw new NotFoundError('Produto nao encontrado para movimentacao.');
            }

            const currentStock = Number(product.stock || 0);
            let nextStock = currentStock;

            if (type === 'entrada') {
                nextStock = currentStock + quantity;
            } else if (type === 'saida') {
                if (quantity > currentStock) {
                    throw new ValidationError('Estoque insuficiente para saida manual.');
                }
                nextStock = currentStock - quantity;
            } else {
                nextStock = quantity;
            }

            product.stock = nextStock;
            product.updatedAt = new Date().toISOString();

            const movement = {
                id: crypto.randomUUID(),
                productId,
                type,
                quantity,
                reason,
                createdAt: new Date().toISOString()
            };

            state.inventoryMovements.push(movement);
            response = {
                movement,
                product
            };
        });

        return response;
    }
}

module.exports = { InventoryService };

