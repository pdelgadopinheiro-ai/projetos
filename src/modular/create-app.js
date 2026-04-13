const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const { config } = require('./config/env');
const { StateStore } = require('./shared/state-store');
const { requestContext } = require('./middleware/request-context');
const { notFoundHandler } = require('./middleware/not-found');
const { errorHandler } = require('./middleware/error-handler');
const { ProductsRepository } = require('./domains/products/products.repository');
const { ProductsService } = require('./domains/products/products.service');
const { ProductsController } = require('./domains/products/products.controller');
const { createProductsRouter } = require('./domains/products/products.routes');
const { InventoryRepository } = require('./domains/inventory/inventory.repository');
const { InventoryService } = require('./domains/inventory/inventory.service');
const { InventoryController } = require('./domains/inventory/inventory.controller');
const { createInventoryRouter } = require('./domains/inventory/inventory.routes');
const { SalesRepository } = require('./domains/sales/sales.repository');
const { SalesService } = require('./domains/sales/sales.service');
const { SalesController } = require('./domains/sales/sales.controller');
const { createSalesRouter } = require('./domains/sales/sales.routes');
const { ReportsService } = require('./domains/reports/reports.service');
const { ReportsController } = require('./domains/reports/reports.controller');
const { createReportsRouter } = require('./domains/reports/reports.routes');
const { createFiscalModule } = require('./domains/fiscal');

function createModularApp() {
    const app = express();
    const stateStore = new StateStore(config.dataFilePath);

    const productsRepository = new ProductsRepository(stateStore);
    const productsService = new ProductsService(productsRepository, stateStore);
    const productsController = new ProductsController(productsService);

    const inventoryRepository = new InventoryRepository(stateStore);
    const inventoryService = new InventoryService(stateStore, inventoryRepository);
    const inventoryController = new InventoryController(inventoryService);

    const salesRepository = new SalesRepository(stateStore);
    const salesService = new SalesService(stateStore, salesRepository);
    const salesController = new SalesController(salesService);

    const reportsService = new ReportsService(stateStore);
    const reportsController = new ReportsController(reportsService);
    const fiscalModule = createFiscalModule({ projectRoot: config.projectRoot });

    app.disable('x-powered-by');
    app.use(express.json({ limit: '1mb' }));
    app.use(requestContext);

    app.get('/api/v1/health', async (_req, res) => {
        const state = await stateStore.read();
        res.status(200).json({
            ok: true,
            service: 'easystore-modular-api',
            updatedAt: state.meta.updatedAt,
            domains: ['products', 'inventory', 'sales', 'reports', 'fiscal']
        });
    });

    app.use('/api/v1/products', createProductsRouter(productsController));
    app.use('/api/v1/inventory', createInventoryRouter(inventoryController));
    app.use('/api/v1/sales', createSalesRouter(salesController));
    app.use('/api/v1/reports', createReportsRouter(reportsController));
    app.use('/api/v1/fiscal', fiscalModule.router);
    app.use('/api/fiscal', fiscalModule.router);

    app.get(['/vendas', '/vendas/'], async (_req, res, next) => {
        try {
            const salesHtml = await buildSalesOnlyPageFromIndex(path.join(config.projectRoot, 'index.html'));
            res.type('text/html; charset=utf-8').send(salesHtml);
        } catch (error) {
            next(error);
        }
    });

    app.get('/vendas/vendas.js', (_req, res) => {
        res.type('application/javascript').sendFile(path.join(config.projectRoot, 'src', 'modular', 'frontend', 'vendas', 'vendas.js'));
    });
    app.get('/vendas/style.css', (_req, res) => {
        res.redirect(302, '/style.css');
    });
    app.get('/vendas/app.js', (_req, res) => {
        res.redirect(302, '/app.js');
    });
    app.get('/vendas/database.js', (_req, res) => {
        res.redirect(302, '/database.js');
    });

    // Keep legacy frontend available for gradual migration.
    app.get('/', (_req, res) => {
        res.sendFile(path.join(config.projectRoot, 'index.html'));
    });
    app.get('/style.css', (_req, res) => {
        res.type('text/css').sendFile(path.join(config.projectRoot, 'style.css'));
    });
    app.get('/app.js', (_req, res) => {
        res.type('application/javascript').sendFile(path.join(config.projectRoot, 'app.js'));
    });
    app.get('/database.js', (_req, res) => {
        res.type('application/javascript').sendFile(path.join(config.projectRoot, 'database.js'));
    });

    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}

async function buildSalesOnlyPageFromIndex(indexPath) {
    let html = await fs.readFile(indexPath, 'utf8');
    html = html.replace(/^\uFEFF/, '');

    html = html.replace(
        /<link\s+rel="stylesheet"\s+href="style\.css(?:\?[^"]*)?">/,
        '<link rel="stylesheet" href="/style.css">\n    <style>\n        body.sales-only .sidebar {\n            display: none !important;\n        }\n\n        body.sales-only .main-content {\n            margin-left: 0 !important;\n            width: 100%;\n            max-width: 100%;\n        }\n\n        body.sales-only .header {\n            display: none !important;\n        }\n\n        body.sales-only #vendas .section-header {\n            display: none !important;\n        }\n\n        body.sales-only .section {\n            display: none !important;\n        }\n\n        body.sales-only #vendas.section.active {\n            display: grid !important;\n        }\n    </style>'
    );

    if (html.includes('<body>')) {
        html = html.replace('<body>', '<body class="sales-only">');
    } else if (html.includes('<body ')) {
        html = html.replace('<body ', '<body class="sales-only" ');
    }

    html = html.replace(
        '<button class="menu-btn active" data-section="dashboard">Dashboard</button>',
        '<button class="menu-btn" data-section="dashboard">Dashboard</button>'
    );
    html = html.replace(
        '<button class="menu-btn" data-section="vendas">Vendas</button>',
        '<button class="menu-btn active" data-section="vendas">Vendas</button>'
    );
    html = html.replace(
        '<h2 id="section-title">Dashboard</h2>',
        '<h2 id="section-title"></h2>'
    );
    html = html.replace(
        '<p class="header-subtitle">Controle de estoque, vendas e sincronização em nuvem.</p>',
        '<p class="header-subtitle"></p>'
    );
    html = html.replace(
        '<section id="dashboard" class="section active">',
        '<section id="dashboard" class="section">'
    );
    html = html.replace(
        '<section id="vendas" class="section">',
        '<section id="vendas" class="section active">'
    );
    html = html.replace('<h3>Frente de caixa</h3>', '');
    html = html.replace(/<p class="section-note">[\s\S]*?<\/p>/, '');
    html = html.replace('<a class="btn btn-secondary" href="/vendas">Abrir módulo de vendas separado</a>', '');

    html = html.replace('<script src="database.js"></script>', '<script src="/database.js"></script>');
    html = html.replace('<script src="app.js"></script>', '<script src="/app.js"></script>');
    return html;
}

module.exports = { createModularApp };
