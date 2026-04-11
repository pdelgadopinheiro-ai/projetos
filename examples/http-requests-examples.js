/**
 * EXEMPLO 4: Chamadas HTTP (Frontend/Client)
 * Exemplos com Fetch API e Axios
 */

// ═══════════════════════════════════════════════════════
// USANDO FETCH API
// ═══════════════════════════════════════════════════════

class PaymentAPIfetch {
  constructor(baseURL = 'http://localhost:3000', apiKey = 'sk_test_example_key_123456') {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  /**
   * 1️⃣ INICIAR PAGAMENTO
   */
  async initiatePayment(orderData) {
    try {
      const response = await fetch(`${this.baseURL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          orderId: orderData.orderId, // "PED-001"
          amount: orderData.amount, // 10000 (R$ 100,00)
          installments: orderData.installments || 1,
          description: orderData.description,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          paymentMethod: orderData.paymentMethod || 'credit_card',
          metadata: orderData.metadata || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao iniciar pagamento:', error);
      throw error;
    }
  }

  /**
   * 2️⃣ CONSULTAR STATUS
   */
  async getPaymentStatus(transactionId) {
    try {
      const response = await fetch(
        `${this.baseURL}/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      throw error;
    }
  }

  /**
   * 3️⃣ CANCELAR PAGAMENTO
   */
  async cancelPayment(transactionId) {
    try {
      const response = await fetch(
        `${this.baseURL}/payments/${transactionId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      throw error;
    }
  }

  /**
   * 4️⃣ REEMBOLSAR PAGAMENTO
   */
  async refundPayment(transactionId, amount = null) {
    try {
      const response = await fetch(
        `${this.baseURL}/payments/${transactionId}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao reembolsar pagamento:', error);
      throw error;
    }
  }

  /**
   * 5️⃣ LISTAR TRANSAÇÕES DO PEDIDO
   */
  async getOrderTransactions(orderId) {
    try {
      const response = await fetch(
        `${this.baseURL}/payments/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      throw error;
    }
  }

  /**
   * 6️⃣ OBTER ESTATÍSTICAS
   */
  async getStatistics() {
    try {
      const response = await fetch(`${this.baseURL}/payments/stats`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════
// USANDO AXIOS
// ═══════════════════════════════════════════════════════

// No Node.js ou com Webpack, importe: import axios from 'axios';

class PaymentAPIAxios {
  constructor(baseURL = 'http://localhost:3000', apiKey = 'sk_test_example_key_123456') {
    this.baseURL = baseURL;
    this.apiKey = apiKey;

    // Criar instância Axios com configuração
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    // Interceptor de erro
    this.api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          console.error('API Key inválida');
        } else if (error.response?.status === 429) {
          console.error('Rate limit excedido');
        }
        return Promise.reject(error);
      }
    );
  }

  async initiatePayment(orderData) {
    const response = await this.api.post('/payments', orderData);
    return response.data;
  }

  async getPaymentStatus(transactionId) {
    const response = await this.api.get(`/payments/${transactionId}`);
    return response.data;
  }

  async cancelPayment(transactionId) {
    const response = await this.api.post(`/payments/${transactionId}/cancel`);
    return response.data;
  }

  async refundPayment(transactionId, amount = null) {
    const response = await this.api.post(`/payments/${transactionId}/refund`, { amount });
    return response.data;
  }

  async getOrderTransactions(orderId) {
    const response = await this.api.get(`/payments/orders/${orderId}`);
    return response.data;
  }

  async getStatistics() {
    const response = await this.api.get('/payments/stats');
    return response.data;
  }
}

// ═══════════════════════════════════════════════════════
// EXEMPLOS DE USO NO FRONTEND
// ═══════════════════════════════════════════════════════

/**
 * Exemplo: Formulário de checkout
 */
async function handleCheckoutSubmit(event) {
  event.preventDefault();

  const api = new PaymentAPIfetch();

  const formData = {
    orderId: document.getElementById('orderId').value,
    amount: parseInt(document.getElementById('amount').value),
    installments: parseInt(document.getElementById('installments').value) || 1,
    description: 'Compra de produtos',
    customerName: document.getElementById('customerName').value,
    customerEmail: document.getElementById('customerEmail').value,
    customerPhone: document.getElementById('customerPhone').value,
    paymentMethod: document.getElementById('paymentMethod').value || 'credit_card',
  };

  try {
    // Mostrar loading
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').textContent = 'Processando...';

    // Iniciar pagamento
    const result = await api.initiatePayment(formData);

    if (result.success) {
      alert(`✅ Pagamento iniciado!\nID: ${result.transaction.id}\nStatus: ${result.transaction.status}`);
      // Redirecionar para página de sucesso ou aguardar webhook
    } else {
      alert(`❌ Erro: ${result.error}`);
    }
  } catch (error) {
    alert(`❌ Erro ao processar pagamento: ${error.message}`);
  } finally {
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitBtn').textContent = 'Pagar';
  }
}

/**
 * Exemplo: Consultar status em tempo real
 */
async function pollPaymentStatus(transactionId, maxAttempts = 30) {
  const api = new PaymentAPIfetch();
  let attempts = 0;

  const pollInterval = setInterval(async () => {
    attempts++;

    try {
      const result = await api.getPaymentStatus(transactionId);
      const status = result.transaction.status;

      console.log(`[${attempts}] Status: ${status}`);

      // Se transitou de status processando para algo final
      if (status === 'approved') {
        clearInterval(pollInterval);
        console.log('✅ Pagamento aprovado!');
        // Redirecionar para sucesso
      } else if (status === 'declined') {
        clearInterval(pollInterval);
        console.log('❌ Pagamento recusado');
        // Mostrar erro
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        console.log('⏳ Timeout aguardando resposta');
      }
    } catch (error) {
      console.error('Erro ao consultar status:', error);
    }
  }, 1000); // Consultar a cada 1 segundo
}

/**
 * Exemplo: HTML do Formulário
 */
const CHECKOUT_FORM_HTML = `
<form id="checkoutForm">
  <input type="text" id="orderId" placeholder="Order ID" value="PED-001" required />
  <input type="number" id="amount" placeholder="Valor (R$)" value="150.99" required />
  <select id="installments" value="3">
    <option value="1">À vista</option>
    <option value="3">3x</option>
    <option value="6">6x</option>
    <option value="12">12x</option>
  </select>
  
  <input type="text" id="customerName" placeholder="Nome Completo" required />
  <input type="email" id="customerEmail" placeholder="Email" required />
  <input type="tel" id="customerPhone" placeholder="Telefone" required />
  
  <select id="paymentMethod">
    <option value="credit_card">Cartão de Crédito</option>
    <option value="debit_card">Cartão de Débito</option>
    <option value="pix">PIX</option>
  </select>
  
  <button type="submit" id="submitBtn">Pagar</button>
</form>

<script>
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
</script>
`;

// Exportar para uso em módulos ES6
export { PaymentAPIfetch, PaymentAPIAxios, handleCheckoutSubmit, pollPaymentStatus };
