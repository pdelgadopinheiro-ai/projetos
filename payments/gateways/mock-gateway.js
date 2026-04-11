'use strict';

const { BasePaymentGateway } = require('./base-gateway');

class MockPaymentGateway extends BasePaymentGateway {
    constructor(options = {}) {
        super({
            providerName: options.providerName || 'mock-acquirer',
            supportedTerminalModels: options.supportedTerminalModels || [
                'T3 Ton Turbo',
                'Point Smart 2',
                'Infinite Smart',
                'Moderninha Pro 2',
                'SumUp Total',
                'Stone',
                'Cielo'
            ]
        });
    }

    async initiateTransaction(transaction) {
        this.validateTransactionInput(transaction);

        const cents = Math.round(Number(transaction.amount) * 100);
        const status = cents % 5 === 0 ? 'declined' : 'approved';

        return {
            providerTransactionId: `mock_${Date.now()}`,
            status,
            approved: status === 'approved',
            amount: Number(transaction.amount),
            authorizationCode: status === 'approved' ? `AUT${String(cents).padStart(6, '0')}` : '',
            raw: {
                simulated: true,
                provider: this.providerName,
                terminal: transaction.terminal || null
            }
        };
    }
}

module.exports = { MockPaymentGateway };
