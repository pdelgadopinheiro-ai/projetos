/**
 * Payment Controller
 * Lida com requisições HTTP relacionadas a pagamentos
 */

const { PaymentService } = require('../services/payment-service');
const { ValidationError, NotFoundError } = require('../services/payment-service');

class PaymentController {
  constructor(options = {}) {
    this.paymentService = options.paymentService;
    this.logger = options.logger || console;
  }

  /**
   * POST /payments
   * Inicia um novo pagamento
   * 
   * Payload esperado:
   * {
   *   "orderId": "PED-001",
   *   "amount": 10000,  // em centavos (R$ 100,00)
   *   "installments": 3,
   *   "description": "Compra de produtos",
   *   "customerName": "João Silva",
   *   "customerEmail": "joao@email.com",
   *   "customerPhone": "11999999999",
   *   "paymentMethod": "credit_card",  // credit_card, debit_card, pix
   *   "metadata": { "productIds": [1, 2, 3] }  // opcional
   * }
   */
  async initiate(req, res) {
    try {
      this.logger.log('POST /payments - Iniciando pagamento');
      
      const paymentData = {
        orderId: req.body.orderId,
        amount: parseInt(req.body.amount),
        installments: parseInt(req.body.installments) || 1,
        description: req.body.description,
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone,
        paymentMethod: req.body.paymentMethod || 'credit_card',
        metadata: req.body.metadata || {},
      };

      const result = await this.paymentService.processPayment(paymentData);

      return res.status(201).json({
        success: true,
        message: result.message,
        transaction: result.transaction,
      });
    } catch (error) {
      this.logger.error('Erro ao iniciar pagamento:', error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message,
          details: error.errors,
        });
      }

      if (error.name === 'PaymentGatewayError') {
        return res.status(502).json({
          success: false,
          error: 'Erro ao comunicar com gateway de pagamento',
          details: error.details,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno ao processar pagamento',
        message: error.message,
      });
    }
  }

  /**
   * GET /payments/:transactionId
   * Busca status de uma transação
   */
  async getStatus(req, res) {
    try {
      const { transactionId } = req.params;
      
      this.logger.log('GET /payments/:transactionId - Consultando status:', transactionId);
      
      const result = await this.paymentService.getPaymentStatus(transactionId);

      return res.status(200).json({
        success: true,
        transaction: result.transaction,
      });
    } catch (error) {
      this.logger.error('Erro ao consultar status:', error);

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar status do pagamento',
        message: error.message,
      });
    }
  }

  /**
   * POST /payments/:transactionId/cancel
   * Cancela uma transação
   */
  async cancel(req, res) {
    try {
      const { transactionId } = req.params;
      
      this.logger.log('POST /payments/:transactionId/cancel - Cancelando:', transactionId);
      
      const result = await this.paymentService.cancelPayment(transactionId);

      return res.status(200).json({
        success: true,
        message: 'Transação cancelada com sucesso',
        transaction: result.transaction,
      });
    } catch (error) {
      this.logger.error('Erro ao cancelar:', error);

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      if (error.name === 'PaymentError') {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao cancelar pagamento',
        message: error.message,
      });
    }
  }

  /**
   * POST /payments/:transactionId/refund
   * Reembolsa uma transação
   * 
   * Payload opcional:
   * {
   *   "amount": 5000  // em centavos, opcional (se não informado, reembolsa tudo)
   * }
   */
  async refund(req, res) {
    try {
      const { transactionId } = req.params;
      const { amount } = req.body;
      
      this.logger.log('POST /payments/:transactionId/refund - Reembolsando:', transactionId);
      
      const result = await this.paymentService.refundPayment(transactionId, amount);

      return res.status(200).json({
        success: true,
        message: 'Reembolso processado com sucesso',
        transaction: result.transaction,
      });
    } catch (error) {
      this.logger.error('Erro ao reembolsar:', error);

      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      if (error.name === 'PaymentError') {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao processar reembolso',
        message: error.message,
      });
    }
  }

  /**
   * GET /payments/orders/:orderId
   * Lista transações de um pedido
   */
  async getByOrderId(req, res) {
    try {
      const { orderId } = req.params;
      
      this.logger.log('GET /payments/orders/:orderId - Buscando transações:', orderId);
      
      const transactions = await this.paymentService.transactionRepository.findByOrderId(orderId);

      return res.status(200).json({
        success: true,
        count: transactions.length,
        transactions: transactions.map(t => t.toJSON()),
      });
    } catch (error) {
      this.logger.error('Erro ao listar transações:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao listar transações',
        message: error.message,
      });
    }
  }

  /**
   * GET /payments/gateway/info
   * Retorna informações sobre o gateway configurado
   */
  async getGatewayInfo(req, res) {
    try {
      const info = this.paymentService.getGatewayInfo();
      
      return res.status(200).json({
        success: true,
        gateway: info,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar informações do gateway',
      });
    }
  }

  /**
   * GET /payments/stats
   * Retorna estatísticas de transações
   */
  async getStatistics(req, res) {
    try {
      const stats = await this.paymentService.transactionRepository.getStatistics();
      
      return res.status(200).json({
        success: true,
        statistics: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao obter estatísticas',
        message: error.message,
      });
    }
  }
}

module.exports = PaymentController;
