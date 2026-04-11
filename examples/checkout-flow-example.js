/**
 * EXEMPLO 2: Caso de Uso Completo
 * Fluxo de compra do início ao fim
 */

const PaymentClient = require('./payment-client');
const PaymentUtils = require('../payments/utils/payment-utils');

class CheckoutFlow {
  constructor() {
    this.client = new PaymentClient();
  }

  /**
   * FLUXO: Cliente faz uma compra com cartão
   */
  async executeCheckout() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🛒 INICIANDO FLUXO DE CHECKOUT');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      // 1️⃣ Dados do pedido (vindo do carrinho)
      const orderData = {
        orderId: `PED-${Date.now()}`, // Gerar ID único para o pedido
        amount: PaymentUtils.toCents(150.99), // R$ 150,99 em centavos
        installments: 3, // 3x sem juros
        description: 'Compra de produtos - Loja Online',
        customerName: 'João Silva',
        customerEmail: 'joao.silva@email.com',
        customerPhone: '11987654321',
        paymentMethod: 'credit_card',
        metadata: {
          storeId: 'store-001',
          productCount: 5,
          productIds: [1, 2, 3, 4, 5],
          source: 'web',
        },
      };

      console.log('📦 Pedido criado:');
      console.log(`   Order ID: ${orderData.orderId}`);
      console.log(`   Valor: ${PaymentUtils.formatCurrency(orderData.amount)}`);
      console.log(`   Parcelas: ${orderData.installments}x`);
      console.log(`   Cliente: ${orderData.customerName}\n`);

      // 2️⃣ Enviar para processamento de pagamento
      const paymentResult = await this.client.initiatePayment(orderData);

      const transactionId = paymentResult.transaction.id;
      console.log(`✅ Transação iniciada: ${transactionId}`);
      console.log(`   Status: ${paymentResult.transaction.status}`);
      console.log(`   Gateway: ${paymentResult.transaction.gatewayName}\n`);

      // 3️⃣ Aguardar processamento (simular delay)
      await this.sleep(2000);

      // 4️⃣ Consultar status
      console.log('🔍 Consultando status do pagamento...');
      const statusResult = await this.client.getPaymentStatus(transactionId);
      const finalStatus = statusResult.transaction.status;

      console.log(`   Status: ${PaymentUtils.describeStatus(finalStatus)}`);
      console.log(`   Atualizado em: ${new Date(statusResult.transaction.updatedAt).toLocaleString()}\n`);

