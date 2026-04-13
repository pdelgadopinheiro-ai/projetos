const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
    PaymentService,
    MockPaymentGateway,
    HttpPaymentGateway,
    FileTransactionRepository,
    PaymentGatewayError,
    PaymentValidationError
} = require('./payments');
const {
    getPaymentProviderCatalog,
    findPaymentProvider
} = require('./payments/provider-catalog');
const { createModularApp } = require('./src/modular/create-app');

loadEnvFile(path.join(__dirname, '.env'));

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const SUPABASE_URL = normalizeBaseUrl(process.env.SUPABASE_URL || '');
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const EASYSTORE_STORE_ID = (process.env.EASYSTORE_STORE_ID || 'loja-matriz').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
const OPENAI_MODEL = (process.env.OPENAI_MODEL || 'gpt-5-mini').trim();
const PAYMENT_GATEWAY_MODE = (process.env.PAYMENT_GATEWAY_MODE || 'mock').trim().toLowerCase();
const PAYMENT_PROVIDER_NAME = (process.env.PAYMENT_PROVIDER_NAME || 'stone').trim();
const PAYMENT_API_BASE_URL = normalizeBaseUrl(process.env.PAYMENT_API_BASE_URL || '');
const PAYMENT_API_KEY = (process.env.PAYMENT_API_KEY || '').trim();
const PAYMENT_API_SECRET = (process.env.PAYMENT_API_SECRET || '').trim();
const PAYMENT_LOG_PATH = path.join(__dirname, process.env.PAYMENT_LOG_PATH || 'data/payment-transactions.json');
const PAYMENT_PROVIDER_CONFIG_PATH = path.join(__dirname, process.env.PAYMENT_PROVIDER_CONFIG_PATH || 'data/payment-provider-config.json');
const PAYMENT_PROVIDER_CONFIG_JSON = parseJsonEnv(process.env.PAYMENT_PROVIDER_CONFIG_JSON || '{}');
const RECEITA_NCM_URL = 'https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO';
const NCM_LOCAL_JSON_PATH = path.join(__dirname, process.env.NCM_LOCAL_JSON_PATH || 'Tabela_NCM_Vigente_20260331.json');
const NCM_CACHE_TTL_MS = Number(process.env.NCM_CACHE_TTL_MS || 1000 * 60 * 60 * 12);
const NCM_SUPABASE_CANDIDATE_LIMIT = Number(process.env.NCM_SUPABASE_CANDIDATE_LIMIT || 120);
const AUTO_SYNC_NCM_ON_STARTUP = (process.env.AUTO_SYNC_NCM_ON_STARTUP || 'true').trim().toLowerCase() !== 'false';
const NCM_SYNC_META_STORE_ID = '__ncm_sync_meta__';
const STATIC_FILES = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/style.css': 'style.css',
    '/app.js': 'app.js',
    '/database.js': 'database.js'
};
const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};
const CATEGORY_CHAPTER_HINTS = {
    cosmeticos: ['33'],
    perfumes: ['33'],
    higiene: ['33', '34', '48', '96'],
    acessorios: ['39', '42', '61', '62', '64', '71', '73', '83', '85', '95'],
    brinquedos: ['95'],
    eletronicos: ['84', '85', '90'],
    animais: ['01', '05', '23', '42'],
    papelaria: ['48', '49', '82', '96'],
    outras: []
};
const SEARCH_SYNONYMS = {
    shampoo: ['xampu', 'xampus'],
    xampu: ['shampoo', 'xampus'],
    xampus: ['shampoo', 'xampu'],
    cabo: ['cabos eletricos', 'fio eletrico', 'fios e cabos eletricos', 'condutor eletrico', 'condutores eletricos', '8544'],
    cabos: ['cabos eletricos', 'fio eletrico', 'fios e cabos eletricos', 'condutor eletrico', 'condutores eletricos', '8544'],
    eletrico: ['eletricos', 'condutor eletrico', 'fios e cabos eletricos', '8544'],
    eletricos: ['eletrico', 'condutores eletricos', 'fios e cabos eletricos', '8544'],
    condicionador: ['preparacoes capilares', 'creme para pentear'],
    perfume: ['perfumes', 'fragrancia'],
    colonia: ['agua de colonia'],
    desodorante: ['desodorantes'],
    sabonete: ['saboes', 'lavagem da pele'],
    sabonetes: ['saboes', 'lavagem da pele'],
    creme: ['cremes'],
    hidratante: ['cremes', 'locoes'],
    maquiagem: ['produtos de beleza', '3304', 'preparacoes cosmeticas'],
    base: ['base de maquiagem', 'maquiagem', '3304'],
    inflador: ['bomba de ar', 'inflar', 'compressor de ar', '8414'],
    inflar: ['inflador', 'bomba de ar', '8414'],
    coleira: ['coleiras', 'animais', 'pet', '4201'],
    pet: ['animais', 'coleira para animais', '4201'],
    batom: ['labios'],
    rimel: ['cilios'],
    pasta: ['dentifricios'],
    dental: ['dentifricios'],
    dentifricio: ['creme dental', 'pasta de dente'],
    fralda: ['fraldas'],
    absorvente: ['absorventes']
};
const SEARCH_STOPWORDS = new Set([
    'a', 'ao', 'aos', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os',
    'ou', 'para', 'pra', 'pro', 'por', 'um', 'uma', 'uns', 'umas'
]);
const PRODUCT_CLASSIFICATION_HINTS = [
    {
        patterns: ['cabo eletrico', 'cabos eletricos', 'fio eletrico', 'fios e cabos eletricos', 'condutor eletrico'],
        chapters: ['85'],
        codePrefixes: ['8544'],
        preferredCodes: ['8544.49.00', '8544.42.00'],
        preferredTerms: ['condutores eletricos', 'isolados', 'cabos'],
        negativeTerms: ['ignicao', 'coaxiais', 'fibras opticas', 'submarino']
    },
    {
        patterns: ['base maquiagem', 'base de maquiagem', 'base liquida', 'make liquida', 'maquiagem facial'],
        chapters: ['33'],
        codePrefixes: ['3304.99'],
        preferredCodes: ['3304.99.90', '3304.99.10'],
        preferredTerms: ['outros'],
        negativeTerms: ['labios', 'olhos', 'unhas', 'po', 'cremes nutritivos', 'locoes tonicas']
    },
    {
        patterns: ['inflador', 'bomba de ar', 'compressor portatil', 'inflador portatil', 'inflador manual'],
        chapters: ['84'],
        codePrefixes: ['8414.20', '8414'],
        preferredCodes: ['8414.20.00'],
        preferredTerms: ['bombas de ar', 'mao', 'pe'],
        negativeTerms: ['vacuo', 'coifas', 'ventiladores', 'exaustores']
    },
    {
        patterns: ['coleira pet', 'coleira para animais', 'coleira cachorro', 'coleira gato', 'coleira para pet', 'acessorio pet'],
        chapters: ['42'],
        codePrefixes: ['4201'],
        preferredCodes: ['4201.00.90', '4201.00.10'],
        preferredTerms: ['animais', 'artefatos e acessorios'],
        negativeTerms: []
    }
];
const ncmCache = {
    fetchedAt: 0,
    items: null,
    source: null,
    updatedAtLabel: null,
    databaseAvailable: null
};
const ncmSyncState = {
    inProgress: false,
    lastCheckedAt: '',
    lastSyncedAt: '',
    status: 'idle',
    reason: '',
    lastError: '',
    localSignature: '',
    localItemCount: 0,
    localUpdatedAtLabel: ''
};
const PAYMENT_PROVIDER_CATALOG = getPaymentProviderCatalog();
const modularApp = createModularApp();

