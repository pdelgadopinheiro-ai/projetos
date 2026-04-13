class ProductsRepository {
    constructor(stateStore) {
        this.stateStore = stateStore;
    }

    async list(search = '') {
        const normalizedSearch = String(search || '').trim().toLowerCase();
        const state = await this.stateStore.read();
        const items = state.products.filter((product) => {
            if (!normalizedSearch) {
                return true;
            }
            return String(product.name || '').toLowerCase().includes(normalizedSearch)
                || String(product.code || '').toLowerCase().includes(normalizedSearch)
                || String(product.barcode || '').toLowerCase().includes(normalizedSearch);
        });
        return items.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'));
    }

    async findById(productId) {
        const state = await this.stateStore.read();
        return state.products.find((product) => product.id === productId) || null;
    }

    async create(product) {
        await this.stateStore.update((state) => {
            state.products.push(product);
        });
        return product;
    }

    async update(productId, patch) {
        let updated = null;
        await this.stateStore.update((state) => {
            const product = state.products.find((entry) => entry.id === productId);
            if (!product) {
                return;
            }
            Object.assign(product, patch, { updatedAt: new Date().toISOString() });
            updated = product;
        });
        return updated;
    }
}

module.exports = { ProductsRepository };

