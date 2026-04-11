/**
 * EXEMPLO 3: Integração com Express
 * Setup completo do servidor com rotas de pagamento
 */

const express = require('express');
const PaymentSystem = require('../payments/config');
const AuthMiddleware = require('../payments/middleware/auth-middleware');

/**
 * Configura rotas de pagamento no Express
 */
async function setupPaymentRoutes(app) {
  // Inicializar sistema de pagamentos
  const {
    paymentService,
    paymentController,
    webhookHandler,
    eventEmitter,
  } = await PaymentSystem.initialize();

  // ═══════════════════════════════════════════════════════
  // MIDDLEWARES
  // ═══════════════════════════════════════════════════════

  // Headers de segurança
  app.use(AuthMiddleware.setupSecurityHeaders);

  // Registrar requisições
  app.use(AuthMiddleware.requestLogger);

  // Validar Content-Type
  app.use(AuthMiddleware.validateContentType);

  // Rate limiting (100 requisições por minuto)
  app.use(AuthMiddleware.rateLimit(100, 60000));

  // ═══════════════════════════════════════════════════════
  // ROTAS PÚBLICAS (sem autenticação)
  // ═══════════════════════════════════════════════════════

  /**
   * Webhook de callback do gateway
   * POST /webhooks/payment
   */
  app.post('/webhooks/payment', async (req, res) => {
    await webhookHandler.handle(req, res);
  });

  /**
   * Simular webhook para testes
   * POST /webhooks/payment/simulate
   */
  app.post('/webhooks/payment/simulate', async (req, res) => {
    await webhookHandler.simulate(req, res);
  });

  // ═══════════════════════════════════════════════════════
  // ROTAS PROTEGIDAS (com autenticação)
  // ═══════════════════════════════════════════════════════

  // Middleware de autenticação para rotas privadas
  const apiKeys = [
    'sk_test_example_key_123456',
    process.env.API_KEY, // Chave do .env
  ].filter(Boolean);

  app.use('/payments', AuthMiddleware.validateApiKey(apiKeys));

  /**
   * POST /payments
   * Inicia um novo pagamento
   */
  app.post('/payments', async (req, res) => {
    await paymentController.initiate(req, res);
  });

  /**
   * GET /payments/:transactionId
   * Consulta status de uma transação
   */
  app.get('/payments/:transactionId', async (req, res) => {
    await paymentController.getStatus(req, res);
  });

  /**
   * POST /payments/:transactionId/cancel
   * Cancela uma transação
   */
  app.post('/payments/:transactionId/cancel', async (req, res) => {
    await paymentController.cancel(req, res);
  });

  /**
   * POST /payments/:transactionId/refund
   * Reembolsa uma transação
   */
  app.post('/payments/:transactionId/refund', async (req, res) => {
    await paymentController.refund(req, res);
  });

  /**
   * GET /payments/orders/:orderId
   * Lista transações de um pedido
   */
  app.get('/payments/orders/:orderId', async (req, res) => {
    await paymentController.getByOrderId(req, res);
  });

  /**
   * GET /payments/gateway/info
   * Informações do gateway
   */
  app.get('/payments/gateway/info', async (req, res) => {
    await paymentController.getGatewayInfo(req, res);
  });

  /**
   * GET /payments/stats
   * Estatísticas de transações
   */
  app.get('/payments/stats', async (req, res) => {
    await paymentController.getStatistics(req, res);
  });

  // ═══════════════════════════════════════════════════════
  // TRATAMENTO DE ERROS
  // ═══════════════════════════════════════════════════════

  app.use('*', AuthMiddleware.notFound);
  app.use(AuthMiddleware.errorHandler);

  // ═══════════════════════════════════════════════════════
  // LISTENERS DE EVENTOS
  // ═══════════════════════════════════════════════════════

  // Aqui você pode registrar listeners adicionais
  eventEmitter.on('payment.approved', (data) => {
    // TODO: Enviar email de confirmação
    // TODO: Atualizar banco de dados principal
    // TODO: Disparar outros workflows
    console.log('📧 Enviando email de confirmação de pagamento...');
  });

  eventEmitter.on('payment.declined', (data) => {
    // TODO: Notificar usuário
    console.log('📧 Notificando usuário sobre pagamento recusado...');
  });

  return {
    paymentService,
    paymentController,
    webhookHandler,
    eventEmitter,
  };
}

/**
 * Criar e configurar aplicação Express
 */
async function createApp() {
  const app = express();

  // Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rotas de health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Setup de pagamentos
  await setupPaymentRoutes(app);

  return app;
}

// ═══════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════

async function startServer() {
  const PORT = process.env.PORT || 3000;

  try {
    const app = await createApp();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║     🚀 POS Payment Integration Server                  ║
║     ✅ Servidor rodando em http://localhost:${PORT}        ║
║                                                        ║
║     📚 Documentação de Endpoints:                      ║
║     POST   /payments                - Iniciar pago    ║
║     GET    /payments/:id            - Consultar       ║
║     POST   /payments/:id/cancel     - Cancelar        ║
║     POST   /payments/:id/refund     - Reembolsar      ║
║     GET    /payments/orders/:id     - Histórico       ║
║     GET    /payments/gateway/info   - Info Gateway    ║
║     GET    /payments/stats          - Estatísticas    ║
║     POST   /webhooks/payment        - Webhook         ║
║                                                        ║
║     🔑 Autenticação:                                  ║
║     Header: Authorization: Bearer sk_test_...         ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Descomente para iniciar:
// startServer();

module.exports = {
  setupPaymentRoutes,
  createApp,
  startServer,
};
