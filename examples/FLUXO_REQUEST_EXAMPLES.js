/**
 * FLUXO DE INTEGRAÇÃO - DIAGRAMADO
 */

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                    FLUXO COMPLETO DE PAGAMENTO POS                         ║
╚════════════════════════════════════════════════════════════════════════════╝


1️⃣ FRONTEND / CLIENTE INICIA COMPRA
═══════════════════════════════════════════════════════════════════════════════

┌─ Usuário preenche formulário ─┐
│                               │
│  Pedido: PED-001              │
│  Valor: R$ 150,99             │
│  Parcelas: 3x                 │
│  Método: Cartão de Crédito    │
│                               │
└───────────────┬───────────────┘
                │
                ▼
        📤 POST /payments
        │
        ├─ Authorization: Bearer sk_test_key
        ├─ Content-Type: application/json
        └─ Body: { orderId, amount, installments, ... }


2️⃣ SERVIDOR RECEBE REQUISIÇÃO
═══════════════════════════════════════════════════════════════════════════════

        POST /payments
             │
             ▼
    PaymentController.initiate()
             │
             ├─ Valida API Key ✓
             ├─ Valida JSON ✓
             └─ Extrai dados ✓
                      │
                      ▼
    PaymentService.processPayment()
             │
             ├─ Cria objeto Transaction
             ├─ Valida dados obrigatórios
             └─ Envia para gateway
                      │
                      ▼
    StoneGateway.initiatePayment()
    (ou PagarmeGateway, MockGateway)
             │
             ├─ Conecta com API do gateway
             ├─ Envia dados de pagamento
             └─ Recebe referência única
                      │
                      ▼ Referência: stone_1234567890


3️⃣ SALVAR TRANSAÇÃO NO BANCO
═══════════════════════════════════════════════════════════════════════════════

    Repository.save(transaction)
             │
             ├─ Salva em database (PostgreSQL)
             │  ou arquivo JSON (desenvolvimento)
             │
             ├─ ID: TXN_1234567890_abc123def
             ├─ Gateway Ref: stone_1234567890
             ├─ Status: "processing"
             └─ Created: 2024-01-15T10:30:00Z


4️⃣ EMITIR EVENTOS
═══════════════════════════════════════════════════════════════════════════════

    eventEmitter.emit('payment.initiated', data)
             │
             ├─ Listeners podem:
             │  - Enviar email de confirmação
             │  - Atualizar banco de dados principal
             │  - Registrar log
             │  - Disparar outras ações


