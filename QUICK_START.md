# ⚡ Quick Start - Integração POS com Node.js

Guia rápido para começar em 5 minutos.

## 📋 Pré-requisitos

```bash
node >= 14.0.0
npm >= 6.0.0
```

## 🚀 Instalação Rápida

### 1. Instalar dependências

```bash
npm install express axios dotenv
```

### 2. Criar arquivo `.env`

```env
NODE_ENV=development
PORT=3000
PAYMENT_GATEWAY=mock
WEBHOOK_SECRET=dev-secret-key-12345
```

### 3. Criar arquivo principal (`server.js`)

```javascript
const express = require('express');
const { setupPaymentRoutes } = require('./examples/express-integration');

const app = express();
app.use(express.json());

(async () => {
  await setupPaymentRoutes(app);
  app.listen(3000, () => console.log('✅ Servidor rodando na porta 3000'));
})();
```

### 4. Iniciar servidor

```bash
node server.js
```

## 💳 Primeiro Pagamento (5 minutos)

### Opção 1: cURL (Terminal)

```bash
curl -X POST http://localhost:3000/payments \
  -H "Authorization: Bearer sk_test_example_key_123456" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "PED-001",
    "amount": 10000,
    "installments": 1,
    "description": "Meu primeiro pagamento",
    "customerName": "João Silva",
    "customerEmail": "joao@email.com",
    "customerPhone": "11987654321"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "transaction": {
    "id": "TXN_1234567890_abc123def",
    "status": "approved",
    "orderId": "PED-001",
    "amount": 10000
  }
}
```

### Opção 2: Node.js

```javascript
const PaymentClient = require('./examples/payment-client');

const client = new PaymentClient('http://localhost:3000');

const result = await client.initiatePayment({
  orderId: 'PED-001',
  amount: 10000,  // R$ 100,00
  installments: 1,
  description: 'Teste de pagamento',
  customerName: 'João Silva',
  customerEmail: 'joao@email.com',
  customerPhone: '11987654321'
});

console.log(result.transaction);
```

### Opção 3: Frontend (JavaScript/Fetch)

```javascript
const api = new PaymentAPIfetch('http://localhost:3000');

const result = await api.initiatePayment({
  orderId: 'PED-001',
  amount: 10000,
  installments: 1,
  customerName: 'João Silva',
  customerEmail: 'joao@email.com',
  customerPhone: '11987654321'
});

if (result.success) {
  console.log('✅ Pagamento iniciado:', result.transaction.id);
} else {
  console.error('❌ Erro:', result.error);
}
```

## 📊 Consultar Status

```bash
# Terminal
curl http://localhost:3000/payments/TXN_1234567890_abc123def \
  -H "Authorization: Bearer sk_test_example_key_123456"

# Node.js
const status = await client.getPaymentStatus('TXN_1234567890_abc123def');
console.log(status.transaction.status);  // "approved"
```

## 🧪 Modo Simulado (Mock)

No modo mock, o status é decidido pelo valor:

```javascript
// Recusado (valor termina em 0)
await initiatePayment({ amount: 10000 });  // ❌ declined

// Aprovado
await initiatePayment({ amount: 15099 });  // ✅ approved

// Processando (valor alto + 3+ parcelas)
await initiatePayment({ amount: 100000, installments: 3 });  // ⏳ processing
```

## 🔄 Webhook Simulado

Para testar webhooks sem esperar pela resposta real:

```bash
curl -X POST http://localhost:3000/webhooks/payment/simulate \
  -H "Authorization: Bearer sk_test_example_key_123456" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TXN_1234567890_abc123def",
    "status": "approved"
  }'
```

## 📁 Estrutura de Arquivos Criados

```
payments/                          # Sistema de pagamentos
├── models/transaction.js          # Modelo de dados
├── gateways/                      # Integrações com gateways
│  ├── pos-gateway.js             # Interface base
│  ├── stone-gateway.js           # Stone
│  ├── pagarmee-gateway.js        # Pagar.me
│  └── pos-mock-gateway.js        # Mock para testes
├── services/payment-service.js    # Lógica principal
├── controllers/payment-controller.js  # Endpoints HTTP
├── repositories/
│  ├── file-transaction-repository-v2.js  # JSON (dev)
│  └── postgres-transaction-repository-prod.js  # PostgreSQL (prod)
├── webhooks/payment-webhook.js    # Handler de webhooks
├── middleware/auth-middleware.js  # Segurança
├── utils/payment-utils.js         # Utilitários
└── config.js                      # Inicialização

examples/                          # Exemplos de uso
├── payment-client.js             # Cliente HTTP
├── checkout-flow-example.js      # Fluxo completo
├── express-integration.js        # Setup Express
├── http-requests-examples.js     # Exemplos Frontend
├── tests-example.js              # Testes
├── FLUXO_REQUEST_EXAMPLES.js    # Diagramas e CURL

PAYMENT_INTEGRATION_README.md      # Documentação completa
```