const server = http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        const url = new URL(req.url, `http://${req.headers.host}`);

        if (url.pathname === '/vendas' || url.pathname.startsWith('/vendas/') || url.pathname.startsWith('/api/v1/')) {
            return modularApp(req, res);
        }

        if (url.pathname === '/api/health') {
            const ncmStatus = getNcmCacheStatus();
            return sendJson(res, 200, {
                ok: true,
                date: new Date().toISOString(),
                supabaseConfigured: hasValidSupabaseConfig(),
                openaiConfigured: Boolean(OPENAI_API_KEY),
                ncm: ncmStatus
            });
        }

        if (url.pathname === '/api/config') {
            const ncmStatus = getNcmCacheStatus();
            return sendJson(res, 200, {
                provider: 'api',
                apiBaseUrl: '',
                storeId: EASYSTORE_STORE_ID,
                supabaseConfigured: hasValidSupabaseConfig(),
                openaiConfigured: Boolean(OPENAI_API_KEY),
                payments: getPaymentRuntimeConfig(),
                ncm: ncmStatus
            });
        }

        if (url.pathname === '/api/payments/config' && req.method === 'GET') {
            return sendJson(res, 200, getPaymentRuntimeConfig());
        }

        if (url.pathname === '/api/payments/admin-config' && req.method === 'GET') {
            return sendJson(res, 200, getPaymentAdminConfig());
        }

        if (url.pathname === '/api/payments/admin-config' && req.method === 'PUT') {
            const body = await readJsonBody(req);
            const result = savePaymentProviderConfig(body);
            return sendJson(res, 200, result);
        }

        if (url.pathname === '/api/payments/transaction' && req.method === 'POST') {
            const body = await readJsonBody(req);
            const result = await processIntegratedPayment(body);
            return sendJson(res, 200, result);
        }

        if (url.pathname === '/api/ncm/search' && req.method === 'GET') {
            const term = (url.searchParams.get('term') || '').trim();
            const keywords = (url.searchParams.get('keywords') || '').trim();
            const category = (url.searchParams.get('category') || '').trim().toLowerCase();
            const code = (url.searchParams.get('code') || '').trim();
            const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 10), 1), 20);

            if (!term && !keywords && !code) {
                return sendJson(res, 400, { error: 'term, keywords ou code obrigatorio.' });
            }

            const results = await searchOfficialNcm({ term, keywords, category, code, limit });
            return sendJson(res, 200, {
                source: getNcmCacheStatus().source,
                updatedAtLabel: getNcmCacheStatus().updatedAtLabel,
                count: results.length,
                items: results
            });
        }

        if (url.pathname === '/api/ncm/import-local' && req.method === 'POST') {
            if (!hasValidSupabaseConfig()) {
                return sendJson(res, 500, {
                    error: 'Backend sem configuracao valida do Supabase para importar a base de NCM.'
                });
            }

            const result = await ensureNcmSupabaseSync({ force: true, reason: 'manual' });
            return sendJson(res, 200, result);
        }

        if (url.pathname === '/api/ncm/validate' && req.method === 'POST') {
            const body = await readJsonBody(req);
            const product = {
                nome: (body?.nome || '').trim(),
                categoria: (body?.categoria || '').trim().toLowerCase(),
                ncm: formatNcmCode(body?.ncm || ''),
                descricao: (body?.descricao || '').trim()
            };

            if (!product.nome || !product.ncm) {
                return sendJson(res, 400, { error: 'nome e ncm obrigatorios.' });
            }

            const officialNcm = await findOfficialNcmByCode(product.ncm);
            if (!officialNcm) {
                return sendJson(res, 404, { error: 'NCM nao encontrado na base oficial da Receita Federal.' });
            }

            const heuristic = buildHeuristicNcmAssessment(product, officialNcm);
            let ai;

            if (!OPENAI_API_KEY) {
                ai = {
                    available: false,
                    status: 'nao_configurado',
                    reason: 'OPENAI_API_KEY nao configurada no backend.'
                };
            } else {
                try {
                    ai = await validateNcmWithOpenAI(product, officialNcm, heuristic);
                } catch (error) {
                    ai = {
                        available: false,
                        status: error.status || 'erro',
                        code: error.code || '',
                        reason: error.userMessage || 'A validacao por IA nao ficou disponivel no momento.'
                    };
                }
            }

            const finalStatus = ai.available ? ai.verdict : heuristic.verdict;
            return sendJson(res, 200, {
                product,
                officialNcm,
                heuristic,
                ai,
                finalStatus
            });
        }

        if (url.pathname.startsWith('/api/state/')) {
            if (!hasValidSupabaseConfig()) {
                return sendJson(res, 500, {
                    error: 'Backend sem configuracao valida do Supabase. Preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY reais no arquivo .env.'
                });
            }

            const storeId = decodeURIComponent(url.pathname.replace('/api/state/', '')).trim();
            if (!storeId) {
                return sendJson(res, 400, { error: 'storeId obrigatorio.' });
            }

            if (req.method === 'GET') {
                const result = await fetchSupabaseState(storeId);
                return sendJson(res, 200, result || { storeId, payload: null, updatedAt: null });
            }

            if (req.method === 'PUT') {
                const body = await readJsonBody(req);
                if (!body || typeof body.payload !== 'object' || body.payload === null) {
                    return sendJson(res, 400, { error: 'payload obrigatorio.' });
                }

                const result = await upsertSupabaseState(storeId, body.payload);
                return sendJson(res, 200, result);
            }

            return sendJson(res, 405, { error: 'Metodo nao permitido.' });
        }

        const fileName = STATIC_FILES[url.pathname];
        if (fileName) {
            return serveStaticFile(res, path.join(__dirname, fileName));
        }

        sendJson(res, 404, {
            error: 'Rota nao encontrada.',
            path: url.pathname,
            method: req.method,
            suggestions: [
                '/api/health',
                '/api/v1/health',
                '/api/v1/fiscal/nfe/emitir (POST)',
                '/vendas',
                '/'
            ]
        });
    } catch (error) {
        console.error(error);
        sendJson(res, 500, { error: error.message || 'Erro interno.' });
    }
});

server.on('error', (error) => {
    console.error('Falha ao iniciar o servidor:', error);
});

