'use strict';

const { PaymentValidationError } = require('../errors');

class BasePaymentGateway {
    constructor(options = {}) {
        this.providerName = options.providerName || 'generic';
        this.supportedTerminalModels = options.supportedTerminalModels || [];
    }

    getMetadata() {
        return {
            providerName: this.providerName,
            supportedTerminalModels: [...this.supportedTerminalModels]
        };
    }

    validateTransactionInput(transaction) {
        if (!transaction || typeof transaction !== 'object') {
            throw new PaymentValidationError('Os dados da transacao sao obrigatorios.');
        }

        const amount = Number(transaction.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new PaymentValidationError('O valor da transacao deve ser maior que zero.');
        }

        const paymentMethod = String(transaction.paymentMethod || '').trim().toLowerCase();
        if (!['credit', 'debit', 'pix', 'voucher'].includes(paymentMethod)) {
            throw new PaymentValidationError('Forma de pagamento invalida. Use credit, debit, pix ou voucher.');
        }

        const currency = String(transaction.currency || 'BRL').trim().toUpperCase();
        if (currency !== 'BRL') {
            throw new PaymentValidationError('Este exemplo suporta apenas transacoes em BRL.');
        }
    }

    async initiateTransaction() {
        throw new Error('initiateTransaction precisa ser implementado pelo gateway.');
    }
}

module.exports = { BasePaymentGateway };
