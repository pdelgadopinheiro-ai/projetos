# Deploy EasyStore na Internet (Render)

## 1. Suba seu codigo para o GitHub

No PowerShell, na pasta do projeto:

```powershell
git add .
git commit -m "prepare deploy render"
git push origin main
```

## 2. Crie o servico na Render

1. Acesse a Render.
2. Clique em `New` > `Blueprint`.
3. Escolha o repositorio `projetos`.
4. Confirme o deploy do `render.yaml`.

## 3. Configure as variaveis de ambiente (obrigatorias)

No painel do servico Render, confira:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EASYSTORE_STORE_ID`

Opcional para NCM com IA:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Opcional para pagamentos em API real (adquirente):

- `PAYMENT_GATEWAY_MODE=api`
- `PAYMENT_PROVIDER_NAME`
- `PAYMENT_API_BASE_URL`
- `PAYMENT_API_KEY`
- `PAYMENT_API_SECRET`

Se nao configurar API real, deixe `PAYMENT_GATEWAY_MODE=mock`.

## 4. Valide se subiu com tudo funcionando

Depois do deploy:

1. Abra `https://SEU_APP.onrender.com/api/health`.
2. Confirme que retorna `"ok": true`.
3. Abra `https://SEU_APP.onrender.com`.
4. Em `Configuracoes`, confirme conexao da API e sincronizacao.

## 5. Observacao importante sobre logs de pagamento

`PAYMENT_LOG_PATH` usa arquivo local. Em hospedagem, esse tipo de arquivo pode ser volatil em reinicio/redeploy.
Para historico de pagamentos com persistencia forte, o ideal e usar repositorio em banco (Postgres/Supabase).
