const express = require('express');
const { asyncHandler } = require('../../shared/async-handler');

function createSalesRouter(controller) {
    const router = express.Router();

    router.get('/', asyncHandler((req, res) => controller.list(req, res)));
    router.get('/:saleId', asyncHandler((req, res) => controller.getById(req, res)));
    router.post('/', asyncHandler((req, res) => controller.create(req, res)));

    return router;
}

module.exports = { createSalesRouter };

