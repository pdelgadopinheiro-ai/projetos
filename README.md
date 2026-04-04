# EasyStore

Sistema de gestao comercial com frontend estatico e backend Node para sincronizacao segura com Supabase.

## O que ja esta pronto

- Frontend para produtos, vendas, estoque, relatorios e configuracoes.
- Backend local em `server.js`.
- Sincronizacao segura via API propria.
- Persistencia em nuvem no Supabase usando `service_role` somente no servidor.
- Consulta oficial de NCM pela base publica do Portal Unico Siscomex/Receita Federal.
- Validacao opcional por IA para conferir a coerencia do NCM com o produto cadastrado.

## Arquivos principais

- `index.html`: interface.
- `style.css`: estilos.
- `app.js`: comportamento da interface.
- `database.js`: camada de dados e sincronizacao com a API.
- `server.js`: backend local.
- `supabase.sql`: script SQL para criar a tabela no Supabase.
- `.env.example`: exemplo das variaveis necessarias.
- `Tabela_NCM_Vigente_20260331.json`: tabela oficial local da Receita usada pela API de NCM.

## Passo a passo para conectar

### 1. Criar o projeto no Supabase

1. Acesse o painel do Supabase.
2. Crie um projeto novo.
3. Aguarde a criacao terminar.

### 2. Criar a tabela do app

1. No painel do Supabase, abra `SQL Editor`.
2. Copie todo o conteudo de `supabase.sql`.
3. Execute o script.

Isso cria:

- `easy_store_state` para guardar os dados da loja
- `easy_store_ncm` para guardar a base oficial de NCM com indices de busca

### 3. Pegar as credenciais corretas

Voce vai precisar de:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (opcional, para validacao por IA)

Onde encontrar:

1. No Supabase, abra `Project Settings`.
2. Entre em `API`.
3. Copie a `Project URL`.
4. Copie a chave `service_role`.

Importante:

- Nao use a `anon key` no backend.
- Nao coloque a `service_role` no navegador.
- O projeto ja foi preparado para manter essa chave apenas no servidor.

### 4. Criar o arquivo `.env`

1. Duplique o arquivo `.env.example`.
2. Renomeie a copia para `.env`.
3. Preencha assim:

```env
PORT=3000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
OPENAI_API_KEY=sua_openai_api_key_aqui
OPENAI_MODEL=gpt-5-mini
NCM_LOCAL_JSON_PATH=Tabela_NCM_Vigente_20260331.json
NCM_SUPABASE_CANDIDATE_LIMIT=120
```

### 5. Subir o backend

Na pasta do projeto, rode:

```bash
npm start
```

Se estiver tudo certo, voce vai ver algo como:

```txt
EasyStore rodando em http://localhost:3000
```

### 5.1. Base local da Receita Federal

O projeto agora usa primeiro o arquivo local:

```txt
Tabela_NCM_Vigente_20260331.json
```

Se esse arquivo estiver na raiz do projeto, a API de NCM vai ler a tabela local automaticamente. Se voce mover o arquivo para outra pasta, ajuste `NCM_LOCAL_JSON_PATH` no `.env`.

### 5.2. Importar a base de NCM para o Supabase

Depois de subir o backend, importe a base local da Receita para o banco:

```txt
POST http://localhost:3000/api/ncm/import-local
```

Voce pode fazer isso no navegador usando uma ferramenta como Insomnia/Postman, ou no PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/ncm/import-local" -Method Post
```

Depois da importacao, a API vai consultar primeiro a tabela `easy_store_ncm` do Supabase e usar o JSON local apenas como fallback.

### 5.3. Sincronizacao automatica da base NCM

O backend agora compara automaticamente o arquivo local da Receita com a ultima sincronizacao salva no Supabase.

Se o arquivo mudar, ele reimporta a base sozinho no startup e tambem pode revalidar no endpoint de saude:

```txt
GET /api/health
```

Para controlar isso pelo `.env`:

```env
AUTO_SYNC_NCM_ON_STARTUP=true
```

No retorno de `/api/health`, veja o bloco:

```json
"ncm": {
  "sync": {
    "autoEnabled": true,
    "status": "sincronizado"
  }
}
```

## APIs novas de NCM

- `GET /api/ncm/search?term=shampoo&category=higiene&limit=5`
- `POST /api/ncm/import-local`
- `POST /api/ncm/validate`

Exemplo de corpo para validacao:

```json
{
  "nome": "Shampoo hidratante 300ml",
  "categoria": "higiene",
  "ncm": "3305.10.00"
}
```

O endpoint cruza a base oficial da Receita com uma validacao heuristica e, se `OPENAI_API_KEY` estiver configurada, adiciona a validacao por IA.

## Como usar no cadastro

1. Abra `Produtos`.
2. Clique em `Novo Produto`.
3. Digite o nome e escolha a categoria.
4. O sistema vai consultar a tabela local da Receita e mostrar ate 5 sugestoes oficiais de NCM.
5. Clique na sugestao mais adequada ou ajuste manualmente o codigo.
6. Ao salvar, o sistema valida a coerencia do NCM.
7. Se a IA estiver configurada, a validacao usa base oficial + IA. Se nao estiver, usa base oficial + heuristica local.

### 6. Abrir o sistema

1. No navegador, abra `http://localhost:3000`.
2. Entre na aba `Configuracoes`.
3. Em `Modo de dados`, escolha `API segura + Supabase`.
4. Em `URL da API`, use:

