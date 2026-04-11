/**
 * Mock POS Gateway
 * Simulação de gateway para testes e desenvolvimento
 */

const POSGateway = require('./pos-gateway');

class MockPOSGateway extends POSGateway {
  constructor(config = {}) {
    super(config);
    this.name = 'mock';
    this.transactions = new Map(); // Armazenar transações em memória para teste
  }

  /**
   * Simula transação de pagamento
   * Aprova/recusa baseado em regras para teste
   */
  async initiatePayment(transaction) {
    try {
      const mockTransactionId = `mock_${Date.now()}`;
      
      // Regras de simulação:
      // - Valor terminado em 0 = recusado
      // - Valor >= R$ 1.000 com 3+ parcelas = processando
      // - Caso contrário = aprovado
      
      let status = 'approved';
      let message = 'Transação aprovada (simulação)';

      if (transaction.amount % 10 === 0) {
        status = 'declined';
        message = 'Transação recusada (simulação) - valor termina em zero';
      } else if (transaction.amount >= 100000 && transaction.installments >= 3) {
        status = 'processing';
        message = 'Transação em processamento (simulação)';
      }

      // Armazenar para simular consultas futuras
      this.transactions.set(mockTransactionId, {
        transaction,
        status,
        createdAt: new Date(),
        // Mudar status após 2 segundos se estiver processando
        updateAt: new Date(Date.now() + 2000),
      });

      return this.formatSuccess({
        gatewayReference: mockTransactionId,
        gatewayName: 'mock',
        status,
        message,
        authorization: status === 'approved' ? `MOCK_${Math.random().toString(36).substr(2, 8).toUpperCase()}` : null,
      });
    } catch (error) {
      return this.formatError('Erro ao simular transação', error);
    }
  }

  /**
   * Simula consulta de status
   */
  async getTransactionStatus(gatewayReference) {
    try {
      const txn = this.transactions.get(gatewayReference);

      if (!txn) {
        return this.formatError('Transação simulada não encontrada');
      }

      // Se está em processamento e passou o tempo, aprovar
      let status = txn.status;
      if (status === 'processing' && Date.now() >= txn.updateAt) {
        status = 'approved';
        txn.status = status; // Atualizar estado
      }

      return this.formatSuccess({
        gatewayReference,
        status,
        updatedAt: new Date(),
      });
    } catch (error) {
      return this.formatError('Erro ao consultar status simulado', error);
    }
  }

  /**
   * Simula cancelamento
   */
  async cancelTransaction(gatewayReference) {
    try {
      const txn = this.transactions.get(gatewayReference);

      if (!txn) {
        return this.formatError('Transação simulada não encontrada');
      }

      txn.status = 'cancelled';

      return this.formatSuccess({
        gatewayReference,
        status: 'cancelled',
        message: 'Transação cancelada com sucesso (simulação)',
      });
    } catch (error) {
      return this.formatError('Erro ao cancelar transação simulada', error);
    }
  }

  /**
   * Simula reembolso
   */
  async refundTransaction(gatewayReference, amount = null) {
    try {
      const txn = this.transactions.get(gatewayReference);

      if (!txn) {
        return this.formatError('Transação simulada não encontrada');
      }

      txn.status = 'refunded';

      return this.formatSuccess({
        gatewayReference,
        status: 'refunded',
        refundAmount: amount || txn.transaction.amount,
        message: 'Reembolso processado (simulação)',
      });
    } catch (error) {
      return this.formatError('Erro ao reembolsar transação simulada', error);
    }
  }

  /**
   * Limpa transações armazenadas (testando)
   */
  clearMockTransactions() {
    this.transactions.clear();
  }

  /**
   * Retorna todas as transações mock (para debug)
   */
  getMockTransactions() {
    return Array.from(this.transactions.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }
}

module.exports = MockPOSGateway;
