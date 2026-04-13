const { ValidationError } = require('./errors');

function ensureString(value, fieldName) {
    const normalized = String(value ?? '').trim();
    if (!normalized) {
        throw new ValidationError(`${fieldName} obrigatorio.`);
    }
    return normalized;
}

function ensurePositiveNumber(value, fieldName) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
        throw new ValidationError(`${fieldName} deve ser maior que zero.`);
    }
    return num;
}

function ensureNonNegativeNumber(value, fieldName) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
        throw new ValidationError(`${fieldName} deve ser um numero valido.`);
    }
    return num;
}

function parseOptionalDate(value) {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

module.exports = {
    ensureString,
    ensurePositiveNumber,
    ensureNonNegativeNumber,
    parseOptionalDate
};

