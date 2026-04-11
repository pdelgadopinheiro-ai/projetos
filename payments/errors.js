'use strict';

class PaymentError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'PaymentError';
        this.code = details.code || 'PAYMENT_ERROR';
        this.statusCode = details.statusCode || 500;
        this.cause = details.cause;
        this.details = details.details || null;
    }
}

class PaymentValidationError extends PaymentError {
    constructor(message, details = {}) {
        super(message, {
            ...details,
            code: details.code || 'PAYMENT_VALIDATION_ERROR',
            statusCode: details.statusCode || 400
        });
        this.name = 'PaymentValidationError';
    }
}

class PaymentGatewayError extends PaymentError {
    constructor(message, details = {}) {
        super(message, {
            ...details,
            code: details.code || 'PAYMENT_GATEWAY_ERROR',
            statusCode: details.statusCode || 502
        });
        this.name = 'PaymentGatewayError';
    }
}

class PaymentDeclinedError extends PaymentError {
    constructor(message, details = {}) {
        super(message, {
            ...details,
            code: details.code || 'PAYMENT_DECLINED',
            statusCode: details.statusCode || 402
        });
        this.name = 'PaymentDeclinedError';
    }
}

module.exports = {
    PaymentError,
    PaymentValidationError,
    PaymentGatewayError,
    PaymentDeclinedError
};
