const express = require('express');
const { asyncHandler } = require('../../shared/async-handler');

function createProductsRouter(controller) {
    const router = express.Router();

    router.get('/', asyncHandler((req, res) => controller.list(req, res)));
    router.get('/:productId', asyncHandler((req, res) => controller.getById(req, res)));
    router.post('/', asyncHandler((req, res) => controller.create(req, res)));
    router.patch('/:productId', asyncHandler((req, res) => controller.update(req, res)));

    return router;
}

module.exports = { createProductsRouter };

