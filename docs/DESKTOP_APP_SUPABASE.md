# EasyStore Desktop + Supabase (multi-PC)

Este projeto agora pode rodar como app de PC usando Electron.
Para varios computadores se comunicarem entre si, todos devem usar o mesmo backend (API) conectado ao mesmo projeto Supabase.

## Como funciona

1. Cada PC abre o app desktop.
2. O app desktop aponta para uma URL de servidor (Render, VPS, etc).
3. O backend sincroniza dados no Supabase.
4. Qualquer alteracao feita em um PC aparece nos outros PCs que usam a mesma URL e o mesmo `EASYSTORE_STORE_ID`.

## 1) Publicar o backend

Use o guia do projeto:

- `DEPLOY_RENDER.md`

No minimo configure estas variaveis no backend publicado:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EASYSTORE_STORE_ID`

## 2) Rodar o app desktop localmente

Na raiz do projeto:

```bash
npm install
npm run desktop
```

Na primeira abertura, informe a URL do backend no painel "Configurar Servidor".
Exemplo:

```txt
https://seu-app.onrender.com
```

## 3) Gerar instalador Windows

```bash
npm install
npm run build:desktop
```

Arquivo de saida:

- pasta `dist/desktop`

## 4) Instalar em varios PCs

1. Instale o app em cada PC.
2. Abra o app e configure a mesma URL do backend.
3. Garanta que todos usem o mesmo `EASYSTORE_STORE_ID` no backend.

Pronto: os PCs passam a compartilhar os dados pela nuvem.

## Observacoes importantes

- Sem backend publicado, os PCs nao se comunicam entre si.
- O app desktop nao substitui o Supabase: ele e uma interface nativa para abrir o sistema.
- Se mudar a URL do servidor, reabra "Configurar Servidor" e salve a nova URL.
