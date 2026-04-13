# Deploy EasyStore na Render

## 1) Publicar codigo no GitHub

No PowerShell, na raiz do projeto:

```powershell
git add .
git commit -m "deploy easystore"
git push origin main
```

## 2) Criar servico na Render

1. Acesse Render > `New` > `Blueprint`.
2. Selecione o repositorio.
3. Confirme o `render.yaml`.
4. Aguarde o primeiro build.

## 3) Variaveis obrigatorias

No painel do servico, preencha:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EASYSTORE_STORE_ID`

Para NF-e (perfil `Atacado`):

- `NFE_CERT_PASSWORD`
- `NFE_CNPJ_EMITENTE`
- `NFE_IE_EMITENTE`
- `NFE_RAZAO_SOCIAL`
- `NFE_LOGRADOURO`
- `NFE_BAIRRO`
- `NFE_MUNICIPIO`
- `NFE_CEP`

Certificado A1 no deploy (escolha 1 opcao):

1. `NFE_CERT_BASE64` (recomendado em cloud).
2. `NFE_CERT_PATH` apontando para arquivo presente no container.

## 4) Gerar NFE_CERT_BASE64

No seu computador:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificados\\certificado-a1.pfx")) | Set-Clipboard
```

Depois cole o valor no env `NFE_CERT_BASE64` na Render.

## 5) Validar endpoints apos deploy

Troque `SEU_APP` pelo dominio:

```text
https://SEU_APP.onrender.com/api/health
https://SEU_APP.onrender.com/api/v1/health
https://SEU_APP.onrender.com/vendas
```

Se o modulo fiscal estiver configurado, a rota abaixo deve responder (POST):

```text
https://SEU_APP.onrender.com/api/v1/fiscal/nfe/emitir
```

## 6) Checklist funcional

1. Entrar em `/vendas`.
2. Adicionar item por `F10` ou codigo de barras.
3. Finalizar com perfil fiscal `Atacado (NF-e)`.
4. Conferir mensagem de autorizacao/rejeicao da NF-e.
5. Conferir arquivos fiscais em `data/nfe`.

## 7) Observacao de persistencia

`data/nfe` e `data/payment-transactions.json` ficam no filesystem local do container.
Para retenção longa (5 anos), use armazenamento persistente (ex.: Supabase Storage, S3 ou disco persistente).
