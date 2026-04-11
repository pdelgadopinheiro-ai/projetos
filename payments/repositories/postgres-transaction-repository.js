'use strict';

const { TransactionRepository } = require('./transaction-repository');

class PostgresTransactionRepository extends TransactionRepository {
    constructor(pool) {
        super();
        this.pool = pool;
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
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13::jsonb, NOW()
            )
            RETURNING id
        `;

        const values = buildDbValues(transactionResult);
        const result = await this.pool.query(sql, values);
        return {
            id: result.rows[0].id,
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
        transactionResult.approved,
        transactionResult.providerTransactionId,
        transactionResult.authorizationCode || '',
        JSON.stringify(transactionResult.raw || {})
    ];
}

module.exports = { PostgresTransactionRepository };
