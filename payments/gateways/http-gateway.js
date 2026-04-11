'use strict';

const { BasePaymentGateway } = require('./base-gateway');
const { PaymentGatewayError, PaymentDeclinedError } = require('../errors');

class HttpPaymentGateway extends BasePaymentGateway {
    constructor(options = {}) {
        super(options);
        this.baseUrl = String(options.baseUrl || '').replace(/\/+$/, '');
        this.apiKey = options.apiKey || '';
        this.timeoutMs = Number(options.timeoutMs || 15000);
        this.defaultHeaders = options.defaultHeaders || {};
        this.authType = String(options.authType || 'bearer').trim().toLowerCase();
        this.transactionPath = options.transactionPath || '/transactions';
        this.apiSecret = options.apiSecret || '';
        this.statusMap = options.statusMap || {};
        this.createPayload = options.createPayload || defaultCreatePayload;
        this.parseResponse = options.parseResponse || defaultParseResponse;
    }

    async initiateTransaction(transaction) {
        this.validateTransactionInput(transaction);

        if (!this.baseUrl) {
            throw new PaymentGatewayError('baseUrl da adquirente nao configurada.');
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const payload = this.createPayload(transaction);
            const response = await fetch(`${this.baseUrl}${this.transactionPath}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.buildAuthHeaders(),
                    ...this.defaultHeaders
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            const text = await response.text();
            const data = text ? safeJsonParse(text) : null;

            if (!response.ok) {
                throw new PaymentGatewayError('A API da adquirente retornou erro.', {
                    statusCode: response.status,
                    details: data || text
                });
            }

            const normalized = this.parseResponse(data, transaction);
            if (normalized.status === 'declined') {
                throw new PaymentDeclinedError('Transacao negada pela adquirente.', {
                    details: normalized
                });
            }

            return normalized;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new PaymentGatewayError('Tempo limite excedido ao comunicar com a adquirente.', {
                    code: 'PAYMENT_TIMEOUT',
                    cause: error
                });
            }

            if (error instanceof PaymentGatewayError || error instanceof PaymentDeclinedError) {
                throw error;
            }

            throw new PaymentGatewayError('Falha inesperada ao iniciar a transacao.', {
                cause: error
            });
        } finally {
            clearTimeout(timer);
        }
    }

    buildAuthHeaders() {
        if (!this.apiKey) {
            return {};
        }

        if (this.authType === 'x-api-key') {
            return { 'x-api-key': this.apiKey };
        }

        if (this.authType === 'basic') {
            const token = Buffer.from(`${this.apiKey}:${this.apiSecret || ''}`).toString('base64');
            return { Authorization: `Basic ${token}` };
        }

        return { Authorization: `Bearer ${this.apiKey}` };
    }
}

function defaultCreatePayload(transaction) {
    return {
        amount: Number(transaction.amount).toFixed(2),
        currency: String(transaction.currency || 'BRL').toUpperCase(),
        payment_method: transaction.paymentMethod,
        order_id: transaction.orderId,
        description: transaction.description || '',
        terminal: {
            serial_number: transaction.terminal?.serialNumber || '',
            model: transaction.terminal?.model || '',
            provider: transaction.terminal?.provider || ''
        },
        metadata: transaction.metadata || {}
    };
}

function defaultParseResponse(data, transaction) {
    const status = normalizeStatus(data?.status);
    return {
        providerTransactionId: data?.id || data?.transactionId || '',
        status,
        approved: status === 'approved',
        amount: Number(data?.amount || transaction.amount),
        raw: data
    };
}

function normalizeStatus(status) {
    const value = String(status || '').trim().toLowerCase();
    if (['approved', 'authorized', 'success', 'paid'].includes(value)) {
        return 'approved';
    }
    if (['denied', 'declined', 'not_authorized', 'refused'].includes(value)) {
        return 'declined';
    }
    return 'error';
}

function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch (_) {
        return null;
    }
}

module.exports = { HttpPaymentGateway };
