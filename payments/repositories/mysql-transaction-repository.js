'use strict';

const { TransactionRepository } = require('./transaction-repository');

class MySqlTransactionRepository extends TransactionRepository {
    constructor(connection) {
        super();
        this.connection = connection;
    }

    async save(transactionResult) {
        const sql = `
            INSERT INTO payment_transactions (
                order_id,
                provider_name,
                terminal_provider,
                terminal_model,
                terminal_serial_number,
                payment_method,
                amount,
                currency,
                status,
                approved,
                provider_transaction_id,
                authorization_code,
                raw_response,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await this.connection.execute(sql, buildDbValues(transactionResult));
        return {
            id: result.insertId,
            ...transactionResult
        };
    }
}

function buildDbValues(transactionResult) {
    return [
        transactionResult.orderId,
        transactionResult.providerName,
        transactionResult.terminal?.provider || '',
        transactionResult.terminal?.model || '',
        transactionResult.terminal?.serialNumber || '',
        transactionResult.paymentMethod,
        transactionResult.amount,
        transactionResult.currency,
        transactionResult.status,
        transactionResult.approved ? 1 : 0,
        transactionResult.providerTransactionId,
        transactionResult.authorizationCode || '',
        JSON.stringify(transactionResult.raw || {})
    ];
}

module.exports = { MySqlTransactionRepository };