## 🔐 Segurança Básica

```javascript
// Suas API keys (não compartilhar!)
const API_KEY = 'sk_test_example_key_123456';

// Headers obrigatórios
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// Rate limiting: 100 req/min por IP
// CORS: Apenas origens configuradas
// Webhooks: Validados por assinatura HMAC
```

## 🎯 Próximos Passos

### 1. Integração com Banco de Dados (Produção)

```bash
npm install pg pg-promise
```

```javascript
// server.js
const PostgresTransactionRepository = require('./payments/repositories/postgres-transaction-repository-prod');

const repo = new PostgresTransactionRepository(process.env.DATABASE_URL);
await repo.initialize();
```

### 2. Usar API Keys Reais

```env
# .env
PAYMENT_GATEWAY=stone
STONE_API_KEY=sk_live_sua_chave_real
STONE_ACCOUNT_ID=seu_account_id
```

### 3. Configurar Webhooks do Gateway

- Stone: `https://seu-dominio.com/webhooks/payment`
- Pagar.me: `https://seu-dominio.com/webhooks/payment`

### 4. Integrar com Sistema Principal

```javascript
const { eventEmitter } = await setupPaymentRoutes(app);

eventEmitter.on('payment.approved', (data) => {
  // Atualizar pedido em seu banco de dados
  // Enviar email de confirmação
  // Disparar preparação de envio
});
```

## 🐛 Troubleshooting

### "API Key inválida"
```javascript
// Use Bearer token no header
Authorization: Bearer sk_test_example_key_123456
```

### "Gateway não configurado"
```env
# .env
PAYMENT_GATEWAY=mock  # Ou: stone, pagar-me
MOCK_MODE=true
```

### "Webhook não chegou"
Teste com o endpoint de simulação:
```bash
curl -X POST http://localhost:3000/webhooks/payment/simulate \
  -H "Authorization: Bearer sk_test_example_key_123456" \
  -d '{"transactionId": "TXN_...", "status": "approved"}'
```

## 📚 Links Úteis

- [Documentação Completa](./PAYMENT_INTEGRATION_README.md)
- [Fluxo Detalhado](./examples/FLUXO_REQUEST_EXAMPLES.js)
- [Exemplos de Teste](./examples/tests-example.js)
- [Cliente HTTP](./examples/payment-client.js)

## 🎓 Tutoriais Inclusos

1. **checkout-flow-example.js** - Fluxo completo do início ao fim
2. **express-integration.js** - Setup com Express
3. **http-requests-examples.js** - Requisições HTTP
4. **tests-example.js** - Testes automatizados

## 💡 Casos de Uso

### Loja E-commerce
```javascript
// Checkout → Pagamento → Confirmação → Envio
await processPayment();  // Inicia pagamento
// Webhook atualiza status automaticamente
```

### Marketplace
```javascript
// Múltiplos pagamentos por pedido
// Dividir comissão entre vendedores
// Liquidação para contas diferentes
```

### Sistema de Assinatura
```javascript
// Pagamentos recorrentes
// Controle de cobrança mensal
// Cancelamento automático
```

### POS (Maquininha)
```javascript
// Integração direta com terminal
// Confirmação instantânea
// Reembolsos rápidos
```

## 🚀 Deploy em Produção

Checklist antes de colocar em produção:

- [ ] Banco de dados PostgreSQL configurado
- [ ] API keys reais obtidas (Stone/Pagar.me)
- [ ] Variáveis de ambiente corretas
- [ ] HTTPS habilitado
- [ ] CORS configurado para domínios corretos
- [ ] Webhooks configurados nos gateways
- [ ] Monitoring e alertas em lugar
- [ ] Logs centralizados
- [ ] Testes de carga realizados
- [ ] Política de refund definida

## 📞 Suporte

Em caso de dúvidas:

1. Verificar logs do servidor
2. Testar no modo mock
3. Consultar documentação dos gateways
4. Usar modo debug: `DEBUG=payment-service:* node server.js`

---

**Pronto! Você tem um sistema de pagamento POS completo e pronto para usar! 🎉**
