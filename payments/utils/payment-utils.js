/**
 * Utilities - Payment Helpers
 * Funções utilitárias para processamento de pagamentos
 */

const crypto = require('crypto');

class PaymentUtils {
  /**
   * Formata valor de centavos para reais
   */
  static formatCurrency(cents) {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  /**
   * Converte valor em reais para centavos
   */
  static toCents(reais) {
    return Math.round(reais * 100);
  }

  /**
   * Valida email
   */
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valida CPF brasileiro
   */
  static isValidCPF(cpf) {
    const digits = cpf.replace(/\D/g, '');
    
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
      return false;
    }

    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * (10 - i);
    }

    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits[i]) * (11 - i);
    }

    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return digits[9] == digit1 && digits[10] == digit2;
  }

  /**
   * Valida CNPJ brasileiro
   */
  static isValidCNPJ(cnpj) {
    const digits = cnpj.replace(/\D/g, '');
    
    if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
      return false;
    }

    // Validar dígitos verificadores
    let sum = 0;
    let multiplier = 5;

    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * multiplier;
      multiplier = multiplier === 2 ? 9 : multiplier - 1;
    }

    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    sum = 0;
    multiplier = 6;

    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits[i]) * multiplier;
      multiplier = multiplier === 2 ? 9 : multiplier - 1;
    }

    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return digits[12] == digit1 && digits[13] == digit2;
  }

  /**
   * Valida telefone brasileiro
   */
  static isValidPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 11 || digits.length === 10;
  }

  /**
   * Formata valor para exibição
   */
  static formatAmount(cents, decimalPlaces = 2) {
    const value = (cents / 100).toFixed(decimalPlaces);
    return parseFloat(value);
  }

  /**
   * Gera UUID v4
   */
  static generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Gera token aleatório
   */
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Criptografa string com SHA256
   */
  static hashSHA256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Criptografa com HMAC
   */
  static hmac(str, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret).update(str).digest('hex');
  }

  /**
   * Valida assinatura HMAC
   */
  static validateSignature(data, signature, secret, algorithm = 'sha256') {
    const expected = this.hmac(JSON.stringify(data), secret, algorithm);
    // Comparação timing-safe para evitar timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  /**
   * Criptografa dados (AES-256)
   */
  static encrypt(text, encryptionKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Descriptografa dados (AES-256)
   */
  static decrypt(text, encryptionKey) {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  }

  /**
   * Valida status de pagamento
   */
  static isValidPaymentStatus(status) {
    const validStatuses = [
      'pending',
      'processing',
      'approved',
      'declined',
      'cancelled',
      'refunded',
      'error',
    ];
    return validStatuses.includes(status);
  }

  /**
   * Retorna cor de status (para dashboard)
   */
  static getStatusColor(status) {
    const colors = {
      pending: '#FFA500', // Orange
      processing: '#4169E1', // Royal Blue
      approved: '#00AA00', // Green
      declined: '#FF0000', // Red
      cancelled: '#808080', // Gray
      refunded: '#9370DB', // Medium Purple
      error: '#FF0000', // Red
    };
    return colors[status] || '#000000';
  }

  /**
   * Retorna descrição de status em português
   */
  static describeStatus(status) {
    const descriptions = {
      pending: 'Pendente',
      processing: 'Processando',
      approved: 'Aprovado',
      declined: 'Recusado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
      error: 'Erro',
    };
    return descriptions[status] || 'Desconhecido';
  }

  /**
   * Calcula taxa de pagamento
   */
  static calculatePaymentFee(amount, feePercentage = 2.99, fixedFee = 30) {
    // Exemplo: 2.99% + R$ 0,30 (Stone)
    const percentageFee = (amount * feePercentage) / 100;
    return Math.round(percentageFee + fixedFee);
  }

  /**
   * Calcula valor com parcelamento
   */
  static calculateInstallmentValue(amount, installments, interestRate = 0) {
    // Juros simples por padrão
    const monthlyRate = interestRate / 100 / 12;
    const totalInterest = (amount * monthlyRate * installments);
    const totalAmount = amount + totalInterest;
    const installmentValue = Math.round(totalAmount / installments);
    
    return {
      totalAmount,
      totalInterest,
      installmentValue,
      installments,
    };
  }

  /**
   * Determine tipo de cartão pela bandeira
   */
  static getCardType(cardNumber) {
    const number = cardNumber.replace(/\D/g, '');
    
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(number)) return 'visa';
    if (/^5[1-5][0-9]{14}$/.test(number)) return 'mastercard';
    if (/^3[47][0-9]{13}$/.test(number)) return 'amex';
    if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(number)) return 'discover';
    if (/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/.test(number)) return 'diners';
    if (/^(?:2131|1800|35\d{3})\d{11}$/.test(number)) return 'jcb';
    
    return 'unknown';
  }

  /**
   * Mascara número de cartão
   */
  static maskCardNumber(cardNumber) {
    const number = cardNumber.replace(/\D/g, '');
    const masked = number.slice(-4);
    return `****.**** ****.**${masked}`;
  }

  /**
   * Valida número de cartão (Luhn Algorithm)
   */
  static isValidCardNumber(cardNumber) {
    const number = cardNumber.replace(/\D/g, '');
    
    if (number.length < 13 || number.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Valida data de validade (MM/YY)
   */
  static isValidCardExpiry(expiryMonth, expiryYear) {
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    const month = parseInt(expiryMonth, 10);
    const year = parseInt(expiryYear, 10);

    if (month < 1 || month > 12) {
      return false;
    }

    if (year < currentYear) {
      return false;
    }

    if (year === currentYear && month < currentMonth) {
      return false;
    }

    return true;
  }

  /**
   * Gera relatório de transações por período
   */
  static generateReport(transactions, startDate, endDate) {
    const filtered = transactions.filter(t => {
      const txnDate = new Date(t.createdAt);
      return txnDate >= startDate && txnDate <= endDate;
    });

    const stats = {
      period: {
        start: startDate,
        end: endDate,
      },
      totalTransactions: filtered.length,
      totalAmount: 0,
      byStatus: {},
      byGateway: {},
      byPaymentMethod: {},
      averageAmount: 0,
    };

    filtered.forEach(t => {
      stats.totalAmount += t.amount;
      stats.byStatus[t.status] = (stats.byStatus[t.status] || 0) + 1;
      stats.byGateway[t.gatewayName] = (stats.byGateway[t.gatewayName] || 0) + 1;
      stats.byPaymentMethod[t.paymentMethod] = (stats.byPaymentMethod[t.paymentMethod] || 0) + 1;
    });

    stats.averageAmount = filtered.length > 0 ? stats.totalAmount / filtered.length : 0;

    return stats;
  }
}

module.exports = PaymentUtils;