5️⃣ RESPONDER CLIENTE
═══════════════════════════════════════════════════════════════════════════════

    ← 201 Created
    {
      "success": true,
      "transaction": {
        "id": "TXN_1234567890_abc123def",
        "status": "processing",
        "orderId": "PED-001",
        "amount": 15099,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    }


6️⃣ FRONTEND AGUARDA RESPOSTA
═══════════════════════════════════════════════════════════════════════════════

    ┌─ Recebe ID da transação ─┐
    │ TXN_1234567890_abc123def │
    └─────────┬────────────────┘
              │
              ├─ Opção 1: Aguardar webhook
              │  (melhor método)
              │
              └─ Opção 2: Consultar status periodicamente
                 GET /payments/TXN_1234567890_abc123def


7️⃣ GATEWAY PROCESSA PAGAMENTO
═══════════════════════════════════════════════════════════════════════════════

    [Stone API] processando...
              │
              ├─ Conecta com operadora
              ├─ Valida dados do cartão
              ├─ Valida limite
              └─ Aprova ou recusa


8️⃣ GATEWAY ENVIA WEBHOOK PARA SERVIDOR
═══════════════════════════════════════════════════════════════════════════════

    [Stone] → POST /webhooks/payment
             │
             ├─ gatewayReference: "stone_1234567890"
             ├─ status: "approved"  (ou "declined")
             ├─ timestamp: "2024-01-15T10:30:05Z"
             ├─ signature: "abc123..."
             └─ [outros dados]


9️⃣ SERVIDOR PROCESSA WEBHOOK
═══════════════════════════════════════════════════════════════════════════════

    POST /webhooks/payment
         │
         ▼
    WebhookHandler.handle()
         │
         ├─ ✓ Valida assinatura
         ├─ ✓ Busca transação no banco
         ├─ ✓ Atualiza status
         └─ ✓ Emite eventos
                  │
                  ├─ payment.approved
                  │  ├─ Enviar email de sucesso
                  │  ├─ Atualizar DB principal
                  │  └─ Preparar envio
                  │
                  └─ payment.declined
                     ├─ Enviar email de recusa
                     └─ Notificar cliente

    ← 200 OK { success: true }


🔟 FRONTEND RECEBE NOTIFICAÇÃO
═══════════════════════════════════════════════════════════════════════════════

    Opção A: Webhook de retorno (WebSocket/Server-Sent Events)
    
    Opção B: Polling (Consulta Status)
    ┌─ GET /payments/TXN_1234567890_abc123def
    │         │
    │         ├─ { status: "approved" }  ← SUCESSO
    │         │   Redireciona para página de confirmação
    │         │
    │         └─ { status: "declined" }  ← FALHA
    │             Mostra erro, permite tentar novamente

    Opção C: WebSocket (Conexão bidirecional em tempo real)


ESTADOS POSSÍVEIS
═══════════════════════════════════════════════════════════════════════════════

pending      → Aguardando processamento
processing   → Sendo processado pelo gateway
approved     → ✅ Pagamento aprovado
declined     → ❌ Pagamento recusado
cancelled    → 🛑 Cancelado pelo usuário/sistema
refunded     → 💸 Reembolsado
error        → ⚠️ Erro interno


OPERAÇÕES DISPONÍVEIS
═══════════════════════════════════════════════════════════════════════════════

1. INICIAR PAGAMENTO
   POST /payments
   Status: pending → processing → approved/declined

2. CONSULTAR STATUS
   GET /payments/:transactionId
   Sempre consulta estado atual

3. CANCELAR
   POST /payments/:transactionId/cancel
   Apenas se status = pending/processing/approved

4. REEMBOLSAR
   POST /payments/:transactionId/refund
   Apenas se status = approved


PROTOCOLO WEBHOOK
═══════════════════════════════════════════════════════════════════════════════

Assinatura HMAC-SHA256:

1. Gateway calcula:
   signature = HMAC-SHA256(payload_json, WEBHOOK_SECRET)

2. Envia no header:
   X-Webhook-Signature: abc123def456...

3. Servidor valida:
   expected = HMAC-SHA256(payload_json, WEBHOOK_SECRET)
   IF signature == expected → ✓ Autêntico
   ELSE → ✗ Recusar

*/

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLOS DE REQUISIÇÃO (CURL)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 1️⃣ INICIAR PAGAMENTO
 */
const curl_initiate = `
curl -X POST http://localhost:3000/payments \\
  -H "Authorization: Bearer sk_test_example_key_123456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderId": "PED-001",
    "amount": 15099,
    "installments": 3,
    "description": "Compra de produtos - Loja Online",
    "customerName": "João Silva",
    "customerEmail": "joao.silva@email.com",
    "customerPhone": "11987654321",
    "paymentMethod": "credit_card",
    "metadata": {
      "storeId": "store-001",
      "productIds": [1, 2, 3]
    }
  }'
`;

/**
 * 2️⃣ CONSULTAR STATUS
 */
const curl_status = `
curl -X GET http://localhost:3000/payments/TXN_1234567890_abc123def \\
  -H "Authorization: Bearer sk_test_example_key_123456" \\
  -H "Content-Type: application/json"
`;

/**
 * 3️⃣ CANCELAR
 */
const curl_cancel = `
curl -X POST http://localhost:3000/payments/TXN_1234567890_abc123def/cancel \\
  -H "Authorization: Bearer sk_test_example_key_123456" \\
  -H "Content-Type: application/json"
`;

/**
 * 4️⃣ REEMBOLSAR
 */
const curl_refund = `
curl -X POST http://localhost:3000/payments/TXN_1234567890_abc123def/refund \\
  -H "Authorization: Bearer sk_test_example_key_123456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 7500
  }'
`;

/**
 * 5️⃣ LISTAR TRANSAÇÕES DO PEDIDO
 */
const curl_history = `
curl -X GET http://localhost:3000/payments/orders/PED-001 \\
  -H "Authorization: Bearer sk_test_example_key_123456" \\
  -H "Content-Type: application/json"
`;

/**
 * 6️⃣ OBTER ESTATÍSTICAS
 */
const curl_stats = `
curl -X GET http://localhost:3000/payments/stats \\
  -H "Authorization: Bearer sk_test_example_key_123456" \\
  -H "Content-Type: application/json"
`;

/**
 * 7️⃣ SIMULAR WEBHOOK (TESTES)
 */
const curl_webhook = `
curl -X POST http://localhost:3000/webhooks/payment/simulate \\
  -H "Authorization: Bearer sk_test_example_key_123456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactionId": "TXN_1234567890_abc123def",
    "status": "approved"
  }'
`;

/**
 * 8️⃣ WEBHOOK DO GATEWAY (Simulado)
 */
const curl_gateway_webhook = `
curl -X POST http://localhost:3000/webhooks/payment \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: abc123def456..." \\
  -d '{
    "gatewayReference": "stone_1234567890",
    "transactionId": "TXN_1234567890_abc123def",
    "status": "approved",
    "amount": 15099,
    "timestamp": "2024-01-15T10:30:05Z",
    "signature": "abc123def456..."
  }'
`;

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════════════════

console.log('📚 EXEMPLOS DE REQUISIÇÃO CURL:');
console.log('================================\n');

console.log('1️⃣  INICIAR PAGAMENTO:');
console.log(curl_initiate);

console.log('\n2️⃣  CONSULTAR STATUS:');
console.log(curl_status);

console.log('\n3️⃣  CANCELAR:');
console.log(curl_cancel);

console.log('\n4️⃣  REEMBOLSAR:');
console.log(curl_refund);

console.log('\n5️⃣  LISTAR TRANSAÇÕES:');
console.log(curl_history);

console.log('\n6️⃣  ESTATÍSTICAS:');
console.log(curl_stats);

console.log('\n7️⃣  SIMULAR WEBHOOK:');
console.log(curl_webhook);

module.exports = {
  curl_initiate,
  curl_status,
  curl_cancel,
  curl_refund,
  curl_history,
  curl_stats,
  curl_webhook,
  curl_gateway_webhook,
};