startServer(DEFAULT_PORT);

async function fetchSupabaseState(storeId) {
    const response = await supabaseRequest(
        `/rest/v1/easy_store_state?select=store_id,payload,updated_at&store_id=eq.${encodeURIComponent(storeId)}&limit=1`
    );

    if (!Array.isArray(response) || !response.length) {
        return null;
    }

    const item = response[0];
    return {
        storeId: item.store_id,
        payload: item.payload,
        updatedAt: item.updated_at
    };
}

async function upsertSupabaseState(storeId, payload) {
    const updatedAt = new Date().toISOString();
    const body = [{
        store_id: storeId,
        payload,
        updated_at: updatedAt
    }];

    await supabaseRequest('/rest/v1/easy_store_state?on_conflict=store_id', {
        method: 'POST',
        headers: {
            Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(body)
    });

    return { ok: true, storeId, updatedAt };
}

function startServer(initialPort) {
    const preferredPort = Number.isFinite(initialPort) ? initialPort : 3000;
    listenWithFallback(preferredPort, 5);
}

function getPaymentRuntimeConfig() {
    const configuredProviders = Object.keys(getCombinedPaymentProviderConfigMap() || {});
    return {
        enabled: true,
        mode: PAYMENT_GATEWAY_MODE,
        providerName: PAYMENT_PROVIDER_NAME,
        apiBaseUrlConfigured: Boolean(PAYMENT_API_BASE_URL),
        apiKeyConfigured: Boolean(PAYMENT_API_KEY),
        configuredProviders,
        providers: PAYMENT_PROVIDER_CATALOG
    };
}

function getPaymentAdminConfig() {
    return {
        mode: PAYMENT_GATEWAY_MODE,
        providerName: PAYMENT_PROVIDER_NAME,
        configs: getCombinedPaymentProviderConfigMap()
    };
}

function createPaymentService(transaction) {
    const providerProfile = resolveProviderProfile(transaction?.terminal?.provider || PAYMENT_PROVIDER_NAME);
    const providerConfig = resolveProviderConfig(providerProfile.provider);
    const gateway = PAYMENT_GATEWAY_MODE === 'api'
        ? new HttpPaymentGateway({
            providerName: providerProfile.provider,
            baseUrl: providerConfig.baseUrl,
            apiKey: providerConfig.apiKey,
            apiSecret: providerConfig.apiSecret,
            authType: providerConfig.authType || providerProfile.http?.authType || 'bearer',
            transactionPath: providerConfig.transactionPath || providerProfile.http?.transactionPath || '/transactions',
            defaultHeaders: {
                ...(providerProfile.http?.headers || {}),
                ...(providerConfig.headers || {})
            },
            supportedTerminalModels: providerProfile.models || []
        })
        : new MockPaymentGateway({
            providerName: providerProfile.provider,
            supportedTerminalModels: providerProfile.models || []
        });

    const repository = new FileTransactionRepository(PAYMENT_LOG_PATH);
    return new PaymentService({ gateway, repository, logger: console });
}

async function processIntegratedPayment(payload) {
    const transaction = normalizePaymentPayload(payload);
    const paymentService = createPaymentService(transaction);

    try {
        const result = await paymentService.processTransaction(transaction);
        return {
            ok: true,
            status: result.status,
            approved: result.approved,
            payment: result
        };
    } catch (error) {
        if (error instanceof PaymentValidationError) {
            return {
                ok: false,
                status: 'error',
                approved: false,
                error: error.message,
                code: error.code
            };
        }

        if (error instanceof PaymentGatewayError) {
            return {
                ok: false,
                status: 'error',
                approved: false,
                error: error.message,
                code: error.code,
                details: error.details || null
            };
        }

        throw error;
    }
}

function normalizePaymentPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new PaymentValidationError('Corpo da transacao invalido.');
    }

    return {
        orderId: String(payload.orderId || `VENDA-${Date.now()}`),
        amount: Number(payload.amount || 0),
        currency: String(payload.currency || 'BRL').toUpperCase(),
        paymentMethod: normalizePaymentMethod(payload.paymentMethod),
        description: String(payload.description || 'Venda ERP/PDV EasyStore'),
        terminal: {
            provider: String(payload.terminal?.provider || PAYMENT_PROVIDER_NAME),
            model: String(payload.terminal?.model || 'Terminal virtual'),
            serialNumber: String(payload.terminal?.serialNumber || payload.terminal?.id || ''),
            connectionType: String(payload.terminal?.connectionType || 'wifi'),
            integrationMode: String(payload.terminal?.integrationMode || '')
        },
        metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
    };
}

function normalizePaymentMethod(method) {
    const value = String(method || '').trim().toLowerCase();
    if (value === 'credito') {
        return 'credit';
    }
    if (value === 'debito') {
        return 'debit';
    }
    return value;
}

function getSupportedModelsForProvider(providerName) {
    const entry = resolveProviderProfile(providerName);
    return entry ? entry.models : [];
}

function resolveProviderProfile(providerName) {
    return findPaymentProvider(providerName) || findPaymentProvider(PAYMENT_PROVIDER_NAME) || {
        provider: PAYMENT_PROVIDER_NAME,
        models: [],
        integrationMode: 'api',
        connectionTypes: ['wifi'],
        http: {
            transactionPath: '/transactions',
            authType: 'bearer',
            headers: {}
        }
    };
}

function resolveProviderConfig(providerName) {
    const mergedConfig = getCombinedPaymentProviderConfigMap();
    const namedConfig = mergedConfig?.[providerName] || mergedConfig?.[String(providerName || '').toLowerCase()] || null;
    return {
        baseUrl: normalizeBaseUrl(namedConfig?.baseUrl || PAYMENT_API_BASE_URL),
        apiKey: (namedConfig?.apiKey || PAYMENT_API_KEY || '').trim(),
        apiSecret: (namedConfig?.apiSecret || PAYMENT_API_SECRET || '').trim(),
        authType: (namedConfig?.authType || '').trim().toLowerCase(),
        transactionPath: String(namedConfig?.transactionPath || '').trim(),
        headers: namedConfig?.headers && typeof namedConfig.headers === 'object' ? namedConfig.headers : {}
    };
}

function getCombinedPaymentProviderConfigMap() {
    const fileConfig = readPaymentProviderConfigStore();
    return {
        ...(PAYMENT_PROVIDER_CONFIG_JSON || {}),
        ...(fileConfig || {})
    };
}

