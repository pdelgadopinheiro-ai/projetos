/**
 * Transaction Model
 * Representa uma transação de pagamento no sistema
 */

class Transaction {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.orderId = data.orderId; // ID do pedido no sistema
    this.amount = data.amount; // Valor em centavos (ex: 1000 = R$ 10,00)
    this.installments = data.installments || 1;
    this.description = data.description;
    this.customerName = data.customerName;
    this.customerEmail = data.customerEmail;
    this.customerPhone = data.customerPhone;
    this.paymentMethod = data.paymentMethod || 'credit_card'; // credit_card, debit_card, pix
    
    // Status do pagamento
    // pending, processing, approved, declined, cancelled, refunded, error
    this.status = data.status || 'pending';
    
    // Referência do gateway
    this.gatewayReference = data.gatewayReference;
    this.gatewayName = data.gatewayName;
    
    // Dados adicionais
    this.metadata = data.metadata || {};
    this.errorMessage = data.errorMessage;
    
    // Timestamps
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.approvedAt = data.approvedAt;
    this.declinedAt = data.declinedAt;
  }

  /**
   * Gera um ID único para a transação
   */
  generateId() {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida os dados obrigatórios
   */
  validate() {
    const errors = [];

    if (!this.orderId) errors.push('orderId é obrigatório');
    if (!this.amount || this.amount <= 0) errors.push('amount deve ser maior que 0');
    if (this.installments < 1 || this.installments > 12) {
      errors.push('installments deve estar entre 1 e 12');
    }
    if (!this.customerName) errors.push('customerName é obrigatório');
    if (!this.customerEmail) errors.push('customerEmail é obrigatório');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Retorna os dados para envio ao gateway
   */
  toGatewayPayload() {
    return {
      transactionId: this.id,
      orderId: this.orderId,
      amount: this.amount,
      installments: this.installments,
      description: this.description,
      customer: {
        name: this.customerName,
        email: this.customerEmail,
        phone: this.customerPhone,
      },
      paymentMethod: this.paymentMethod,
      metadata: this.metadata,
    };
  }

  /**
   * Atualiza o status da transação
   */
  updateStatus(newStatus, additionalData = {}) {
    this.status = newStatus;
    this.updatedAt = new Date();

    if (newStatus === 'approved') {
      this.approvedAt = new Date();
    } else if (newStatus === 'declined') {
      this.declinedAt = new Date();
    }

    Object.assign(this, additionalData);
  }

  /**
   * Retorna um JSON seguro (sem dados sensíveis)
   */
  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      amount: this.amount,
      installments: this.installments,
      status: this.status,
      paymentMethod: this.paymentMethod,
      gatewayName: this.gatewayName,
      customerEmail: this.customerEmail,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      approvedAt: this.approvedAt,
      declinedAt: this.declinedAt,
    };
  }
}

module.exports = Transaction;
