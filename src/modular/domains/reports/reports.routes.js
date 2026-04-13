const express = require('express');
const { asyncHandler } = require('../../shared/async-handler');

function createReportsRouter(controller) {
    const router = express.Router();

    router.get('/sales-summary', asyncHandler((req, res) => controller.salesSummary(req, res)));
    router.get('/top-products', asyncHandler((req, res) => controller.topProducts(req, res)));
    router.get('/inventory-snapshot', asyncHandler((req, res) => controller.inventorySnapshot(req, res)));

    return router;
}

module.exports = { createReportsRouter };

