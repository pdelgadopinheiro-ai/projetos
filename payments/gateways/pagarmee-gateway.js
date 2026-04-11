/**
 * Pagar.me Payment Gateway
 * Integração com a API de pagamentos Pagar.me
 */

const POSGateway = require('./pos-gateway');

class PagarmeGateway extends POSGateway {
  constructor(config = {}) {
    super(config);
    this.name = 'pagar-me';
    this.baseUrl = config.baseUrl || 'https://api.pagar.me/core/v5';
  }

  /**
   * Inicia transação de pagamento na Pagar.me
   */
  async initiatePayment(transaction) {
    try {
      this.validate();

      const payload = {
        amount: transaction.amount,
        installments: transaction.installments,
        description: transaction.description,
        customer: {
          name: transaction.customerName,
          email: transaction.customerEmail,
          phone: transaction.customerPhone,
          type: 'individual',
        },
        payment_method: this.mapPaymentMethod(transaction.paymentMethod),
        reference_id: transaction.id,
        metadata: transaction.metadata,
      };

      // Em produção, fazer requisição real:
      // const response = await axios.post(`${this.baseUrl}/charges`, payload, {
      //   auth: {
      //     username: this.apiKey,
      //     password: '',
      //   },
      //   timeout: this.timeout,
      // });

      // Para simulação
      const chargeId = `ch_${Date.now()}`;

      return this.formatSuccess({
        gatewayReference: chargeId,
        gatewayName: 'pagar-me',
        status: 'processing',
        message: 'Transação enviada para processamento na Pagar.me',
      });
    } catch (error) {
      return this.formatError('Erro ao iniciar transação na Pagar.me', error);
    }
  }

  /**
   * Busca status de transação na Pagar.me
   */
  async getTransactionStatus(gatewayReference) {
    try {
      this.validate();

      // Em produção:
      // const response = await axios.get(`${this.baseUrl}/charges/${gatewayReference}`, {
      //   auth: { username: this.apiKey, password: '' },
      //   timeout: this.timeout,
      // });

      // Simular diferentes resultados
      const random = Math.random();
      let status;

      if (random < 0.75) { // 75% aprovadas
        status = 'approved';
      } else if (random < 0.9) { // 15% recusadas
        status = 'declined';
      } else { // 10% ainda processando
        status = 'processing';
      }

      return this.formatSuccess({
        gatewayReference,
        status,
        transactionNumber: `PGME_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        acquirerResponseCode: status === 'approved' ? '00' : '05',
      });
    } catch (error) {
      return this.formatError('Erro ao consultar status na Pagar.me', error);
    }
  }

  /**
   * Cancela transação na Pagar.me
   */
  async cancelTransaction(gatewayReference) {
    try {
      this.validate();

      // Em produção:
      // const response = await axios.delete(`${this.baseUrl}/charges/${gatewayReference}`, {
      //   auth: { username: this.apiKey, password: '' },
      //   timeout: this.timeout,
      // });

      return this.formatSuccess({
        gatewayReference,
        status: 'cancelled',
        message: 'Transação cancelada com sucesso na Pagar.me',
      });
    } catch (error) {
      return this.formatError('Erro ao cancelar transação na Pagar.me', error);
    }
  }

  /**
   * Reembolsa transação na Pagar.me
   */
  async refundTransaction(gatewayReference, amount = null) {
    try {
      this.validate();

      const payload = amount ? { amount } : {};

      // Em produção:
      // const response = await axios.post(
      //   `${this.baseUrl}/charges/${gatewayReference}/refund`,
      //   payload,
      //   { auth: { username: this.apiKey, password: '' }, timeout: this.timeout }
      // );

      return this.formatSuccess({
        gatewayReference,
        status: 'refunded',
        refundAmount: amount,
        refundId: `rfn_${Date.now()}`,
      });
    } catch (error) {
      return this.formatError('Erro ao reembolsar transação na Pagar.me', error);
    }
  }

  /**
   * Mapeia métodos de pagamento locais para Pagar.me
   */
  mapPaymentMethod(method) {
    const mapping = {
      credit_card: 'credit_card',
      debit_card: 'debit_card',
      pix: 'pix',
    };
    return mapping[method] || 'credit_card';
  }
}

module.exports = PagarmeGateway;
