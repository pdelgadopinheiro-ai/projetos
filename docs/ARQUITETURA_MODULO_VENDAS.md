# Arquitetura: Módulo de Vendas Isolado (Monolito Modular)

## 1) Visão geral da arquitetura

- **Modelo adotado**: monolito modular com **API central em Express**.
- **Domínios separados**:
  - `products`
  - `inventory`
  - `sales`
  - `reports`
- **Frontend separado para vendas**:
  - rota dedicada: `GET /vendas`
  - script próprio: `/vendas/vendas.js`
- **Persistência central**:
  - `StateStore` em `data/modular-state.json` (camada única de gravação com lock)
  - todos os domínios leem/escrevem por essa camada para manter consistência.

## 2) Estrutura de pastas por domínio

```txt
modular-server.js
src/modular/
  create-app.js
  config/
    env.js
  middleware/
    request-context.js
    error-handler.js
    not-found.js
  shared/
    state-store.js
    validators.js
    errors.js
    async-handler.js
  domains/
    products/
      products.routes.js
      products.controller.js
      products.service.js
      products.repository.js
    inventory/
      inventory.routes.js
      inventory.controller.js
      inventory.service.js
      inventory.repository.js
    sales/
      sales.routes.js
      sales.controller.js
      sales.service.js
      sales.repository.js
    reports/
      reports.routes.js
      reports.controller.js
      reports.service.js
  frontend/
    vendas/
      index.html
      vendas.js
```

## 3) Fluxo completo de venda (clique até persistir)

1. Usuário abre `/vendas`.
2. Frontend consulta catálogo em `GET /api/v1/products`.
3. Usuário monta carrinho no frontend separado.
4. Ao clicar em **Finalizar venda**, frontend envia:
   - `POST /api/v1/sales`
   - payload com `items[]` e `paymentMethod`.
5. `sales.controller` delega para `sales.service`.
6. `sales.service`:
   - valida itens
   - consulta produtos no estado atual
   - valida estoque disponível
   - calcula subtotal/total
   - baixa estoque
   - gera movimentos de estoque automáticos
   - salva venda.
7. Tudo é salvo por **uma única operação transacional lógica** (`stateStore.update` com lock).
8. Frontend atualiza KPIs em:
   - `GET /api/v1/reports/sales-summary`
   - `GET /api/v1/inventory/low-stock`

## 4) Comunicação entre módulo de vendas e estoque

- A comunicação é **interna via service layer**, não via chamadas HTTP entre módulos.
- `sales.service` aplica a baixa de estoque no mesmo ciclo de persistência da venda.
- Resultado:
  - venda e estoque ficam consistentes
  - não existe risco de “venda salva sem baixa” no mesmo request.

## 5) Rotas REST implementadas

### Produtos
- `GET /api/v1/products`
- `GET /api/v1/products/:productId`
- `POST /api/v1/products`
- `PATCH /api/v1/products/:productId`

### Estoque
- `GET /api/v1/inventory/movements`
- `POST /api/v1/inventory/movements`
- `GET /api/v1/inventory/low-stock`

### Vendas
- `GET /api/v1/sales`
- `GET /api/v1/sales/:saleId`
- `POST /api/v1/sales`

### Relatórios
- `GET /api/v1/reports/sales-summary`
- `GET /api/v1/reports/top-products`
- `GET /api/v1/reports/inventory-snapshot`

### Infra
- `GET /api/v1/health`
- `GET /vendas`

## 6) Estratégia de separação do frontend

- **Fase atual (já implementada)**:
  - rota de vendas isolada (`/vendas`) com JS próprio.
  - integração total via API central.
- **Fase de migração recomendada**:
  - migrar `produtos`, `estoque` e `relatórios` para frontends dedicados.
  - manter shell principal como “hub” de navegação.
- **Benefício**:
  - vendas evolui de forma independente sem quebrar as outras áreas.

## 7) Boas práticas para evitar acoplamento

- controller só trata HTTP.
- service concentra regra de negócio.
- repository só acessa persistência.
- validações em `shared/validators`.
- erros de domínio em `shared/errors`.
- sem acesso direto entre controllers de domínios diferentes.
- sem lógica de negócio no frontend.

## 8) Melhorias sugeridas (próximo passo)

1. Trocar `StateStore` por Postgres/Supabase via `Repository Adapter`.
2. Adicionar autenticação (JWT/API Key) por middleware.
3. Criar auditoria de eventos de venda/estoque.
4. Criar testes automatizados:
   - unitários de service
   - integração de rotas.
5. Adicionar idempotência em `POST /sales` (evita venda duplicada por reenvio).
6. Preparar para microserviços:
   - manter contratos REST estáveis
   - publicar eventos de venda (ex.: fila) sem quebrar API.

## 9) Como executar

1. Instalar dependências:
   - `npm install`
2. Subir API modular:
   - `npm run start:modular`
3. Acessar:
   - `http://localhost:3333/vendas`