function readPaymentProviderConfigStore() {
    try {
        if (!fs.existsSync(PAYMENT_PROVIDER_CONFIG_PATH)) {
            return {};
        }
        const raw = fs.readFileSync(PAYMENT_PROVIDER_CONFIG_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
        return {};
    }
}

function savePaymentProviderConfig(body) {
    const provider = String(body?.provider || '').trim();
    if (!provider) {
        return {
            ok: false,
            error: 'provider obrigatorio.'
        };
    }

    const current = readPaymentProviderConfigStore();
    const next = {
        ...current,
        [provider]: {
            baseUrl: normalizeBaseUrl(body?.config?.baseUrl || ''),
            apiKey: String(body?.config?.apiKey || '').trim(),
            apiSecret: String(body?.config?.apiSecret || '').trim(),
            authType: String(body?.config?.authType || 'bearer').trim().toLowerCase(),
            transactionPath: String(body?.config?.transactionPath || '/transactions').trim() || '/transactions'
        }
    };

    fs.mkdirSync(path.dirname(PAYMENT_PROVIDER_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(PAYMENT_PROVIDER_CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');

    return {
        ok: true,
        provider,
        savedAt: new Date().toISOString()
    };
}

function parseJsonEnv(value) {
    try {
        return JSON.parse(value);
    } catch (_) {
        return {};
    }
}

function listenWithFallback(port, retriesRemaining) {
    server.listen(port, HOST, () => {
        const visibleHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
        console.log(`EasyStore rodando em http://${visibleHost}:${port}`);
        if (AUTO_SYNC_NCM_ON_STARTUP) {
            triggerNcmSupabaseSync('startup');
        }
    });

    server.once('error', (error) => {
        if (error.code === 'EADDRINUSE' && retriesRemaining > 0) {
            const nextPort = port + 1;
            console.warn(`Porta ${port} em uso. Tentando a porta ${nextPort}...`);
            listenWithFallback(nextPort, retriesRemaining - 1);
            return;
        }
    });
}

async function supabaseRequest(pathname, options = {}) {
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {
        method: options.method || 'GET',
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        body: options.body
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Supabase HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    const text = await response.text();
    if (!text) {
        return null;
    }

    return JSON.parse(text);
}

async function searchOfficialNcm({ term, keywords, category, code, limit }) {
    const normalizedTerm = normalizeText([term, keywords].filter(Boolean).join(' '));
    const productHints = getProductClassificationHints(normalizedTerm);
    const supabaseResults = await searchSupabaseNcm({ term, keywords, category, code, limit });
    if (supabaseResults.length) {
        const hasHintedSupabaseResult = !productHints.codePrefixes.length && !productHints.preferredCodes.length
            ? true
            : supabaseResults.some((item) => (
                (productHints.preferredCodes || []).includes(item.codigo)
                || (productHints.codePrefixes || []).some((prefix) => item.codigo.startsWith(prefix) || normalizeDigits(item.codigo).startsWith(normalizeDigits(prefix)))
            ));

        if (hasHintedSupabaseResult) {
            ncmCache.source = 'Banco de dados NCM no Supabase';
            return supabaseResults;
        }
    }

    const dataset = await getOfficialNcmDataset();
    const normalizedCode = normalizeDigits(code || '');
    const normalizedName = normalizeText(term);
    const normalizedKeywords = normalizeText(keywords);
    const tokens = splitSearchTokens(normalizedTerm);
    const searchTerms = expandSearchTerms(normalizedTerm, tokens);
    const keywordTokens = splitSearchTokens(normalizedKeywords);
    const keywordTerms = expandSearchTerms(normalizedKeywords, keywordTokens);
    const firstRelevantToken = (normalizedName.split(/\s+/).find(Boolean) || keywordTokens[0] || '');
    const primaryTerms = firstRelevantToken ? expandSearchTerms(firstRelevantToken, [firstRelevantToken]) : [];
    const hintedPrefixes = (productHints.codePrefixes || []).map((prefix) => normalizeDigits(prefix));
    const hintedCodes = new Set((productHints.preferredCodes || []).map((codeValue) => formatNcmCode(codeValue)));
    const ranked = dataset
        .filter((item) => {
            if (normalizedCode) {
                return item.codigoDigits.includes(normalizedCode);
            }

            if (!normalizedTerm) {
                return false;
            }

            if (item.descriptionNormalized.includes(normalizedTerm)) {
                return true;
            }

            if (searchTerms.some((searchTerm) => item.descriptionNormalized.includes(searchTerm))) {
                return true;
            }

            if (hintedCodes.has(item.codigo)) {
                return true;
            }

            return hintedPrefixes.some((prefix) => item.codigoDigits.startsWith(prefix));
        })
        .map((item) => ({
            item,
            score: scoreNcmSearch(item, normalizedTerm, normalizedCode, category, tokens, searchTerms, primaryTerms, keywordTerms, productHints)
        }))
        .filter(({ score }) => score > 0);

    const categoryHints = CATEGORY_CHAPTER_HINTS[category] || [];
    const categoryRanked = categoryHints.length
        ? ranked.filter(({ item }) => categoryHints.includes(item.codigoDigits.slice(0, 2)))
        : [];

    const finalRanked = prioritizeHintedResults(categoryRanked.length ? categoryRanked : ranked, productHints)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ item, score }) => ({
            codigo: item.codigo,
            descricao: item.descricao,
            descricaoConcatenada: item.descricaoConcatenada,
            dataInicio: item.dataInicio,
            dataFim: item.dataFim,
            score
        }));

    return finalRanked;
}

async function findOfficialNcmByCode(code) {
    const normalizedCode = normalizeDigits(code);
    if (!normalizedCode) {
        return null;
    }

    const supabaseItem = await findSupabaseNcmByCode(normalizedCode);
    if (supabaseItem) {
        ncmCache.source = 'Banco de dados NCM no Supabase';
        return supabaseItem;
    }

    const dataset = await getOfficialNcmDataset();
    const item = dataset.find((entry) => entry.codigoDigits === normalizedCode);

    if (!item) {
        return null;
    }

    return {
        codigo: item.codigo,
        descricao: item.descricao,
        descricaoConcatenada: item.descricaoConcatenada,
        dataInicio: item.dataInicio,
        dataFim: item.dataFim
    };
}

async function searchSupabaseNcm({ term, keywords, category, code, limit }) {
    if (!hasValidSupabaseConfig()) {
        return [];
    }

    try {
        const normalizedCode = normalizeDigits(code || '');
        const normalizedName = normalizeText(term);
        const normalizedKeywords = normalizeText(keywords);
        const normalizedTerm = normalizeText([term, keywords].filter(Boolean).join(' '));
        const tokens = splitSearchTokens(normalizedTerm);
        const searchTerms = expandSearchTerms(normalizedTerm, tokens);
        const keywordTokens = splitSearchTokens(normalizedKeywords);
        const keywordTerms = expandSearchTerms(normalizedKeywords, keywordTokens);
        const firstRelevantToken = (normalizedName.split(/\s+/).find(Boolean) || keywordTokens[0] || '');
        const primaryTerms = firstRelevantToken ? expandSearchTerms(firstRelevantToken, [firstRelevantToken]) : [];
        const productHints = getProductClassificationHints(normalizedTerm);
        const hintedPrefixes = (productHints.codePrefixes || []).map((prefix) => normalizeDigits(prefix));
        const hintedCodes = (productHints.preferredCodes || []).map((codeValue) => normalizeDigits(codeValue)).filter(Boolean);
        const queryParts = [
            'select=codigo,codigo_digits,descricao,descricao_concatenada,data_inicio,data_fim,capitulo'
        ];

        if (normalizedCode) {
            queryParts.push(`codigo_digits=like.${encodeURIComponent(`*${normalizedCode}*`)}`);
        } else if (searchTerms.length) {
            const orFilters = [];
            searchTerms.forEach((searchTerm) => {
                orFilters.push(`descricao_normalized.ilike.*${searchTerm}*`);
                orFilters.push(`descricao_concatenada_normalized.ilike.*${searchTerm}*`);
            });
            hintedPrefixes.forEach((prefix) => {
                orFilters.push(`codigo_digits.like.${prefix}*`);
            });
            hintedCodes.forEach((hintedCode) => {
                orFilters.push(`codigo_digits.eq.${hintedCode}`);
            });
            queryParts.push(`or=${encodeURIComponent(`(${orFilters.join(',')})`)}`);
        } else if (hintedPrefixes.length || hintedCodes.length) {
            const orFilters = [];
            hintedPrefixes.forEach((prefix) => {
                orFilters.push(`codigo_digits.like.${prefix}*`);
            });
            hintedCodes.forEach((hintedCode) => {
                orFilters.push(`codigo_digits.eq.${hintedCode}`);
            });
            queryParts.push(`or=${encodeURIComponent(`(${orFilters.join(',')})`)}`);
        } else {
            return [];
        }

        const chapterHints = [...new Set([...(CATEGORY_CHAPTER_HINTS[category] || []), ...(productHints.chapters || [])])];
        if (chapterHints.length) {
            queryParts.push(`capitulo=in.${encodeURIComponent(`(${chapterHints.join(',')})`)}`);
        }

        queryParts.push(`limit=${Math.max(limit * 12, NCM_SUPABASE_CANDIDATE_LIMIT)}`);
        const pathname = `/rest/v1/easy_store_ncm?${queryParts.join('&')}`;
        const rows = await supabaseRequest(pathname);

        if (!Array.isArray(rows) || !rows.length) {
            return [];
        }

        return prioritizeHintedResults(rows
            .map((row) => ({
                codigo: row.codigo,
                codigoDigits: row.codigo_digits,
                descricao: row.descricao,
                descricaoConcatenada: row.descricao_concatenada,
                leafDescriptionNormalized: normalizeText(row.descricao),
                descriptionNormalized: normalizeText(`${row.descricao} ${row.descricao_concatenada}`),
                dataInicio: row.data_inicio,
                dataFim: row.data_fim,
                capitulo: row.capitulo
            }))
            .map((item) => ({
                item,
                score: scoreNcmSearch(item, normalizedTerm, normalizedCode, category, tokens, searchTerms, primaryTerms, keywordTerms, productHints)
            }))
            .filter(({ score }) => score > 0), productHints)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ item, score }) => ({
                codigo: item.codigo,
                descricao: item.descricao,
                descricaoConcatenada: item.descricaoConcatenada,
                dataInicio: item.dataInicio,
                dataFim: item.dataFim,
                score
            }));
    } catch (error) {
        ncmCache.databaseAvailable = false;
        return [];
    }
}

