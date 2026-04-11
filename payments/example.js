'use strict';

const { PaymentService } = require('./payment-service');
const { MockPaymentGateway } = require('./gateways/mock-gateway');
const { HttpPaymentGateway } = require('./gateways/http-gateway');
const { PostgresTransactionRepository } = require('./repositories/postgres-transaction-repository');
const { MySqlTransactionRepository } = require('./repositories/mysql-transaction-repository');

class InMemoryTransactionRepository {
    constructor() {
        this.items = [];
    }

    async save(transactionResult) {
        const record = {
            id: this.items.length + 1,
            ...transactionResult
        };
        this.items.push(record);
        return record;
    }
}

async function runMockExample() {
    const repository = new InMemoryTransactionRepository();
    const gateway = new MockPaymentGateway({
        providerName: 'stone',
        supportedTerminalModels: ['Stone', 'T3 Smart Ton', 'Point Pro 3', 'SumUp Total']
    });

    const paymentService = new PaymentService({ gateway, repository });

    try {
        const result = await paymentService.processTransaction({
            orderId: 'PED-1001',
            amount: 149.9,
            currency: 'BRL',
            paymentMethod: 'credit',
            description: 'Venda PDV EasyStore',
            terminal: {
                provider: 'Stone',
                model: 'Stone',
                serialNumber: 'STONE-TERM-001'
            },
            metadata: {
                customerId: 'CLI-22'
            }
        });

        console.log('Transacao processada com sucesso:', result);
    } catch (error) {
        PaymentService.handleError(error);
    }
}

async function runHttpGatewayExample() {
    const repository = new InMemoryTransactionRepository();
    const gateway = new HttpPaymentGateway({
        providerName: 'cielo',
        baseUrl: 'https://api.sua-adquirente.com',
        apiKey: 'SUA_CHAVE_DE_API',
        supportedTerminalModels: ['Cielo', 'Moderninha Plus 2', 'Infinite Smart']
    });

    const paymentService = new PaymentService({ gateway, repository });

    try {
        const result = await paymentService.processTransaction({
            orderId: 'PED-2001',
            amount: 89.5,
            currency: 'BRL',
            paymentMethod: 'debit',
            description: 'Venda de balcao',
            terminal: {
                provider: 'Cielo',
                model: 'Cielo LIO',
                serialNumber: 'CIELO-9988'
            }
        });

        console.log('Resultado HTTP:', result);
    } catch (error) {
        PaymentService.handleError(error);
    }
}

function postgresRepositoryExample(pgPool) {
    return new PostgresTransactionRepository(pgPool);
}

function mySqlRepositoryExample(mysqlConnection) {
    return new MySqlTransactionRepository(mysqlConnection);
}

if (require.main === module) {
    runMockExample();
}

module.exports = {
    runMockExample,
    runHttpGatewayExample,
    postgresRepositoryExample,
    mySqlRepositoryExample,
    InMemoryTransactionRepository
};
