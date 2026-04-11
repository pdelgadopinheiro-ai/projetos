'use strict';

const PAYMENT_PROVIDER_CATALOG = [
    buildProvider('ton', 'Ton', ['T3 Ton Turbo', 'T3 Smart Ton', 'Ton T1'], {
        integrationMode: 'smart_pos',
        connectionTypes: ['wifi', 'bluetooth'],
        description: 'Smart POS com fluxo presencial e possibilidade de app/SDK conforme credenciamento.'
    }),
    buildProvider('pagbank-bb', 'PagBank / Banco do Brasil', ['Point Pro 3', 'Point Smart 2', 'Point Mini'], {
        integrationMode: 'smart_pos',
        connectionTypes: ['wifi', 'bluetooth', 'usb'],
        description: 'POS smart e mini com integracoes que variam por parceiro.'
    }),
    buildProvider('infinitepay', 'InfinitePay', ['Infinite Smart'], {
        integrationMode: 'app_redirect',
        connectionTypes: ['wifi'],
        description: 'Geralmente exige fluxo por app/terminal homologado ou parceria especifica.'
    }),
    buildProvider('mercado-pago', 'Mercado Pago', ['Moderninha Pro 2', 'Moderninha Plus 2', 'SumUp Total'], {
        integrationMode: 'smart_pos',
        connectionTypes: ['wifi', 'bluetooth'],
        description: 'Integracao depende do produto e da documentacao/homologacao disponivel.'
    }),
    buildProvider('yelly', 'Yelly', ['Yelly Pro'], {
        integrationMode: 'smart_pos',
        connectionTypes: ['wifi'],
        description: 'Fluxo smart POS.'
    }),
    buildProvider('sumup', 'SumUp', ['SumUp Top', 'SumUp Total'], {
        integrationMode: 'api',
        connectionTypes: ['bluetooth', 'wifi'],
        description: 'Pode combinar app/SDK e integracao online conforme o terminal.'
    }),
    buildProvider('cielo', 'Cielo', ['Cielo'], {
        integrationMode: 'tef',
        connectionTypes: ['wifi', 'usb'],
        description: 'Muito usada com TEF, LIO ou APIs especificas.'
    }),
    buildProvider('getnet', 'Getnet', ['Getnet'], {
        integrationMode: 'tef',
        connectionTypes: ['wifi', 'usb'],
        description: 'Fluxo geralmente TEF/POS.'
    }),
    buildProvider('safrapay', 'SafraPay', ['SafraPay'], {
        integrationMode: 'tef',
        connectionTypes: ['wifi', 'usb'],
        description: 'Integracao varia conforme convenio.'
    }),
    buildProvider('aqpago', 'AqPago', ['AqPago'], {
        integrationMode: 'api',
        connectionTypes: ['wifi'],
        description: 'Gateway/API conforme credenciamento.'
    }),
    buildProvider('stone', 'Stone', ['Stone'], {
        integrationMode: 'api',
        connectionTypes: ['wifi', 'bluetooth', 'usb'],
        description: 'Pode operar com APIs, smart POS ou TEF conforme produto.'
    }),
    buildProvider('c6-pay', 'C6 Pay', ['C6 Pay'], {
        integrationMode: 'smart_pos',
        connectionTypes: ['wifi'],
        description: 'Fluxo por terminal smart.'
    }),
    buildProvider('magalupay', 'MagaluPay', ['MagaluPay'], {
        integrationMode: 'smart_pos',
        connectionTypes: ['wifi'],
        description: 'Fluxo por terminal homologado.'
    }),
    buildProvider('q2-pay', 'Q2 Pay', ['Q2 Pay'], {
        integrationMode: 'api',
        connectionTypes: ['wifi'],
        description: 'Integracao por API/gateway.'
    }),
    buildProvider('banco-pan', 'Banco Pan', ['Banco Pan'], {
        integrationMode: 'api',
        connectionTypes: ['wifi'],
        description: 'Integracao por parceiro.'
    }),
    buildProvider('rede', 'Rede', ['Rede'], {
        integrationMode: 'tef',
        connectionTypes: ['wifi', 'usb'],
        description: 'Muito usada com TEF e POS homologado.'
    }),
    buildProvider('caixa-pagamentos', 'Caixa Pagamentos', ['Caixa Pagamentos'], {
        integrationMode: 'tef',
        connectionTypes: ['wifi', 'usb'],
        description: 'Fluxo depende da adquirente/TEF homologado.'
    }),
    buildProvider('granito', 'Granito Pagamentos', ['Granito Pagamentos'], {
        integrationMode: 'api',
        connectionTypes: ['wifi'],
        description: 'Integracao por API/gateway.'
    }),
    buildProvider('cerobank', 'CERObank', ['CERObank'], {
        integrationMode: 'api',
        connectionTypes: ['wifi'],
        description: 'Integracao por API/gateway.'
    }),
    buildProvider('picpay', 'PicPay', ['PicPay'], {
        integrationMode: 'app_redirect',
        connectionTypes: ['wifi'],
        description: 'Fluxo geralmente por app, checkout ou QR.'
    }),
    buildProvider('justa', 'Justa', ['Justa'], {
        integrationMode: 'smart_pos',
        connectionTypes: ['wifi'],
        description: 'Fluxo por terminal smart.'
    }),
    buildProvider('inter-pag', 'Inter Pag', ['Inter Pag'], {
        integrationMode: 'api',
        connectionTypes: ['wifi'],
        description: 'Integracao por API/parceria.'
    }),
    buildProvider('punto', 'Punto', ['Punto'], {
        integrationMode: 'smart_pos',
        connectionTypes: ['wifi'],
        description: 'Fluxo smart POS.'
    }),
    buildProvider('sipag', 'Sipag', ['Sipag'], {
        integrationMode: 'tef',
        connectionTypes: ['wifi', 'usb'],
        description: 'Fluxo normalmente TEF/POS.'
    })
];

function buildProvider(id, provider, models, options = {}) {
    return {
        id,
        provider,
        models,
        integrationMode: options.integrationMode || 'api',
        connectionTypes: options.connectionTypes || ['wifi'],
        description: options.description || '',
        http: {
            transactionPath: options.transactionPath || '/transactions',
            authType: options.authType || 'bearer',
            headers: options.headers || {},
            statusMap: options.statusMap || {}
        }
    };
}

function getPaymentProviderCatalog() {
    return PAYMENT_PROVIDER_CATALOG.map((item) => ({
        ...item,
        models: [...item.models],
        connectionTypes: [...item.connectionTypes],
        http: {
            ...item.http,
            headers: { ...(item.http?.headers || {}) },
            statusMap: { ...(item.http?.statusMap || {}) }
        }
    }));
}

function findPaymentProvider(providerName) {
    const normalized = String(providerName || '').trim().toLowerCase();
    return PAYMENT_PROVIDER_CATALOG.find((item) => item.provider.toLowerCase() === normalized || item.id === normalized) || null;
}

module.exports = {
    PAYMENT_PROVIDER_CATALOG,
    getPaymentProviderCatalog,
    findPaymentProvider
};