      // 5️⃣ Processar resultado
      if (finalStatus === 'approved') {
        console.log('🎉 PAGAMENTO APROVADO!');
        console.log('   ✅ Pedido confirmado');
        console.log('   📧 Enviando email de confirmação...');
        console.log('   📦 Preparando envio...\n');

        return {
          success: true,
          message: 'Pagamento aprovado com sucesso',
          orderId: orderData.orderId,
          transactionId,
        };
      } else if (finalStatus === 'declined') {
        console.log('❌ PAGAMENTO RECUSADO!');
        console.log('   Motivo: Cartão recusado pelo banco');
        console.log('   📧 Notificando cliente...\n');

        throw new Error('Pagamento foi recusado pelo banco');
      } else if (finalStatus === 'processing') {
        console.log('⏳ Pagamento ainda em processamento...');
        console.log('   Verifique novamente em alguns minutos\n');

        return {
          success: false,
          message: 'Pagamento em processamento',
          orderId: orderData.orderId,
          transactionId,
        };
      }
    } catch (error) {
      console.error('❌ Erro no fluxo de checkout:', error.message);
      throw error;
    }
  }

  /**
   * FLUXO: Cliente deseja reembolso
   */
  async executeRefund(transactionId, reason = 'Cliente solicitou') {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('💸 PROCESSANDO REEMBOLSO');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      // 1️⃣ Consultar transação
      const statusResult = await this.client.getPaymentStatus(transactionId);
      const transaction = statusResult.transaction;

      console.log(`📋 Transação: ${transaction.id}`);
      console.log(`   Pedido: ${transaction.orderId}`);
      console.log(`   Valor: ${PaymentUtils.formatCurrency(transaction.amount)}`);
      console.log(`   Status: ${transaction.status}\n`);

      // 2️⃣ Validar que pode ser reembolsada
      if (transaction.status !== 'approved') {
        throw new Error(`Apenas transações aprovadas podem ser reembolsadas (Status: ${transaction.status})`);
      }

      // 3️⃣ Processar reembolso
      console.log('⏳ Processando reembolso...');
      const refundResult = await this.client.refundPayment(transactionId);

      console.log('✅ Reembolso processado com sucesso!');
      console.log(`   Valor reembolsado: ${PaymentUtils.formatCurrency(refundResult.transaction.amount)}\n`);

      // 4️⃣ Notificar cliente
      console.log('📧 Enviando email de confirmação de reembolso...');
      console.log('💰 Valor será creditado em 3-5 dias úteis\n');

      return {
        success: true,
        transactionId,
        reason,
      };
    } catch (error) {
      console.error('❌ Erro ao reembolsar:', error.message);
      throw error;
    }
  }

  /**
   * FLUXO: Consultar histórico de transações
   */
  async viewOrderHistory(orderId) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📜 HISTÓRICO DE TRANSAÇÕES');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      const result = await this.client.getOrderTransactions(orderId);
      const transactions = result.transactions;

      if (transactions.length === 0) {
        console.log('Nenhuma transação encontrada para este pedido\n');
        return;
      }

      console.log(`Encontradas ${transactions.length} transação(ões):\n`);

      transactions.forEach((txn, index) => {
        console.log(`${index + 1}. Transação: ${txn.id}`);
        console.log(`   Valor: ${PaymentUtils.formatCurrency(txn.amount)}`);
        console.log(`   Status: ${PaymentUtils.describeStatus(txn.status)}`);
        console.log(`   Data: ${new Date(txn.createdAt).toLocaleString()}`);
        console.log(`   Gateway: ${txn.gatewayName}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error.message);
      throw error;
    }
  }

  /**
   * FLUXO: Dashboard - Visualizar estatísticas
   */
  async viewDashboard() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 DASHBOARD DE PAGAMENTOS');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      const stats = await this.client.getStatistics();
      const data = stats.statistics;

      console.log('📈 Resumo:');
      console.log(`   Total de transações: ${data.total}`);
      console.log(`   Valor total: ${PaymentUtils.formatCurrency(data.totalAmount)}`);
      console.log(`   Valor médio: ${PaymentUtils.formatCurrency(data.averageAmount)}\n`);

      console.log('📊 Por Status:');
      Object.entries(data.byStatus).forEach(([status, count]) => {
        console.log(`   ${PaymentUtils.describeStatus(status)}: ${count}`);
      });

      console.log('\n🏦 Por Gateway:');
      Object.entries(data.byGateway).forEach(([gateway, count]) => {
        console.log(`   ${gateway}: ${count}`);
      });

      console.log('\n');
    } catch (error) {
      console.error('❌ Erro ao obter dashboard:', error.message);
      throw error;
    }
  }

  /**
   * Utility para dormir
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════
// EXECUTAR EXEMPLOS
// ═══════════════════════════════════════════════════════

async function runExamples() {
  const flow = new CheckoutFlow();

  try {
    // Exemplo 1: Fluxo completo de checkout
    const checkoutResult = await flow.executeCheckout();

    // Exemplo 2: Buscar histórico
    if (checkoutResult.success) {
      await flow.viewOrderHistory(checkoutResult.orderId);
    }

    // Exemplo 3: Dashboard
    await flow.viewDashboard();

    // Exemplo 4: Reembolso (descomentar para testar)
    // if (checkoutResult.success) {
    //   await flow.executeRefund(checkoutResult.transactionId);
    // }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// Descomente para executar
// runExamples().catch(console.error);

module.exports = CheckoutFlow;
