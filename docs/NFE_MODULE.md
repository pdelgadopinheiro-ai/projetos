# Módulo NF-e (SEFAZ-MS)

Este projeto agora possui um módulo fiscal para emissão de NF-e (layout 4.00), integrado ao backend modular.

## O que o módulo faz

1. Monta XML da NF-e 4.00.
2. Assina digitalmente com certificado A1 (`.pfx`).
3. Transmite via WebService SOAP para SEFAZ-MS (homologação e produção).
4. Trata retorno de autorização/rejeição e consulta de recibo.
5. Gera DANFE em PDF com QR Code de consulta.
6. Armazena XMLs (unsigned, signed, respostas e autorizado) e metadata.

## Estrutura

Arquivos principais:

- `src/modular/domains/fiscal/nfe.xml.service.js`
- `src/modular/domains/fiscal/nfe.signature.service.js`
- `src/modular/domains/fiscal/nfe.sefaz.service.js`
- `src/modular/domains/fiscal/nfe.danfe.service.js`
- `src/modular/domains/fiscal/nfe.storage.service.js`
- `src/modular/domains/fiscal/fiscal.service.js`
- `src/modular/domains/fiscal/emitir-nota-fiscal.js`

## API REST

Endpoint:

- `POST /api/v1/fiscal/nfe/emitir`

Exemplo de payload:

```json
{
  "saleId": "VENDA-123",
  "invoiceNumber": 123,
  "serie": 1,
  "paymentMethod": "pix",
  "customer": {
    "name": "Cliente Teste",
    "document": "12345678909",
    "city": "Campo Grande",
    "uf": "MS",
    "address": {
      "street": "Rua das Flores",
      "number": "100",
      "neighborhood": "Centro",
      "city": "Campo Grande",
      "cityCode": "5002704",
      "uf": "MS",
      "cep": "79000000"
    }
  },
  "items": [
    {
      "code": "PROD-001",
      "description": "Produto de teste",
      "ncm": "22030000",
      "cfop": "5102",
      "unit": "UN",
      "quantity": 2,
      "unitPrice": 19.9,
      "barcode": "7894900011517",
      "taxes": {
        "icmsRate": 18,
        "pisRate": 1.65,
        "cofinsRate": 7.6
      }
    }
  ]
}
```

Retorno (resumo):

```json
{
  "status": "AUTORIZADA",
  "accessKey": "NFe...",
  "cStat": "100",
  "xMotivo": "Autorizado o uso da NF-e",
  "nProt": "135...",
  "xmlPaths": {
    "unsigned": "...",
    "signed": "...",
    "authorized": "..."
  },
  "danfePath": "..."
}
```

## Chamada direta no ERP

```js
const { emitirNotaFiscal } = require('./src/modular/domains/fiscal/emitir-nota-fiscal');
const resultado = await emitirNotaFiscal(dadosVenda);
```

## Configuração `.env`

Confira as variáveis adicionadas em `.env.example` com prefixo `NFE_`.

Pontos obrigatórios:

- `NFE_CERT_PATH`
- `NFE_CERT_PASSWORD`
- `NFE_CNPJ_EMITENTE`
- `NFE_IE_EMITENTE`
- `NFE_RAZAO_SOCIAL`
- `NFE_LOGRADOURO`, `NFE_NUMERO`, `NFE_BAIRRO`, `NFE_MUNICIPIO`, `NFE_CEP`
- URLs SEFAZ (`NFE_URL_AUTORIZACAO_*` e `NFE_URL_RETAUTORIZACAO_*`)

## Exemplo local

Script de exemplo:

```bash
node examples/nfe-emitir.js
```

## Compatibilidade de rota

O modulo fiscal tambem responde em:

- `POST /api/fiscal/nfe/emitir`

## Certificado em cloud

Para deploy em cloud, voce pode usar `NFE_CERT_BASE64` (conteudo base64 do .pfx).
Se `NFE_CERT_BASE64` estiver preenchido, o modulo nao depende de arquivo fisico em `NFE_CERT_PATH`.
