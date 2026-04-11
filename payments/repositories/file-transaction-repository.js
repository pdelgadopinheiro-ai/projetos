'use strict';

const fs = require('fs');
const path = require('path');
const { TransactionRepository } = require('./transaction-repository');

class FileTransactionRepository extends TransactionRepository {
    constructor(filePath) {
        super();
        this.filePath = path.resolve(filePath);
    }

    async save(transactionResult) {
        await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });

        const existing = await this.readAll();
        const record = {
            id: existing.length + 1,
            savedAt: new Date().toISOString(),
            ...transactionResult
        };

        existing.push(record);
        await fs.promises.writeFile(this.filePath, JSON.stringify(existing, null, 2), 'utf8');
        return record;
    }

    async readAll() {
        try {
            const content = await fs.promises.readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(content);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
}

module.exports = { FileTransactionRepository };
