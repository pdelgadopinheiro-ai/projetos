const fs = require('fs/promises');
const path = require('path');

const DEFAULT_STATE = {
    products: [],
    sales: [],
    inventoryMovements: [],
    meta: {
        updatedAt: null
    }
};

class StateStore {
    constructor(filePath) {
        this.filePath = filePath;
        this.lockQueue = Promise.resolve();
    }

    clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    normalizeState(rawState) {
        const base = rawState && typeof rawState === 'object' ? rawState : {};
        return {
            products: Array.isArray(base.products) ? base.products : [],
            sales: Array.isArray(base.sales) ? base.sales : [],
            inventoryMovements: Array.isArray(base.inventoryMovements) ? base.inventoryMovements : [],
            meta: {
                updatedAt: base.meta?.updatedAt || null
            }
        };
    }

    async ensureFile() {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        try {
            await fs.access(this.filePath);
        } catch (_) {
            await this.write(DEFAULT_STATE);
        }
    }

    async read() {
        await this.ensureFile();
        const raw = await fs.readFile(this.filePath, 'utf8');
        const normalizedRaw = raw.replace(/^\uFEFF/, '');
        const parsed = normalizedRaw.trim() ? JSON.parse(normalizedRaw) : DEFAULT_STATE;
        return this.normalizeState(parsed);
    }

    async write(state) {
        const normalized = this.normalizeState(state);
        const tempPath = `${this.filePath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(normalized, null, 2), 'utf8');
        await fs.rename(tempPath, this.filePath);
    }

    async withLock(task) {
        let release;
        const previous = this.lockQueue;
        this.lockQueue = new Promise((resolve) => {
            release = resolve;
        });
        await previous;
        try {
            return await task();
        } finally {
            release();
        }
    }

    async update(mutator) {
        return this.withLock(async () => {
            const draft = await this.read();
            const response = await mutator(draft);
            draft.meta.updatedAt = new Date().toISOString();
            await this.write(draft);
            return response;
        });
    }
}

module.exports = {
    DEFAULT_STATE,
    StateStore
};
