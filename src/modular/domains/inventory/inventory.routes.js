const express = require('express');
const { asyncHandler } = require('../../shared/async-handler');

function createInventoryRouter(controller) {
    const router = express.Router();

    router.get('/movements', asyncHandler((req, res) => controller.listMovements(req, res)));
    router.get('/low-stock', asyncHandler((req, res) => controller.listLowStock(req, res)));
    router.post('/movements', asyncHandler((req, res) => controller.registerMovement(req, res)));

    return router;
}

module.exports = { createInventoryRouter };

