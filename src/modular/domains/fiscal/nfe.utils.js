const crypto = require('crypto');

function onlyDigits(value) {
    return String(value ?? '').replace(/\D/g, '');
}

function padLeft(value, length) {
    return String(value ?? '').padStart(length, '0').slice(-length);
}

function formatDecimal(value, digits = 2) {
    const number = Number(value || 0);
    return number.toFixed(digits);
}

function generateRandomDigits(length) {
    const bytes = crypto.randomBytes(Math.ceil(length / 2)).toString('hex');
    const numbers = onlyDigits(bytes);
    if (numbers.length >= length) {
        return numbers.slice(0, length);
    }
    return (numbers + generateRandomDigits(length)).slice(0, length);
}

function calculateModulo11(base) {
    let multiplier = 2;
    let sum = 0;
    for (let index = base.length - 1; index >= 0; index -= 1) {
        sum += Number(base[index]) * multiplier;
        multiplier = multiplier === 9 ? 2 : multiplier + 1;
    }
    const mod = sum % 11;
    const digit = 11 - mod;
    return digit >= 10 ? '0' : String(digit);
}

function getCurrentAAMM(date = new Date()) {
    const year = String(date.getFullYear()).slice(-2);
    const month = padLeft(date.getMonth() + 1, 2);
    return `${year}${month}`;
}

function buildAccessKey({
    cUF,
    emissionDate,
    cnpj,
    model = '55',
    serie,
    nNF,
    tpEmis = '1',
    cNF
}) {
    const keyWithoutDigit = [
        padLeft(cUF, 2),
        getCurrentAAMM(emissionDate),
        padLeft(onlyDigits(cnpj), 14),
        padLeft(model, 2),
        padLeft(serie, 3),
        padLeft(nNF, 9),
        padLeft(tpEmis, 1),
        padLeft(cNF, 8)
    ].join('');

    const cDV = calculateModulo11(keyWithoutDigit);
    return `${keyWithoutDigit}${cDV}`;
}

function formatDateTimeWithTimezone(dateValue) {
    const date = dateValue ? new Date(dateValue) : new Date();
    const pad = (number) => String(number).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const timezoneOffset = -date.getTimezoneOffset();
    const signal = timezoneOffset >= 0 ? '+' : '-';
    const tzHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
    const tzMinutes = pad(Math.abs(timezoneOffset) % 60);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${signal}${tzHours}:${tzMinutes}`;
}

function mapPaymentToTPag(method) {
    const normalized = String(method || '').toLowerCase().trim();
    if (normalized === 'dinheiro') {
        return '01';
    }
    if (normalized === 'cheque') {
        return '02';
    }
    if (normalized === 'credito') {
        return '03';
    }
    if (normalized === 'debito') {
        return '04';
    }
    if (normalized === 'pix') {
        return '17';
    }
    if (normalized === 'boleto') {
        return '15';
    }
    return '99';
}

function normalizeDocument(document) {
    const digits = onlyDigits(document);
    if (digits.length === 11) {
        return { CPF: digits };
    }
    if (digits.length === 14) {
        return { CNPJ: digits };
    }
    return null;
}

function getUfCode(uf) {
    const map = {
        RO: '11',
        AC: '12',
        AM: '13',
        RR: '14',
        PA: '15',
        AP: '16',
        TO: '17',
        MA: '21',
        PI: '22',
        CE: '23',
        RN: '24',
        PB: '25',
        PE: '26',
        AL: '27',
        SE: '28',
        BA: '29',
        MG: '31',
        ES: '32',
        RJ: '33',
        SP: '35',
        PR: '41',
        SC: '42',
        RS: '43',
        MS: '50',
        MT: '51',
        GO: '52',
        DF: '53'
    };
    return map[String(uf || '').toUpperCase()] || '50';
}

function escapeXml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = {
    onlyDigits,
    padLeft,
    formatDecimal,
    generateRandomDigits,
    buildAccessKey,
    formatDateTimeWithTimezone,
    mapPaymentToTPag,
    normalizeDocument,
    getUfCode,
    escapeXml
};
