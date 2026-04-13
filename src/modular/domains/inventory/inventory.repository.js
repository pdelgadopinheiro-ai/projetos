class InventoryRepository {
    constructor(stateStore) {
        this.stateStore = stateStore;
    }

    async listMovements({ productId = '', limit = 100 } = {}) {
        const state = await this.stateStore.read();
        const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
        return state.inventoryMovements
            .filter((movement) => (productId ? movement.productId === productId : true))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, parsedLimit);
    }

    async listLowStockProducts() {
        const state = await this.stateStore.read();
        return state.products
            .filter((product) => Number(product.stock || 0) <= Number(product.minStock || 0))
            .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
    }
}

module.exports = { InventoryRepository };

