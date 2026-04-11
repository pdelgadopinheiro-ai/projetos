/**
 * Payment Service
 * Coordena integração com gateways, repositórios e lógica de negócio
 */

const Transaction = require('../models/transaction');
const StoneGateway = require('../gateways/stone-gateway');
const PagarmeGateway = require('../gateways/pagarmee-gateway');
const MockPOSGateway = require('../gateways/pos-mock-gateway');

class PaymentService {
  constructor(config = {}) {
    this.config = config;
    this.gateway = this.initializeGateway();
    this.transactionRepository = config.transactionRepository;
    this.eventEmitter = config.eventEmitter;
  }

  /**
   * Inicializa o gateway baseado em configuração
   */
  initializeGateway() {
    const gatewayType = (process.env.PAYMENT_GATEWAY || 'mock').toLowerCase();

    const gatewayConfig = {
      apiKey: process.env.STONE_API_KEY || process.env.PAGARMEE_API_KEY,
      accountId: process.env.STONE_ACCOUNT_ID,
      timeout: parseInt(process.env.TRANSACTION_TIMEOUT || 300) * 1000,
    };

    switch (gatewayType) {
      case 'stone':
        return new StoneGateway(gatewayConfig);
      case 'pagar-me':
      case 'pagarmee':
        return new PagarmeGateway(gatewayConfig);
      case 'mock':
      default:
        return new MockPOSGateway(gatewayConfig);
    }
  }

  /**
   * Processa um pagamento completo
   * 1. Valida dados
   * 2. Envia para o gateway
   * 3. Salva no database
   * 4. Emite eventos
   */
  async processPayment(paymentData) {
    console.log('🔄 Iniciando processo de pagamento...', { orderId: paymentData.orderId });

    // 1. Criar instância de transação
    const transaction = new Transaction(paymentData);

    // 2. Validar dados
    const validation = transaction.validate();
    if (!validation.isValid) {
      console.error('❌ Validação falhou:', validation.errors);
      throw new ValidationError('Dados inválidos para pagamento', validation.errors);
    }

    try {
      // 3. Enviar para o gateway
      console.log('📤 Enviando transação para gateway:', this.gateway.name);
      const gatewayResponse = await this.gateway.initiatePayment(transaction);

      if (!gatewayResponse.success) {
        throw new PaymentGatewayError(
          `Erro ao iniciar pagamento: ${gatewayResponse.error}`,
          gatewayResponse.details
        );
      }

      // 4. Atualizar transação com resposta do gateway
      transaction.gatewayReference = gatewayResponse.data.gatewayReference;
      transaction.gatewayName = gatewayResponse.data.gatewayName;
      transaction.status = gatewayResponse.data.status;

      // 5. Salvar no banco de dados
      console.log('💾 Salvando transação no banco de dados...');
      await this.transactionRepository.save(transaction);

      // 6. Emitir evento
      this.emitEvent('payment.initiated', {
        transaction: transaction.toJSON(),
        gatewayResponse: gatewayResponse.data,
      });

      console.log('✅ Pagamento iniciado com sucesso:', transaction.id);

      return {
        success: true,
        transaction: transaction.toJSON(),
        message: 'Pagamento iniciado com sucesso',
      };
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error.message);

      // Salvar transação com erro
      transaction.status = 'error';
      transaction.errorMessage = error.message;
      await this.transactionRepository.save(transaction);

      // Emitir evento de erro
      this.emitEvent('payment.error', {
        transaction: transaction.toJSON(),
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Consulta status de uma transação
   */
  async getPaymentStatus(transactionId) {
    console.log('🔍 Consultando status da transação:', transactionId);

    // 1. Buscar no banco
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundError(`Transação ${transactionId} não encontrada`);
    }

    // 2. Se estiver pendente ou processando, buscar do gateway
    if (['pending', 'processing'].includes(transaction.status)) {
      console.log('🌐 Consultando status no gateway...');
      const gatewayResponse = await this.gateway.getTransactionStatus(
        transaction.gatewayReference
      );

      if (gatewayResponse.success) {
        const newStatus = gatewayResponse.data.status;

        // 3. Se o status mudou, atualizar
        if (newStatus !== transaction.status) {
          console.log(`📊 Status atualizado: ${transaction.status} → ${newStatus}`);
          transaction.updateStatus(newStatus, gatewayResponse.data);
          await this.transactionRepository.save(transaction);

          // Emitir evento de atualização
          this.emitEvent('payment.status-updated', {
            transaction: transaction.toJSON(),
            previousStatus: newStatus,
          });
        }
      }
    }

    return {
      success: true,
      transaction: transaction.toJSON(),
    };
  }

  /**
   * Processa webhook de confirmação de pagamento (do gateway)
   */
  async handlePaymentCallback(webhookData) {
    console.log('🔔 Recebido webhook de pagamento:', webhookData);

    try {
      // 1. Buscar transação pelo gateway reference
      const transaction = await this.transactionRepository.findByGatewayReference(
        webhookData.gatewayReference
      );

      if (!transaction) {
        console.warn('⚠️ Webhook recebido para transação desconhecida:', webhookData);
        throw new NotFoundError('Transação não encontrada');
      }

      // 2. Validar webhook (verificar assinatura)
      this.validateWebhookSignature(webhookData);

      // 3. Atualizar status
      const previousStatus = transaction.status;
      transaction.updateStatus(webhookData.status, {
        errorMessage: webhookData.errorMessage,
      });

      // 4. Salvar
      await this.transactionRepository.save(transaction);

      // 5. Emitir evento
      this.emitEvent('payment.webhook-received', {
        transaction: transaction.toJSON(),
        previousStatus,
        webhook: webhookData,
      });

      console.log('✅ Webhook processado com sucesso');

      return {
        success: true,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error.message);
      throw error;
    }
  }

  /**
   * Cancela uma transação
   */
  async cancelPayment(transactionId) {
    console.log('🛑 Cancelando transação:', transactionId);

    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundError(`Transação ${transactionId} não encontrada`);
    }

    if (!['pending', 'processing', 'approved'].includes(transaction.status)) {
      throw new PaymentError(`Não pode cancelar transação em status: ${transaction.status}`);
    }

    try {
      const gatewayResponse = await this.gateway.cancelTransaction(
        transaction.gatewayReference
      );

      if (!gatewayResponse.success) {
        throw new PaymentGatewayError('Erro ao cancelar no gateway');
      }

      transaction.updateStatus('cancelled');
      await this.transactionRepository.save(transaction);

      this.emitEvent('payment.cancelled', {
        transaction: transaction.toJSON(),
      });

      console.log('✅ Transação cancelada com sucesso');

      return {
        success: true,
        transaction: transaction.toJSON(),
      };
    } catch (error) {
      console.error('❌ Erro ao cancelar transação:', error.message);
      throw error;
    }
  }

  /**
   * Reembolsa uma transação
   */
  async refundPayment(transactionId, amount = null) {
    console.log('💸 Reembolsando transação:', transactionId, 'Valor:', amount);

    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundError(`Transação ${transactionId} não encontrada`);
    }

    if (transaction.status !== 'approved') {
      throw new PaymentError('Apenas transações aprovadas podem ser reembolsadas');
    }

    try {
      const gatewayResponse = await this.gateway.refundTransaction(
        transaction.gatewayReference,
        amount
      );

      if (!gatewayResponse.success) {
        throw new PaymentGatewayError('Erro ao reembolsar no gateway');
      }

      transaction.updateStatus('refunded');
      await this.transactionRepository.save(transaction);

      this.emitEvent('payment.refunded', {
        transaction: transaction.toJSON(),
        refundAmount: amount,
      });

      console.log('✅ Transação reembolsada com sucesso');

      return {
        success: true,
        transaction: transaction.toJSON(),
      };
    } catch (error) {
      console.error('❌ Erro ao reembolsar transação:', error.message);
      throw error;
    }
  }