async function findSupabaseNcmByCode(normalizedCode) {
    if (!hasValidSupabaseConfig()) {
        return null;
    }

    try {
        const rows = await supabaseRequest(
            `/rest/v1/easy_store_ncm?select=codigo,descricao,descricao_concatenada,data_inicio,data_fim&codigo_digits=eq.${normalizedCode}&limit=1`
        );

        if (!Array.isArray(rows) || !rows.length) {
            return null;
        }

        const row = rows[0];
        ncmCache.databaseAvailable = true;
        return {
            codigo: row.codigo,
            descricao: row.descricao,
            descricaoConcatenada: row.descricao_concatenada,
            dataInicio: row.data_inicio,
            dataFim: row.data_fim
        };
    } catch (error) {
        ncmCache.databaseAvailable = false;
        return null;
    }
}

async function getOfficialNcmDataset() {
    const cacheIsValid = ncmCache.items && (Date.now() - ncmCache.fetchedAt) < NCM_CACHE_TTL_MS;
    if (cacheIsValid) {
        return ncmCache.items;
    }

    const localDataset = loadLocalNcmDataset();
    if (localDataset) {
        ncmCache.items = localDataset.normalizedItems;
        ncmCache.fetchedAt = Date.now();
        ncmCache.source = `Arquivo local da Receita: ${path.basename(NCM_LOCAL_JSON_PATH)}`;
        ncmCache.updatedAtLabel = localDataset.updatedAtLabel;
        return localDataset.normalizedItems;
    }

    const response = await fetch(RECEITA_NCM_URL, {
        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Falha ao consultar a base oficial de NCM (HTTP ${response.status}).`);
    }

    const payload = await response.json();
    const remoteItems = extractNcmItems(payload);
    const normalizedItems = normalizeNcmDataset(remoteItems);

    ncmCache.items = normalizedItems;
    ncmCache.fetchedAt = Date.now();
    ncmCache.source = 'Receita Federal do Brasil / Portal Unico Siscomex';
    ncmCache.updatedAtLabel = sanitizeDescription(payload?.Data_Ultima_Atualizacao_NCM || '');
    return normalizedItems;
}

async function ensureNcmSupabaseSync({ force = false, reason = 'automatico' } = {}) {
    if (!hasValidSupabaseConfig()) {
        updateNcmSyncState({
            lastCheckedAt: new Date().toISOString(),
            status: 'supabase_nao_configurado',
            reason,
            lastError: ''
        });
        return {
            ok: false,
            skipped: true,
            reason: 'Supabase nao configurado.'
        };
    }

    if (ncmSyncState.inProgress) {
        return {
            ok: true,
            skipped: true,
            reason: 'Sincronizacao ja em andamento.'
        };
    }

    const localDataset = loadLocalNcmDataset();
    if (!localDataset) {
        updateNcmSyncState({
            lastCheckedAt: new Date().toISOString(),
            status: 'arquivo_local_ausente',
            reason,
            lastError: 'Arquivo local de NCM nao encontrado.'
        });
        throw new Error('Arquivo local de NCM nao encontrado para importacao.');
    }

    updateNcmSyncState({
        inProgress: true,
        lastCheckedAt: new Date().toISOString(),
        status: force ? 'sincronizando_forcado' : 'verificando',
        reason,
        lastError: '',
        localSignature: localDataset.signature,
        localItemCount: localDataset.normalizedItems.length,
        localUpdatedAtLabel: localDataset.updatedAtLabel
    });

    const syncMeta = await fetchNcmSyncMeta().catch(() => null);
    const isUpToDate = !force && Boolean(syncMeta)
        && syncMeta.signature === localDataset.signature
        && Number(syncMeta.itemCount || 0) === localDataset.normalizedItems.length
        && syncMeta.updatedAtLabel === localDataset.updatedAtLabel;

    if (isUpToDate) {
        updateNcmSyncState({
            inProgress: false,
            lastSyncedAt: syncMeta.syncedAt || '',
            status: 'atualizado',
            reason,
            lastError: ''
        });
        ncmCache.databaseAvailable = true;
        ncmCache.source = 'Banco de dados NCM no Supabase';
        return {
            ok: true,
            skipped: true,
            reason: 'Base NCM ja sincronizada.',
            imported: localDataset.normalizedItems.length,
            source: localDataset.fileName,
            updatedAtLabel: localDataset.updatedAtLabel,
            syncedAt: syncMeta.syncedAt || ''
        };
    }

    return importLocalNcmIntoSupabase({
        localDataset,
        reason,
        previousMeta: syncMeta,
        forced: force
    });
}

async function importLocalNcmIntoSupabase({ localDataset = null, reason = 'manual', forced = false } = {}) {
    localDataset = localDataset || loadLocalNcmDataset();
    if (!localDataset) {
        throw new Error('Arquivo local de NCM nao encontrado para importacao.');
    }

    const normalizedItems = localDataset.normalizedItems;
    const batchSize = 500;
    const syncedAt = new Date().toISOString();

    for (let index = 0; index < normalizedItems.length; index += batchSize) {
        const batch = normalizedItems.slice(index, index + batchSize).map((item) => ({
            codigo: item.codigo,
            codigo_digits: item.codigoDigits,
            capitulo: item.codigoDigits.slice(0, 2),
            descricao: item.descricao,
            descricao_concatenada: item.descricaoConcatenada,
            descricao_normalized: item.leafDescriptionNormalized,
            descricao_concatenada_normalized: item.descriptionNormalized,
            data_inicio: item.dataInicio || null,
            data_fim: item.dataFim || null,
            updated_at: new Date().toISOString()
        }));

        try {
            await supabaseRequest('/rest/v1/easy_store_ncm?on_conflict=codigo', {
                method: 'POST',
                headers: {
                    Prefer: 'resolution=merge-duplicates,return=minimal'
                },
                body: JSON.stringify(batch)
            });
        } catch (error) {
            if (error.message.includes('PGRST205') || error.message.includes('easy_store_ncm')) {
                throw new Error('A tabela easy_store_ncm ainda nao existe no Supabase. Execute o arquivo supabase.sql atualizado no SQL Editor e tente importar novamente.');
            }
            throw error;
        }
    }

    await saveNcmSyncMeta({
        signature: localDataset.signature,
        itemCount: normalizedItems.length,
        updatedAtLabel: localDataset.updatedAtLabel,
        source: localDataset.fileName,
        filePath: localDataset.filePath,
        syncedAt,
        reason,
        forced
    });

    ncmCache.databaseAvailable = true;
    ncmCache.source = 'Banco de dados NCM no Supabase';
    updateNcmSyncState({
        inProgress: false,
        lastCheckedAt: syncedAt,
        lastSyncedAt: syncedAt,
        status: 'sincronizado',
        reason,
        lastError: '',
        localSignature: localDataset.signature,
        localItemCount: normalizedItems.length,
        localUpdatedAtLabel: localDataset.updatedAtLabel
    });

    return {
        ok: true,
        imported: normalizedItems.length,
        source: localDataset.fileName,
        updatedAtLabel: localDataset.updatedAtLabel,
        syncedAt
    };
}

function loadLocalNcmDataset() {
    if (!fs.existsSync(NCM_LOCAL_JSON_PATH)) {
        return null;
    }

    const raw = fs.readFileSync(NCM_LOCAL_JSON_PATH, 'utf8');
    const payload = JSON.parse(raw);
    const normalizedItems = normalizeNcmDataset(extractNcmItems(payload));

    return {
        items: extractNcmItems(payload),
        normalizedItems,
        updatedAtLabel: sanitizeDescription(payload?.Data_Ultima_Atualizacao_NCM || ''),
        signature: crypto.createHash('sha256').update(raw).digest('hex'),
        fileName: path.basename(NCM_LOCAL_JSON_PATH),
        filePath: NCM_LOCAL_JSON_PATH
    };
}

function extractNcmItems(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.Nomenclaturas)) {
        return payload.Nomenclaturas;
    }

    throw new Error('Formato invalido da tabela de NCM.');
}

function normalizeNcmDataset(items) {
    const stack = [];
    const normalizedItems = [];

    items.forEach((item) => {
        const node = normalizeNcmNode(item);
        if (!node) {
            return;
        }

        while (stack.length && !node.codigoDigits.startsWith(stack[stack.length - 1].codigoDigits)) {
            stack.pop();
        }

        const descricaoConcatenada = [...stack.map((entry) => entry.descricao), node.descricao].join(' > ');

        if (node.codigoDigits.length === 8) {
            normalizedItems.push({
                codigo: node.codigo,
                codigoDigits: node.codigoDigits,
                descricao: node.descricao,
                descricaoConcatenada,
                leafDescriptionNormalized: normalizeText(node.descricao),
                descriptionNormalized: normalizeText(`${node.descricao} ${descricaoConcatenada}`),
                dataInicio: node.dataInicio,
                dataFim: node.dataFim
            });
        }

        stack.push({
            codigoDigits: node.codigoDigits,
            descricao: node.descricao
        });
    });

    return normalizedItems.filter((item) => isNcmCurrentlyActive(item));
}

function normalizeNcmNode(item) {
    const codigoDigits = normalizeDigits(item?.Codigo || '');
    const descricao = sanitizeDescription(item?.Descricao || '');

    if (!codigoDigits || !descricao) {
        return null;
    }

    return {
        codigo: formatCodeWithDots(codigoDigits),
        codigoDigits,
        descricao,
        dataInicio: normalizeBrDate(item?.Data_Inicio),
        dataFim: normalizeBrDate(item?.Data_Fim)
    };
}

function isNcmCurrentlyActive(item) {
    const today = new Date().toISOString().slice(0, 10);
    const startsOk = !item.dataInicio || item.dataInicio <= today;
    const endsOk = !item.dataFim || item.dataFim >= today;
    return startsOk && endsOk;
}

function scoreNcmSearch(item, normalizedTerm, normalizedCode, category, tokens, searchTerms, primaryTerms, keywordTerms = [], productHints = { chapters: [], codePrefixes: [] }) {
    let score = 0;

    if (normalizedCode) {
        if (item.codigoDigits === normalizedCode) {
            score += 1000;
        } else if (item.codigoDigits.startsWith(normalizedCode)) {
            score += 700;
        } else {
            score += 450;
        }
    }

    if (normalizedTerm) {
        if (item.descriptionNormalized === normalizedTerm) {
            score += 500;
        } else if (item.descriptionNormalized.startsWith(normalizedTerm)) {
            score += 320;
        } else if (item.descriptionNormalized.includes(normalizedTerm)) {
            score += 240;
        }

        score += tokens.filter((token) => item.descriptionNormalized.includes(token)).length * 35;
        score += searchTerms.filter((term) => item.descriptionNormalized.includes(term)).length * 28;
        score += searchTerms.filter((term) => item.leafDescriptionNormalized.includes(term)).length * 80;
        score += primaryTerms.filter((term) => item.leafDescriptionNormalized.includes(term)).length * 120;
        score += keywordTerms.filter((term) => item.descriptionNormalized.includes(term)).length * 55;
        score += keywordTerms.filter((term) => item.leafDescriptionNormalized.includes(term)).length * 95;
    }

    const chapterHints = CATEGORY_CHAPTER_HINTS[category] || [];
    if (chapterHints.includes(item.codigoDigits.slice(0, 2))) {
        score += 40;
    }

    if ((productHints.chapters || []).includes(item.codigoDigits.slice(0, 2))) {
        score += 220;
    }

    const codeWithDots = formatCodeWithDots(item.codigoDigits);
    const prefixMatched = (productHints.codePrefixes || []).some((prefix) => codeWithDots.startsWith(prefix) || item.codigoDigits.startsWith(normalizeDigits(prefix)));
    if (prefixMatched) {
        score += 1350;
    } else if ((productHints.codePrefixes || []).length) {
        score -= 280;
    }

    const preferredCodeIndex = (productHints.preferredCodes || []).indexOf(codeWithDots);
    if (preferredCodeIndex >= 0) {
        score += 1850 - (preferredCodeIndex * 120);
    }

    score += (productHints.preferredTerms || []).filter((term) => item.descriptionNormalized.includes(normalizeText(term))).length * 180;
    score -= (productHints.negativeTerms || []).filter((term) => item.descriptionNormalized.includes(normalizeText(term))).length * 190;

    return score;
}

function prioritizeHintedResults(ranked, productHints) {
    if (!Array.isArray(ranked) || !ranked.length) {
        return [];
    }

    const preferredCodes = productHints.preferredCodes || [];
    const codePrefixes = productHints.codePrefixes || [];
    const preferredCodeMatches = preferredCodes.length
        ? ranked.filter(({ item }) => preferredCodes.includes(item.codigo))
        : [];

    if (preferredCodeMatches.length) {
        const preferredSet = new Set(preferredCodeMatches.map(({ item }) => item.codigo));
        return [
            ...preferredCodeMatches,
            ...ranked.filter(({ item }) => !preferredSet.has(item.codigo))
        ];
    }

    const prefixMatches = codePrefixes.length
        ? ranked.filter(({ item }) => codePrefixes.some((prefix) => item.codigo.startsWith(prefix) || item.codigoDigits.startsWith(normalizeDigits(prefix))))
        : [];

    if (prefixMatches.length) {
        const prefixSet = new Set(prefixMatches.map(({ item }) => item.codigo));
        return [
            ...prefixMatches,
            ...ranked.filter(({ item }) => !prefixSet.has(item.codigo))
        ];
    }

    return ranked;
}

function getProductClassificationHints(normalizedTerm) {
    const hints = {
        chapters: [],
        codePrefixes: [],
        preferredCodes: [],
        preferredTerms: [],
        negativeTerms: []
    };

    PRODUCT_CLASSIFICATION_HINTS.forEach((rule) => {
        const matched = rule.patterns.some((pattern) => normalizedTerm.includes(normalizeText(pattern)));
        if (!matched) {
            return;
        }

        hints.chapters.push(...rule.chapters);
        hints.codePrefixes.push(...rule.codePrefixes);
        hints.preferredCodes.push(...(rule.preferredCodes || []));
        hints.preferredTerms.push(...(rule.preferredTerms || []));
        hints.negativeTerms.push(...(rule.negativeTerms || []));
    });

    hints.chapters = [...new Set(hints.chapters)];
    hints.codePrefixes = [...new Set(hints.codePrefixes)];
    hints.preferredCodes = [...new Set(hints.preferredCodes)];
    hints.preferredTerms = [...new Set(hints.preferredTerms)];
    hints.negativeTerms = [...new Set(hints.negativeTerms)];
    return hints;
}

function expandSearchTerms(normalizedTerm, tokens) {
    const terms = new Set();

    if (normalizedTerm) {
        const normalizedWhole = normalizeText(normalizedTerm);
        if (normalizedWhole && !SEARCH_STOPWORDS.has(normalizedWhole)) {
            terms.add(normalizedWhole);
        }
    }

    tokens.forEach((token) => {
        if (SEARCH_STOPWORDS.has(token)) {
            return;
        }
        terms.add(token);
        (SEARCH_SYNONYMS[token] || []).forEach((synonym) => terms.add(normalizeText(synonym)));
    });

    return [...terms].filter((term) => term.length >= 2);
}

function splitSearchTokens(value) {
    return normalizeText(value)
        .split(/\s+/)
        .filter((token) => token.length >= 2 && !SEARCH_STOPWORDS.has(token));
}

function buildHeuristicNcmAssessment(product, officialNcm) {
    const productTokens = tokenizeForMatch([product.nome, product.descricao].filter(Boolean).join(' '));
    const expandedProductTerms = expandSearchTerms(
        normalizeText([product.nome, product.descricao].filter(Boolean).join(' ')),
        productTokens
    );
    const overlap = expandedProductTerms.filter((term) => officialNcm.descricaoConcatenada
        ? normalizeText(officialNcm.descricaoConcatenada).includes(term)
        : normalizeText(officialNcm.descricao).includes(term));
    const overlapRatio = expandedProductTerms.length ? overlap.length / expandedProductTerms.length : 0;
    const categoryHints = CATEGORY_CHAPTER_HINTS[product.categoria] || [];
    const chapter = normalizeDigits(officialNcm.codigo).slice(0, 2);
    const categoryMatches = !categoryHints.length || categoryHints.includes(chapter);

    let verdict = 'duvida';
    if (overlapRatio >= 0.2 && categoryMatches) {
        verdict = 'coerente';
    } else if (overlapRatio <= 0.15 && !categoryMatches) {
        verdict = 'incoerente';
    }

    return {
        verdict,
        overlapRatio: Number(overlapRatio.toFixed(2)),
        categoryMatches,
        matchedTerms: overlap.slice(0, 10),
        reason: verdict === 'coerente'
            ? 'A descricao oficial tem boa aderencia ao nome informado.'
            : verdict === 'incoerente'
                ? 'Baixa aderencia textual e capitulo fiscal pouco compativel com a categoria.'
                : 'O cruzamento automatico encontrou sinais mistos e precisa de revisao humana.'
    };
}

async function validateNcmWithOpenAI(product, officialNcm, heuristic) {
    const schema = {
        type: 'object',
        additionalProperties: false,
        properties: {
            verdict: {
                type: 'string',
                enum: ['coerente', 'duvida', 'incoerente']
            },
            confidence: {
                type: 'number',
                minimum: 0,
                maximum: 1
            },
            justification: {
                type: 'string'
            },
            suggestedNcm: {
                type: 'string'
            },
            requiresHumanReview: {
                type: 'boolean'
            }
        },
        required: ['verdict', 'confidence', 'justification', 'suggestedNcm', 'requiresHumanReview']
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            input: [
                {
                    role: 'system',
                    content: [
                        {
                            type: 'input_text',
                            text: 'Voce avalia classificacao NCM de produtos no contexto brasileiro. Compare o produto cadastrado com a descricao oficial do NCM informado e responda apenas com a estrutura pedida. Seja conservador: se houver pouca evidencia, use "duvida".'
                        }
                    ]
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: JSON.stringify({
                                produto: product,
                                ncmOficial: officialNcm,
                                validacaoHeuristica: heuristic
                            })
                        }
                    ]
                }
            ],
            text: {
                format: {
                    type: 'json_schema',
                    name: 'ncm_validation',
                    schema,
                    strict: true
                }
            }
        })
    });

    if (!response.ok) {
        const rawText = await response.text();
        const apiError = parseOpenAiErrorPayload(rawText);
        const error = new Error(apiError.userMessage || `Falha ao consultar a IA de validacao (HTTP ${response.status}).`);
        error.status = apiError.status;
        error.code = apiError.code;
        error.userMessage = apiError.userMessage;
        throw error;
    }

    const payload = await response.json();
    const parsed = JSON.parse(payload.output_text || '{}');

    return {
        available: true,
        model: OPENAI_MODEL,
        ...parsed
    };
}

function serveStaticFile(res, filePath) {
    fs.readFile(filePath, (error, content) => {
        if (error) {
            sendJson(res, 500, { error: 'Falha ao carregar arquivo.' });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
    });
}

function triggerNcmSupabaseSync(reason) {
    if (!AUTO_SYNC_NCM_ON_STARTUP || !hasValidSupabaseConfig() || ncmSyncState.inProgress) {
        return;
    }

    ensureNcmSupabaseSync({ reason }).catch((error) => {
        updateNcmSyncState({
            inProgress: false,
            lastCheckedAt: new Date().toISOString(),
            status: 'erro',
            reason,
            lastError: error.message || 'Falha ao sincronizar a base NCM.'
        });
    });
}

async function fetchNcmSyncMeta() {
    const record = await fetchSupabaseState(NCM_SYNC_META_STORE_ID);
    return record?.payload || null;
}

async function saveNcmSyncMeta(payload) {
    await upsertSupabaseState(NCM_SYNC_META_STORE_ID, payload);
}

function updateNcmSyncState(patch) {
    Object.assign(ncmSyncState, patch);
}

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}

function normalizeBaseUrl(value) {
    return value.trim().replace(/\/+$/, '');
}

function getNcmCacheStatus() {
    return {
        source: ncmCache.source || (fs.existsSync(NCM_LOCAL_JSON_PATH)
            ? `Arquivo local da Receita: ${path.basename(NCM_LOCAL_JSON_PATH)}`
            : 'Receita Federal do Brasil / Portal Unico Siscomex'),
        updatedAtLabel: ncmCache.updatedAtLabel || '',
        localFilePath: fs.existsSync(NCM_LOCAL_JSON_PATH) ? NCM_LOCAL_JSON_PATH : '',
        cacheLoaded: Boolean(ncmCache.items),
        databaseAvailable: ncmCache.databaseAvailable,
        sync: {
            autoEnabled: AUTO_SYNC_NCM_ON_STARTUP,
            inProgress: ncmSyncState.inProgress,
            status: ncmSyncState.status,
            reason: ncmSyncState.reason,
            lastCheckedAt: ncmSyncState.lastCheckedAt,
            lastSyncedAt: ncmSyncState.lastSyncedAt,
            localItemCount: ncmSyncState.localItemCount,
            localUpdatedAtLabel: ncmSyncState.localUpdatedAtLabel,
            lastError: ncmSyncState.lastError
        }
    };
}

function hasValidSupabaseConfig() {
    return Boolean(
        SUPABASE_URL
        && SUPABASE_SERVICE_ROLE_KEY
        && !SUPABASE_URL.includes('seu-projeto.supabase.co')
    );
}

function parseOpenAiErrorPayload(rawText) {
    let payload = null;

    try {
        payload = JSON.parse(rawText);
    } catch (error) {
        payload = null;
    }

    const code = payload?.error?.code || '';
    const type = payload?.error?.type || '';
    const status = code || type || 'erro';

    if (code === 'insufficient_quota') {
        return {
            status,
            code,
            userMessage: 'OpenAI sem cota ou creditos no momento. A validacao continuou apenas com a base oficial e a regra local.'
        };
    }

    if (type === 'invalid_request_error') {
        return {
            status,
            code,
            userMessage: 'A OpenAI rejeitou a requisicao atual. A validacao continuou apenas com a base oficial e a regra local.'
        };
    }

    if (payload?.error?.message) {
        return {
            status,
            code,
            userMessage: `A validacao por IA falhou: ${payload.error.message}`
        };
    }

    return {
        status,
        code,
        userMessage: 'A validacao por IA nao ficou disponivel no momento. A validacao continuou apenas com a base oficial e a regra local.'
    };
}

function normalizeDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function formatNcmCode(value) {
    const digits = normalizeDigits(value).slice(0, 8);
    if (digits.length !== 8) {
        return '';
    }
    return formatCodeWithDots(digits);
}

function formatCodeWithDots(digits) {
    const raw = normalizeDigits(digits);
    if (raw.length >= 8) {
        return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
    }
    if (raw.length === 6) {
        return `${raw.slice(0, 4)}.${raw.slice(4, 6)}`;
    }
    if (raw.length === 4) {
        return `${raw.slice(0, 2)}.${raw.slice(2, 4)}`;
    }
    return raw;
}

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .trim();
}

function tokenizeForMatch(value) {
    return normalizeText(value)
        .split(/[^a-z0-9]+/i)
        .filter((token) => token.length >= 3);
}

function sanitizeDescription(value) {
    const clean = String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();
    return fixMojibake(clean);
}

function fixMojibake(value) {
    const text = String(value || '');
    if (!/[ÃÂ]/.test(text)) {
        return text;
    }

    try {
        return Buffer.from(text, 'latin1').toString('utf8');
    } catch (error) {
        return text;
    }
}

function normalizeBrDate(value) {
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
        return '';
    }
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
            if (!chunks.length) {
                resolve({});
                return;
            }

            try {
                const text = Buffer.concat(chunks).toString('utf8');
                resolve(JSON.parse(text));
            } catch (error) {
                reject(new Error('JSON invalido.'));
            }
        });
        req.on('error', reject);
    });
}

function loadEnvFile(envPath) {
    if (!fs.existsSync(envPath)) {
        return;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return;
        }

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) {
            return;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const rawValue = trimmed.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^['"]|['"]$/g, '');

        if (!process.env[key]) {
            process.env[key] = value;
        }
    });
}
