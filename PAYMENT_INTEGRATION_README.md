# 🛒 Integração POS (Maquininha de Cartão) - Node.js

Solução completa e pronta para produção para integrar sistemas de pagamento via POS (Point of Sale) em sua aplicação Node.js com Express.

## 📋 Índice

- [Características](#características)
- [Arquitetura](#arquitetura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Endpoints da API](#endpoints-da-api)
- [Webhooks](#webhooks)
- [Exemplos](#exemplos)
- [Segurança](#segurança)
- [Debug e Testes](#debug-e-testes)

## ✨ Características

✅ **Integração com Múltiplos Gateways**
- Stone
- Pagar.me
- Mock (para testes)

✅ **Funcionalidades Completas**
- Processamento de pagamentos
- Consulta de status em tempo real
- Cancelamento de transações
- Reembolso (parcial ou total)
- Webhooks para atualizações automáticas
- Suporte a múltiplas parcelas

✅ **Métodos de Pagamento**
- Cartão de Crédito
- Cartão de Débito
- PIX

✅ **Segurança**
- Autenticação por API Key
- Validação de webhooks por assinatura
- Rate limiting
- Headers de segurança CORS
- Encriptação AES-256

✅ **Produção-Ready**
- Tratamento de erros robusto
- Logging estruturado
- Eventos para integração
- Repositório de transações
- Estatísticas e relatórios

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│           Frontend / Cliente                        │
│  (Fetch/Axios → HTTP Requests)                      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│    PaymentController                                │
│    (Validação de Requisições)                       │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│    PaymentService                                   │
│    (Lógica de Negócio)                              │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  Gateway         │  │  Repository      │
│  (Stone/Pagar.me)│  │  (Persistência)  │
└──────────────────┘  └──────────────────┘
        ▲
        │ Webhook
        │
        └─ Gateway envia status
```

## 📁 Estrutura de Pastas

```
payments/
├── models/
│   └── transaction.js           # Modelo de transação
├── gateways/
│   ├── pos-gateway.js          # Interface base
│   ├── stone-gateway.js        # Integração Stone
│   ├── pagarmee-gateway.js     # Integração Pagar.me
│   └── pos-mock-gateway.js     # Gateway simulado
├── services/
│   └── payment-service.js      # Lógica principal
├── controllers/
│   └── payment-controller.js   # Endpoints HTTP
├── repositories/
│   └── file-transaction-repository-v2.js  # Persistência
├── webhooks/
│   └── payment-webhook.js      # Handler de webhooks
├── middleware/
│   └── auth-middleware.js      # Auth e segurança
├── utils/
│   └── payment-utils.js        # Utilitários
└── config.js                    # Inicialização

examples/
├── payment-client.js           # Cliente HTTP
├── checkout-flow-example.js    # Fluxo completo
├── express-integration.js      # Setup Express
└── http-requests-examples.js   # Exemplos HTTP
```

## 🚀 Instalação

### 1. **Pré-requisitos**

```bash
node >= 14.0.0
npm >= 6.0.0
```

### 2. **Instalar Dependências**

```bash
npm install express axios dotenv
```

### 3. **Arquivo .env**

```env
# Servidor
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Gateway (stone, pagar-me, mock)
PAYMENT_GATEWAY=mock
MOCK_MODE=true

# Stone API
STONE_API_KEY=sk_live_your_stone_api_key_here
STONE_ACCOUNT_ID=your_stone_account_id

# Pagar.me API
PAGARMEE_API_KEY=pk_live_your_pagarme_api_key_here
PAGARMEE_API_URL=https://api.pagar.me/core/v5

# Webhook
WEBHOOK_SECRET=your_super_secret_webhook_key_12345
WEBHOOK_URL=http://localhost:3000/webhooks/payment

# Banco de Dados (opcional - para produção)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pos_payments

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## ⚙️ Configuração

### Inicializar em sua Aplicação Express

```javascript
// server.js
const express = require('express');
const { setupPaymentRoutes } = require('./examples/express-integration');

const app = express();
app.use(express.json());

// Setup de rotas de pagamento
(async () => {
  const { paymentService, eventEmitter } = await setupPaymentRoutes(app);
  
  // Registrar listeners personalizados
  eventEmitter.on('payment.approved', (data) => {
    console.log('Pagamento aprovado:', data.transaction.orderId);
    // Integrar com sistema principal
  });

  app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
})();
```

## 📖 Como Usar

### 1️⃣ Iniciar um Pagamento

```javascript
const PaymentClient = require('./examples/payment-client');

const client = new PaymentClient('http://localhost:3000', 'sk_test_example_key_123456');

const result = await client.initiatePayment({
  orderId: 'PED-001',
  amount: 10000,  // R$ 100,00 em centavos
  installments: 3,
  description: 'Compra de produtos',
  customerName: 'João Silva',
  customerEmail: 'joao@email.com',
  customerPhone: '11987654321',
  paymentMethod: 'credit_card',
  metadata: { productIds: [1, 2, 3] }
});

console.log(result.transaction.id);    // ID da transação
console.log(result.transaction.status); // "processing"
```

### 2️⃣ Consultar Status

```javascript
const status = await client.getPaymentStatus('TXN_1234567890_abc123def');
console.log(status.transaction.status); // "approved" ou "declined"
```

### 3️⃣ Reembolsar

```javascript
const refund = await client.refundPayment('TXN_1234567890_abc123def');
console.log(refund.transaction.status); // "refunded"
```

### 4️⃣ Cancelar

```javascript
const cancel = await client.cancelPayment('TXN_1234567890_abc123def');
console.log(cancel.transaction.status); // "cancelled"
```

## 🔌 Endpoints da API

### Iniciar Pagamento
```http
POST /payments
Authorization: Bearer sk_test_example_key_123456
Content-Type: application/json

{
  "orderId": "PED-001",
  "amount": 10000,
  "installments": 3,
  "description": "Compra de produtos",
  "customerName": "João Silva",
  "customerEmail": "joao@email.com",
  "customerPhone": "11987654321",
  "paymentMethod": "credit_card",
  "metadata": {}
}
```

**Resposta (201):**
```json
{
  "success": true,
  "message": "Pagamento iniciado com sucesso",
  "transaction": {
    "id": "TXN_1234567890_abc123def",
    "orderId": "PED-001",
    "amount": 10000,
    "status": "processing",
    "gatewayName": "mock",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Consultar Status
```http
GET /payments/TXN_1234567890_abc123def
Authorization: Bearer sk_test_example_key_123456
```

**Resposta (200):**
```json
{
  "success": true,
  "transaction": {
    "id": "TXN_1234567890_abc123def",
    "orderId": "PED-001",
    "amount": 10000,
    "status": "approved",
    "approvedAt": "2024-01-15T10:30:05.000Z"
  }
}
```

### Cancelar
```http
POST /payments/TXN_1234567890_abc123def/cancel
Authorization: Bearer sk_test_example_key_123456
```

### Reembolsar
```http
POST /payments/TXN_1234567890_abc123def/refund
Authorization: Bearer sk_test_example_key_123456
Content-Type: application/json

{
  "amount": 5000  // opcional
}
```

### Histórico de Pedido
```http
GET /payments/orders/PED-001
Authorization: Bearer sk_test_example_key_123456
```

### Estatísticas
```http
GET /payments/stats
Authorization: Bearer sk_test_example_key_123456
```

## 🔔 Webhooks

### Receber Callback do Gateway

```http
POST /webhooks/payment
Content-Type: application/json

{
  "gatewayReference": "stone_1234567890",
  "transactionId": "TXN_1234567890_abc123def",
  "status": "approved",
  "timestamp": "2024-01-15T10:30:05Z",
  "signature": "abc123def456..."
}
```

### Simular Webhook (Testes)

```http
POST /webhooks/payment/simulate
Authorization: Bearer sk_test_example_key_123456
Content-Type: application/json

{
  "transactionId": "TXN_1234567890_abc123def",
  "status": "approved"
}
```

## 💡 Exemplos

### Fluxo Completo de Compra

```javascript
const CheckoutFlow = require('./examples/checkout-flow-example');

const flow = new CheckoutFlow();

// 1. Executar checkout
const result = await flow.executeCheckout();

// 2. Ver histórico
if (result.success) {
  await flow.viewOrderHistory(result.orderId);
}

// 3. Ver dashboard
await flow.viewDashboard();

// 4. Processar reembolso se necessário
if (result.success) {
  await flow.executeRefund(result.transactionId);
}
```

### Frontend com Fetch

```javascript
const api = new PaymentAPIfetch('http://localhost:3000');

// Submeter formulário de checkout
const result = await api.initiatePayment({
  orderId: form.orderId.value,
  amount: parseInt(form.amount.value),
  installments: parseInt(form.installments.value),
  customerName: form.name.value,
  customerEmail: form.email.value,
  customerPhone: form.phone.value,
});

// Consultar status
const status = await api.getPaymentStatus(result.transaction.id);
```

## 🔒 Segurança

### 1. **Autenticação por API Key**
Todas as rotas protegidas requerem:
```http
Authorization: Bearer sk_test_your_api_key
```

### 2. **Validação de Webhooks**
Webhooks são validados por assinatura HMAC-SHA256:
```javascript
const signature = HMAC-SHA256(payload, WEBHOOK_SECRET)
```

### 3. **Headers de Segurança**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### 4. **Rate Limiting**
100 requisições por minuto por IP

### 5. **CORS**
Apenas origens configuradas em `ALLOWED_ORIGINS`

### 6. **Dados Sensíveis**
- Números de cartão NÃO são armazenados
- Senhas de clientes NÃO são armazenadas
- Apenas referências do gateway são mantidas

## 🧪 Debug e Testes

### Modo Mock

Para testar sem conectar a API real:
```env
PAYMENT_GATEWAY=mock
MOCK_MODE=true
```

**Regras de simulação:**
- Valor terminado em 0: recusado
- Valor ≥ R$ 1.000 com 3+ parcelas: processando
- Caso contrário: aprovado

### Simular Diferentes Respostas

```javascript
// Valor terminado em 0 = recusado
await client.initiatePayment({ amount: 10000 }); // Recusado

// Valor ≥ R$ 1.000 com 3 parcelas = processando
await client.initiatePayment({ amount: 100000, installments: 3 }); // Processando

// Outro valor = aprovado
await client.initiatePayment({ amount: 15099, installments: 1 }); // Aprovado
```

### Simular Webhook

```bash
curl -X POST http://localhost:3000/webhooks/payment/simulate \
  -H "Authorization: Bearer sk_test_example_key_123456" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TXN_...",
    "status": "approved"
  }'
```

### Visualizar Transações Armazenadas

Transações são armazenadas em `data/transactions.json` para modo desenvolvimento.

## 📊 Modelos de Dados

### Transaction
```javascript
{
  id: string,                    // ID único da transação
  orderId: string,               // ID do pedido no sistema
  amount: number,                // Valor em centavos
  installments: number,          // Número de parcelas
  status: 'pending'|'processing'|'approved'|'declined'|'cancelled'|'refunded'|'error',
  gatewayReference: string,      // ID no gateway
  gatewayName: string,           // Nome do gateway
  paymentMethod: string,         // Método utilizado
  customerName: string,          // Nome do cliente
  customerEmail: string,         // Email do cliente
  customerPhone: string,         // Telefone do cliente
  metadata: object,              // Dados customizados
  createdAt: date,               // Data de criação
  updatedAt: date,               // Última atualização
  approvedAt: date,              // Data de aprovação (se aplicável)
  declinedAt: date,              // Data de recusa (se aplicável)
  errorMessage: string           // Mensagem de erro (se houver)
}
```

## 🎯 Próximos Passos

Para produção:

1. **Banco de Dados**
   - Migrar de JSON para PostgreSQL/MySQL
   - Criar índices em `orderId` e `gatewayReference`

2. **API Keys Reais**
   - Obter chaves da Stone/Pagar.me
   - Configurar em variáveis de ambiente

3. **Sistema de Queue**
   - Usar Redis/RabbitMQ para processar webhooks

4. **Notificações**
   - Integrar com SendGrid/Twilio
   - Enviar emails/SMS de confirmação

5. **Monitoring**
   - Integrar com DataDog/New Relic
   - Alertas para falhas de pagamento

6. **Reconciliação**
   - Implementar reconciliation automática
   - Detectar transações perdidas

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs em `console`
2. Consultar documentação oficial:
   - [Stone](https://stone.com.br/docs)
   - [Pagar.me](https://docs.pagar.me)
3. Usar modo mock para testes

## 📝 Licença

MIT

---

**Desenvolvido com ❤️ para simplificar integrações de pagamento**
