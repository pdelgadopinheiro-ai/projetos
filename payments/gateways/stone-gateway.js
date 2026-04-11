/**
 * Stone Payment Gateway
 * Integração com a API de pagamentos Stone
 */

const POSGateway = require('./pos-gateway');

class StoneGateway extends POSGateway {
  constructor(config = {}) {
    super(config);
    this.name = 'stone';
    this.baseUrl = config.baseUrl || 'https://api.stone.com.br/v1';
  }

  /**
   * Inicia transação de pagamento na Stone
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
        },
        reference: transaction.id, // Referência única
        callback_url: process.env.WEBHOOK_URL,
      };

      // Em produção, fazer requisição real:
      // const response = await axios.post(`${this.baseUrl}/transactions`, payload, {
      //   headers: { Authorization: `Bearer ${this.apiKey}` },
      //   timeout: this.timeout,
      // });

      // Para simulação, retornamos uma resposta mockada
      const stoneTransactionId = `stone_${Date.now()}`;

      return this.formatSuccess({
        gatewayReference: stoneTransactionId,
        gatewayName: 'stone',
        status: 'processing',
        message: 'Transação enviada para processamento na Stone',
      });
    } catch (error) {
      return this.formatError('Erro ao iniciar transação na Stone', error);
    }
  }

  /**
   * Busca status de transação na Stone
   */
  async getTransactionStatus(gatewayReference) {
    try {
      this.validate();

      // Em produção:
      // const response = await axios.get(`${this.baseUrl}/transactions/${gatewayReference}`, {
      //   headers: { Authorization: `Bearer ${this.apiKey}` },
      //   timeout: this.timeout,
      // });

      // Simular diferentes respostas
      const random = Math.random();
      let status, approvalCode;

      if (random < 0.8) { // 80% aprovadas
        status = 'approved';
        approvalCode = `STONE_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      } else { // 20% recusadas
        status = 'declined';
        approvalCode = null;
      }

      return this.formatSuccess({
        gatewayReference,
        status,
        approvalCode,
        lastUpdate: new Date(),
      });
    } catch (error) {
      return this.formatError('Erro ao consultar status na Stone', error);
    }
  }

  /**
   * Cancela transação na Stone
   */
  async cancelTransaction(gatewayReference) {
    try {
      this.validate();

      // Em produção:
      // const response = await axios.post(
      //   `${this.baseUrl}/transactions/${gatewayReference}/cancel`,
      //   {},
      //   { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: this.timeout }
      // );

      return this.formatSuccess({
        gatewayReference,
        status: 'cancelled',
        message: 'Transação cancelada com sucesso na Stone',
      });
    } catch (error) {
      return this.formatError('Erro ao cancelar transação na Stone', error);
    }
  }

  /**
   * Reembolsa transação na Stone
   */
  async refundTransaction(gatewayReference, amount = null) {
    try {
      this.validate();

      const payload = { amount };

      // Em produção:
      // const response = await axios.post(
      //   `${this.baseUrl}/transactions/${gatewayReference}/refund`,
      //   payload,
      //   { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: this.timeout }
      // );

      return this.formatSuccess({
        gatewayReference,
        status: 'refunded',
        refundAmount: amount,
        message: 'Reembolso processado com sucesso na Stone',
      });
    } catch (error) {
      return this.formatError('Erro ao reembolsar transação na Stone', error);
    }
  }
}

module.exports = StoneGateway;
