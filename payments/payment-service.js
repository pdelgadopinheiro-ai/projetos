'use strict';

const {
    PaymentError,
    PaymentGatewayError,
    PaymentValidationError,
    PaymentDeclinedError
} = require('./errors');

class PaymentService {
    constructor({ gateway, repository, logger = console } = {}) {
        if (!gateway) {
            throw new PaymentValidationError('gateway e obrigatorio para PaymentService.');
        }
        if (!repository) {
            throw new PaymentValidationError('repository e obrigatorio para PaymentService.');
        }

        this.gateway = gateway;
        this.repository = repository;
        this.logger = logger;
    }

    async processTransaction(input) {
        this.validateInput(input);

        let gatewayResult;

        try {
            gatewayResult = await this.gateway.initiateTransaction(input);
        } catch (error) {
            if (error instanceof PaymentDeclinedError) {
                const declinedRecord = this.buildResultRecord(input, {
                    providerTransactionId: '',
                    status: 'declined',
                    approved: false,
                    authorizationCode: '',
                    raw: error.details || null
                });
                await this.repository.save(declinedRecord);
                return declinedRecord;
            }

            if (error instanceof PaymentGatewayError) {
                const errorRecord = this.buildResultRecord(input, {
                    providerTransactionId: '',
                    status: 'error',
                    approved: false,
                    authorizationCode: '',
                    raw: {
                        message: error.message,
                        code: error.code,
                        details: error.details || null
                    }
                });
                await this.repository.save(errorRecord);
                throw error;
            }

            throw error;
        }

        const record = this.buildResultRecord(input, gatewayResult);
        await this.repository.save(record);
        return record;
    }

    validateInput(input) {
        if (!input || typeof input !== 'object') {
            throw new PaymentValidationError('Dados da transacao obrigatorios.');
        }
        if (!input.orderId) {
            throw new PaymentValidationError('orderId e obrigatorio.');
        }
        if (!input.terminal || !input.terminal.provider || !input.terminal.model) {
            throw new PaymentValidationError('terminal.provider e terminal.model sao obrigatorios.');
        }
    }

    buildResultRecord(input, gatewayResult) {
        return {
            orderId: input.orderId,
            providerName: this.gateway.getMetadata().providerName,
            paymentMethod: input.paymentMethod,
            amount: Number(input.amount),
            currency: String(input.currency || 'BRL').toUpperCase(),
            terminal: {
                provider: input.terminal.provider,
                model: input.terminal.model,
                serialNumber: input.terminal.serialNumber || '',
                connectionType: input.terminal.connectionType || '',
                integrationMode: input.terminal.integrationMode || ''
            },
            providerTransactionId: gatewayResult.providerTransactionId || '',
            authorizationCode: gatewayResult.authorizationCode || '',
            status: gatewayResult.status,
            approved: Boolean(gatewayResult.approved),
            raw: gatewayResult.raw || null
        };
    }

    static handleError(error, logger = console) {
        if (error instanceof PaymentValidationError) {
            logger.warn('Erro de validacao na transacao:', error.message);
            return;
        }

        if (error instanceof PaymentGatewayError) {
            logger.error('Erro de comunicacao com a adquirente:', error.message, error.details || '');
            return;
        }

        if (error instanceof PaymentError) {
            logger.error('Erro de pagamento:', error.message);
            return;
        }

        logger.error('Erro inesperado:', error);
    }
}

module.exports = { PaymentService };
