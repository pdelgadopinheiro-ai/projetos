/**
 * Payment Webhook Handler
 * Processa callbacks/webhooks dos gateways de pagamento
 */

class WebhookHandler {
  constructor(options = {}) {
    this.paymentService = options.paymentService;
    this.logger = options.logger || console;
  }

  /**
   * POST /webhooks/payment
   * Recebe notificação do gateway sobre mudança de status
   * 
   * Exemplo de payload do Stone:
   * {
   *   "gatewayReference": "stone_1234567890",
   *   "status": "approved",
   *   "orderId": "PED-001",
   *   "amount": 10000,
   *   "timestamp": "2024-01-15T10:30:00Z",
   *   "signature": "abc123..."
   * }
   */
  async handle(req, res) {
    try {
      this.logger.log('🔔 Webhook recebido:', req.path);
      
      const webhookData = req.body;

      // Validar que temos os dados mínimos
      if (!webhookData.gatewayReference) {
        this.logger.warn('⚠️ Webhook inválido - falta gatewayReference');
        return res.status(400).json({
          success: false,
          error: 'Webhook inválido - falta gatewayReference',
        });
      }

      // Processar webhook
      const result = await this.paymentService.handlePaymentCallback(webhookData);

      // Retornar 200 OK para confirmar recebimento
      return res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso',
        transactionId: result.transactionId,
      });
    } catch (error) {
      this.logger.error('❌ Erro ao processar webhook:', error.message);

      if (error.name === 'NotFoundError') {
        // Gateway enviou webhook para transação que não existe localmente
        // Retornar 200 mesmo assim (o webhook pode chegar antes)
        return res.status(200).json({
          success: false,
          warning: 'Transação não encontrada no sistema (pode chegar depois)',
          error: error.message,
        });
      }

      if (error.name === 'SecurityError') {
        // Webhook com assinatura inválida
        return res.status(403).json({
          success: false,
          error: 'Assinatura de webhook inválida',
        });
      }

      // Erro genérico
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar webhook',
        message: error.message,
      });
    }
  }

  /**
   * Exemplo de webhook simulado para testes
   * POST /webhooks/payment/simulate
   */
  async simulate(req, res) {
    try {
      this.logger.log('🧪 Simulando webhook para testes...');

      const {
        transactionId = null,
        gatewayReference = null,
        status = 'approved',
        orderId = 'PED-TEST',
      } = req.body;

      if (!transactionId && !gatewayReference) {
        return res.status(400).json({
          success: false,
          error: 'Provide either transactionId or gatewayReference',
        });
      }

      // Buscar transação
      let transaction;
      if (transactionId) {
        transaction = await this.paymentService.transactionRepository.findById(transactionId);
      } else {
        transaction = await this.paymentService.transactionRepository.findByGatewayReference(
          gatewayReference
        );
      }

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transação não encontrada',
        });
      }

      // Criar payload de webhook
      const crypto = require('crypto');
      const secret = process.env.WEBHOOK_SECRET || 'dev-secret';

      const webhookPayload = {
        gatewayReference: transaction.gatewayReference,
        transactionId: transaction.id,
        orderId: transaction.orderId,
        status,
        amount: transaction.amount,
        timestamp: new Date().toISOString(),
        errorMessage: status === 'declined' ? 'Transação recusada' : null,
      };

      // Gerar assinatura
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      const signedPayload = {
        ...webhookPayload,
        signature,
      };

      // Processar como webhook real
      const result = await this.paymentService.handlePaymentCallback(signedPayload);

      return res.status(200).json({
        success: true,
        message: 'Webhook simulado processado com sucesso',
        result,
        payload: webhookPayload,
      });
    } catch (error) {
      this.logger.error('Erro ao simular webhook:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Erro ao simular webhook',
        message: error.message,
      });
    }
  }

  /**
   * Middleware para validar webhook
   * Pode ser usado como middleware Express
   */
  static validateWebhookSignature(secretKey) {
    return (req, res, next) => {
      const signature = req.headers['x-webhook-signature'];
      
      if (!signature) {
        return res.status(403).json({
          success: false,
          error: 'Assinatura de webhook não encontrada',
        });
      }

      const crypto = require('crypto');
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(403).json({
          success: false,
          error: 'Assinatura de webhook inválida',
        });
      }

      next();
    };
  }
}

module.exports = WebhookHandler;
