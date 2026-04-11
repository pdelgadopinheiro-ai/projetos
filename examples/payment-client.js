/**
 * EXEMPLO 1: Cliente de Pagamento (Node.js com Axios)
 * Demonstra como integrar pagamentos no seu sistema
 */

const axios = require('axios');

class PaymentClient {
  constructor(baseURL = 'http://localhost:3000', apiKey = null) {
    this.baseURL = baseURL;
    this.apiKey = apiKey || 'sk_test_example_key_123456';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
  }

  /**
   * Inicia um pagamento
   */
  async initiatePayment(orderData) {
    try {
      console.log('📤 Iniciando pagamento:', orderData.orderId);

      const response = await this.client.post('/payments', {
        orderId: orderData.orderId,
        amount: orderData.amount, // em centavos
        installments: orderData.installments || 1,
        description: orderData.description,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        paymentMethod: orderData.paymentMethod || 'credit_card',
        metadata: orderData.metadata || {},
      });

      console.log('✅ Pagamento iniciado:', response.data.transaction.id);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao iniciar pagamento:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(transactionId) {
    try {
      const response = await this.client.get(`/payments/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao consultar status:', error.message);
      throw error;
    }
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(transactionId) {
    try {
      const response = await this.client.post(`/payments/${transactionId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao cancelar pagamento:', error.message);
      throw error;
    }
  }

  /**
   * Reembolsa um pagamento
   */
  async refundPayment(transactionId, amount = null) {
    try {
      const response = await this.client.post(`/payments/${transactionId}/refund`, {
        amount, // opcional
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao reembolsar pagamento:', error.message);
      throw error;
    }
  }

  /**
   * Lista transações de um pedido
   */
  async getOrderTransactions(orderId) {
    try {
      const response = await this.client.get(`/payments/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar transações:', error.message);
      throw error;
    }
  }

  /**
   * Obtém informações do gateway
   */
  async getGatewayInfo() {
    try {
      const response = await this.client.get('/payments/gateway/info');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter info do gateway:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas
   */
  async getStatistics() {
    try {
      const response = await this.client.get('/payments/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error.message);
      throw error;
    }
  }
}

module.exports = PaymentClient;
