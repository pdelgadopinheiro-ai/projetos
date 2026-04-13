const crypto = require('crypto');
const { ensureNonNegativeNumber, ensureString } = require('../../shared/validators');
const { NotFoundError, ValidationError } = require('../../shared/errors');

class ProductsService {
    constructor(productsRepository, stateStore) {
        this.productsRepository = productsRepository;
        this.stateStore = stateStore;
    }

    async listProducts({ search = '' } = {}) {
        return this.productsRepository.list(search);
    }

    async getProductById(productId) {
        const product = await this.productsRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto nao encontrado.');
        }
        return product;
    }

    async createProduct(payload) {
        const name = ensureString(payload?.name, 'name');
        const category = ensureString(payload?.category, 'category');
        const price = ensureNonNegativeNumber(payload?.price, 'price');
        const stock = ensureNonNegativeNumber(payload?.stock, 'stock');
        const minStock = ensureNonNegativeNumber(payload?.minStock ?? 0, 'minStock');
        const cost = ensureNonNegativeNumber(payload?.cost ?? 0, 'cost');

        if (cost > price) {
            throw new ValidationError('cost nao pode ser maior que price.');
        }

        const now = new Date().toISOString();
        const product = {
            id: crypto.randomUUID(),
            code: await this.generateProductCode(category),
            barcode: String(payload?.barcode || '').trim(),
            name,
            category,
            price,
            cost,
            stock,
            minStock,
            active: payload?.active !== false,
            createdAt: now,
            updatedAt: now
        };

        return this.productsRepository.create(product);
    }

    async updateProduct(productId, payload) {
        const current = await this.productsRepository.findById(productId);
        if (!current) {
            throw new NotFoundError('Produto nao encontrado.');
        }

        const patch = {};
        if (payload?.name !== undefined) {
            patch.name = ensureString(payload.name, 'name');
        }
        if (payload?.category !== undefined) {
            patch.category = ensureString(payload.category, 'category');
        }
        if (payload?.price !== undefined) {
            patch.price = ensureNonNegativeNumber(payload.price, 'price');
        }
        if (payload?.cost !== undefined) {
            patch.cost = ensureNonNegativeNumber(payload.cost, 'cost');
        }
        if (payload?.stock !== undefined) {
            patch.stock = ensureNonNegativeNumber(payload.stock, 'stock');
        }
        if (payload?.minStock !== undefined) {
            patch.minStock = ensureNonNegativeNumber(payload.minStock, 'minStock');
        }
        if (payload?.barcode !== undefined) {
            patch.barcode = String(payload.barcode || '').trim();
        }
        if (payload?.active !== undefined) {
            patch.active = Boolean(payload.active);
        }

        const nextCost = patch.cost !== undefined ? patch.cost : current.cost;
        const nextPrice = patch.price !== undefined ? patch.price : current.price;
        if (nextCost > nextPrice) {
            throw new ValidationError('cost nao pode ser maior que price.');
        }

        const updated = await this.productsRepository.update(productId, patch);
        if (!updated) {
            throw new NotFoundError('Produto nao encontrado.');
        }
        return updated;
    }

    async generateProductCode(category) {
        const prefix = String(category || 'PRO')
            .replace(/[^A-Za-z]/g, '')
            .slice(0, 3)
            .toUpperCase()
            .padEnd(3, 'X');
        const state = await this.stateStore.read();
        const samePrefixCount = state.products.filter((product) => String(product.code || '').startsWith(prefix)).length;
        return `${prefix}-${String(samePrefixCount + 1).padStart(5, '0')}`;
    }
}

module.exports = { ProductsService };

