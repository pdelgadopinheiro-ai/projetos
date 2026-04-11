/**
 * Payment System Configuration & Factory
 * Inicializa todos os componentes do sistema de pagamentos
 */

const EventEmitter = require('events');
const PaymentService = require('./services/payment-service');
const PaymentController = require('./controllers/payment-controller');
const WebhookHandler = require('./webhooks/payment-webhook');
const FileTransactionRepository = require('./repositories/file-transaction-repository-v2');

class PaymentSystem {
  /**
   * Inicializa o sistema de pagamentos completo
   */
  static async initialize(config = {}) {
    console.log('🚀 Inicializando sistema de pagamentos...');

    try {
      // 1. Criar repositório de transações
      const repository = new FileTransactionRepository(config.repositoryPath);
      await repository.initialize();

      // 2. Criar event emitter para eventos de pagamento
      const eventEmitter = new EventEmitter();
      this.setupEventListeners(eventEmitter);

      // 3. Criar serviço de pagamento
      const paymentService = new PaymentService({
        transactionRepository: repository,
        eventEmitter,
      });

      // 4. Criar controller
      const paymentController = new PaymentController({
        paymentService,
        logger: console,
      });

      // 5. Criar webhook handler
      const webhookHandler = new WebhookHandler({
        paymentService,
        logger: console,
      });

      console.log('✅ Sistema de pagamentos inicializado com sucesso');

      return {
        paymentService,
        paymentController,
        webhookHandler,
        repository,
        eventEmitter,
      };
    } catch (error) {
      console.error('❌ Erro ao inicializar sistema de pagamentos:', error);
      throw error;
    }
  }

  /**
   * Configura listeners de eventos
   */
  static setupEventListeners(eventEmitter) {
    // Pagamento iniciado
    eventEmitter.on('payment.initiated', (data) => {
      console.log('📤 [EVENT] Pagamento iniciado:', {
        orderId: data.transaction.orderId,
        amount: data.transaction.amount,
        gateway: data.transaction.gatewayName,
      });
    });

    // Status atualizado
    eventEmitter.on('payment.status-updated', (data) => {
      console.log('📊 [EVENT] Status atualizado:', {
        transactionId: data.transaction.id,
        newStatus: data.transaction.status,
        previousStatus: data.previousStatus,
      });
    });

    // Webhook recebido
    eventEmitter.on('payment.webhook-received', (data) => {
      console.log('🔔 [EVENT] Webhook processado:', {
        transactionId: data.transaction.id,
        newStatus: data.transaction.status,
      });

      // TODO: Aqui você pode integrar com seu sistema de notificações
      // - Enviar email de confirmação
      // - Atualizar status no banco de dados principal
      // - Disparar outros eventos do negócio
    });

    // Erro em pagamento
    eventEmitter.on('payment.error', (data) => {
      console.error('❌ [EVENT] Erro em pagamento:', {
        transactionId: data.transaction.id,
        error: data.error,
      });
    });

    // Pagamento cancelado
    eventEmitter.on('payment.cancelled', (data) => {
      console.log('🛑 [EVENT] Pagamento cancelado:', {
        transactionId: data.transaction.id,
        orderId: data.transaction.orderId,
      });
    });

    // Pagamento reembolsado
    eventEmitter.on('payment.refunded', (data) => {
      console.log('💸 [EVENT] Pagamento reembolsado:', {
        transactionId: data.transaction.id,
        refundAmount: data.refundAmount,
      });
    });
  }

  /**
   * Retorna informações do sistema
   */
  static getSystemInfo() {
    return {
      name: 'Payment Integration System',
      version: '1.0.0',
      gateways: ['stone', 'pagar-me', 'mock'],
      features: [
        'Payment Processing',
        'Webhooks',
        'Refunds',
        'Cancellations',
        'Multiple Payment Methods',
        'Installments',
        'Transaction History',
      ],
      defaultGateway: process.env.PAYMENT_GATEWAY || 'mock',
    };
  }
}

module.exports = PaymentSystem;
