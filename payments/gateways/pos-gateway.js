/**
 * Base POS Gateway
 * Interface abstrata para implementação de diferentes gateways de pagamento
 */

class POSGateway {
  constructor(config = {}) {
    this.name = 'base';
    this.apiKey = config.apiKey;
    this.accountId = config.accountId;
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Iniciar uma transação de pagamento
   * @param {Transaction} transaction - Dados da transação
   * @returns {Promise<Object>} Resultado da transação
   */
  async initiatePayment(transaction) {
    throw new Error('initiatePayment() deve ser implementado');
  }

  /**
   * Verificar status de uma transação
   * @param {string} gatewayReference - Referência no gateway
   * @returns {Promise<Object>} Status da transação
   */
  async getTransactionStatus(gatewayReference) {
    throw new Error('getTransactionStatus() deve ser implementado');
  }

  /**
   * Cancelar uma transação
   * @param {string} gatewayReference - Referência no gateway
   * @returns {Promise<Object>} Resultado do cancelamento
   */
  async cancelTransaction(gatewayReference) {
    throw new Error('cancelTransaction() deve ser implementado');
  }

  /**
   * Reembolsar uma transação
   * @param {string} gatewayReference - Referência no gateway
   * @param {number} amount - Valor a reembolsar (opcional, se não informado reembolsa tudo)
   * @returns {Promise<Object>} Resultado do reembolso
   */
  async refundTransaction(gatewayReference, amount = null) {
    throw new Error('refundTransaction() deve ser implementado');
  }

  /**
   * Valida a configuração do gateway
   */
  validate() {
    if (!this.apiKey) {
      throw new Error(`${this.name}: API key não configurada`);
    }
    return true;
  }

  /**
   * Formata erro padrão
   */
  formatError(error, originalError = null) {
    return {
      success: false,
      error: error,
      details: originalError?.message || originalError,
    };
  }

  /**
   * Formata sucesso padrão
   */
  formatSuccess(data) {
    return {
      success: true,
      data,
    };
  }
}

module.exports = POSGateway;
