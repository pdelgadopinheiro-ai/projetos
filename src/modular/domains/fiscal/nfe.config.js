const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { getUfCode } = require('./nfe.utils');

dotenv.config({ quiet: true });

function parseNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function toBool(value, fallback = false) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    return ['1', 'true', 'yes', 'sim'].includes(String(value).toLowerCase().trim());
}

function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function getNfeConfig(projectRoot) {
    const environment = String(process.env.NFE_AMBIENTE || 'homolog').toLowerCase().trim();
    const tpAmb = ['1', 'producao', 'production'].includes(environment) ? '1' : '2';
    const uf = String(process.env.NFE_UF || 'MS').toUpperCase().trim();
    const cUF = process.env.NFE_CUF || getUfCode(uf);
    const certPath = path.isAbsolute(process.env.NFE_CERT_PATH || '')
        ? process.env.NFE_CERT_PATH
        : path.join(projectRoot, process.env.NFE_CERT_PATH || 'certificados/certificado-a1.pfx');

    const storageDir = path.isAbsolute(process.env.NFE_STORAGE_DIR || '')
        ? process.env.NFE_STORAGE_DIR
        : path.join(projectRoot, process.env.NFE_STORAGE_DIR || 'data/nfe/xml');
    const danfeDir = path.isAbsolute(process.env.NFE_DANFE_DIR || '')
        ? process.env.NFE_DANFE_DIR
        : path.join(projectRoot, process.env.NFE_DANFE_DIR || 'data/nfe/danfe');

    ensureDirectory(storageDir);
    ensureDirectory(danfeDir);

    return {
        nfeVersion: '4.00',
        tpAmb,
        environment: tpAmb === '1' ? 'producao' : 'homologacao',
        certPath,
        certBase64: String(process.env.NFE_CERT_BASE64 || '').trim(),
        certPassword: String(process.env.NFE_CERT_PASSWORD || ''),
        soapTimeoutMs: parseNumber(process.env.NFE_SOAP_TIMEOUT_MS, 30000),
        tlsRejectUnauthorized: toBool(process.env.NFE_TLS_REJECT_UNAUTHORIZED, true),
        pollIntervalMs: parseNumber(process.env.NFE_POLL_INTERVAL_MS, 2500),
        pollAttempts: parseNumber(process.env.NFE_POLL_ATTEMPTS, 8),
        retentionYears: parseNumber(process.env.NFE_RETENTION_YEARS, 5),
        enforceRetention: toBool(process.env.NFE_RETENTION_ENFORCE, false),
        danfeQrBaseUrl: String(
            process.env.NFE_DANFE_QR_BASE_URL
            || 'https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?chNFe='
        ),
        endpoints: {
            homologacao: {
                autorizacao: String(
                    process.env.NFE_URL_AUTORIZACAO_HOMOLOG
                    || 'https://hom.nfe.sefaz.ms.gov.br/ws/NFeAutorizacao4'
                ),
                retAutorizacao: String(
                    process.env.NFE_URL_RETAUTORIZACAO_HOMOLOG
                    || 'https://hom.nfe.sefaz.ms.gov.br/ws/NFeRetAutorizacao4'
                )
            },
            producao: {
                autorizacao: String(
                    process.env.NFE_URL_AUTORIZACAO_PRODUCAO
                    || 'https://nfe.sefaz.ms.gov.br/ws/NFeAutorizacao4'
                ),
                retAutorizacao: String(
                    process.env.NFE_URL_RETAUTORIZACAO_PRODUCAO
                    || 'https://nfe.sefaz.ms.gov.br/ws/NFeRetAutorizacao4'
                )
            }
        },
        emitter: {
            cUF,
            uf,
            cMun: String(process.env.NFE_CODIGO_MUNICIPIO || '5002704'),
            cPais: String(process.env.NFE_CODIGO_PAIS || '1058'),
            xPais: String(process.env.NFE_NOME_PAIS || 'BRASIL'),
            cnpj: String(process.env.NFE_CNPJ_EMITENTE || ''),
            ie: String(process.env.NFE_IE_EMITENTE || ''),
            im: String(process.env.NFE_IM_EMITENTE || ''),
            xNome: String(process.env.NFE_RAZAO_SOCIAL || ''),
            xFant: String(process.env.NFE_NOME_FANTASIA || ''),
            crt: String(process.env.NFE_CRT || '3'),
            fone: String(process.env.NFE_FONE || ''),
            address: {
                xLgr: String(process.env.NFE_LOGRADOURO || ''),
                nro: String(process.env.NFE_NUMERO || 'S/N'),
                xCpl: String(process.env.NFE_COMPLEMENTO || ''),
                xBairro: String(process.env.NFE_BAIRRO || ''),
                xMun: String(process.env.NFE_MUNICIPIO || ''),
                cep: String(process.env.NFE_CEP || '')
            }
        },
        defaults: {
            model: '55',
            serie: parseNumber(process.env.NFE_SERIE, 1),
            natOp: String(process.env.NFE_NATOP_PADRAO || 'VENDA DE MERCADORIA'),
            cfop: String(process.env.NFE_CFOP_PADRAO || '5102'),
            ncm: String(process.env.NFE_NCM_PADRAO || '00000000'),
            cstIcms: String(process.env.NFE_CST_ICMS_PADRAO || '00'),
            cstPis: String(process.env.NFE_CST_PIS_PADRAO || '01'),
            cstCofins: String(process.env.NFE_CST_COFINS_PADRAO || '01')
        },
        storageDir,
        danfeDir
    };
}

module.exports = { getNfeConfig };
