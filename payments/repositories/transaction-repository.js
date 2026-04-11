'use strict';

class TransactionRepository {
    async save() {
        throw new Error('save precisa ser implementado pelo repositorio.');
    }
}

module.exports = { TransactionRepository };