```txt
http://localhost:3000
```

5. Em `Identificador da loja`, defina um nome unico, por exemplo:

```txt
loja-matriz
```

6. Clique em `Salvar Conexao`.
7. Clique em `Sincronizar Agora`.

### 7. Confirmar se conectou

Voce pode validar de 3 formas:

1. No topo da interface deve aparecer `API conectada`.
2. Na area de configuracoes deve aparecer mensagem de sincronizacao bem-sucedida.
3. No navegador, abra:

```txt
http://localhost:3000/api/health
```

Se o backend estiver configurado, a resposta deve mostrar:

```json
{
  "ok": true,
  "supabaseConfigured": true,
  "ncm": {
    "source": "Arquivo local da Receita: Tabela_NCM_Vigente_20260331.json"
  }
}
```

## Fluxo recomendado

1. Cadastre um produto.
2. Clique em `Sincronizar Agora`.
3. Volte ao Supabase e confira a tabela `easy_store_state`.
4. Verifique se existe um registro com o `store_id` da sua loja.

## Se der erro

### Erro: backend sem configuracao do Supabase

Confira se o arquivo `.env` existe e se as variaveis estao preenchidas corretamente.

### Erro ao sincronizar

Confira:

- se a `SUPABASE_URL` esta correta
- se a `SUPABASE_SERVICE_ROLE_KEY` esta correta
- se voce executou o `supabase.sql`
- se o `store_id` foi preenchido na interface

### Porta 3000 ocupada

Troque no `.env`:

```env
PORT=3001
```

E depois use `http://localhost:3001` na interface.

## Observacao importante

Sem suas credenciais reais eu nao consigo conectar daqui ao seu projeto Supabase. O codigo e o fluxo ja estao prontos; falta apenas voce preencher os dados reais no `.env` e na tela de configuracao.

## Publicar na internet sem usar `npm start` manualmente

O jeito mais pratico aqui e hospedar o projeto em um servico que mantenha o Node rodando para voce. Eu deixei o projeto pronto para isso com o arquivo `render.yaml`.

### Opcao recomendada: Render

1. Coloque este projeto em um repositorio no GitHub.
2. Crie uma conta na Render.
3. Na Render, escolha criar um novo `Blueprint` ou `Web Service` a partir do seu repositorio.
4. Se usar `Blueprint`, a Render vai ler automaticamente o arquivo `render.yaml`.
5. Configure as variaveis de ambiente:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
EASYSTORE_STORE_ID
```

6. Inicie o deploy.
7. Quando terminar, abra a URL publica gerada pela Render.

### O que acontece depois do deploy

- O backend fica rodando na internet 24h por dia.
- O frontend abre usando a mesma URL publica.
- A conexao com o banco continua automatica pelo codigo.
- Voce nao precisa abrir terminal nem rodar `npm start` manualmente.

### Variaveis para usar na hospedagem

Use estes nomes:

```txt
HOST=0.0.0.0
PORT=10000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
EASYSTORE_STORE_ID=loja-matriz
```

Observacao:

- Em muitas hospedagens, `PORT` e definido automaticamente.
- Se a plataforma definir `PORT` sozinha, deixe ela controlar esse valor.

### Checklist antes de publicar

1. Confirmar que `supabase.sql` foi executado no Supabase.
2. Confirmar que a `service_role` esta correta.
3. Confirmar que o repositorio nao contem sua chave privada em arquivos versionados.
4. Confirmar que o endpoint `/api/health` responde com `supabaseConfigured: true`.
