class SalesRepository {
    constructor(stateStore) {
        this.stateStore = stateStore;
    }

    async list({ from = null, to = null, limit = 100 } = {}) {
        const state = await this.stateStore.read();
        const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        return state.sales
            .filter((sale) => {
                const saleDate = new Date(sale.createdAt);
                if (fromDate && saleDate < fromDate) {
                    return false;
                }
                if (toDate && saleDate > toDate) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, parsedLimit);
    }

    async findById(saleId) {
        const state = await this.stateStore.read();
        return state.sales.find((sale) => sale.id === saleId) || null;
    }
}

module.exports = { SalesRepository };