  /**
   * Valida assinatura do webhook
   */
  validateWebhookSignature(webhookData) {
    const crypto = require('crypto');
    const secret = process.env.WEBHOOK_SECRET;

    if (!secret) {
      console.warn('⚠️ WEBHOOK_SECRET não configurado');
      return; // Em desenvolvimento, permitir
    }

    const signature = webhookData.signature;
    if (!signature) {
      throw new SecurityError('Webhook sem assinatura');
    }

    // Reconstruir payload original (excluindo assinatura)
    const { signature: _, ...dataWithoutSignature } = webhookData;
    const payload = JSON.stringify(dataWithoutSignature);

    // Calcular hash esperado
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new SecurityError('Assinatura de webhook inválida');
    }
  }

  /**
   * Emite evento para listeners
   */
  emitEvent(eventName, data) {
    if (this.eventEmitter) {
      this.eventEmitter.emit(eventName, data);
    }
  }

  /**
   * Retorna informações sobre o gateway atual
   */
  getGatewayInfo() {
    return {
      name: this.gateway.name,
      configured: !!this.gateway.apiKey,
      class: this.gateway.constructor.name,
    };
  }
}

// Exceções customizadas
class PaymentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaymentError';
  }
}

class PaymentGatewayError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'PaymentGatewayError';
    this.details = details;
  }
}

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class SecurityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SecurityError';
  }
}

module.exports = {
  PaymentService,
  PaymentError,
  PaymentGatewayError,
  ValidationError,
  NotFoundError,
  SecurityError,
};
