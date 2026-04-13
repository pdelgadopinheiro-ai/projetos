const express = require('express');
const { asyncHandler } = require('../../shared/async-handler');

function createFiscalRouter(controller) {
    const router = express.Router();
    router.post('/nfe/emitir', asyncHandler((req, res) => controller.emitirNfe(req, res)));
    return router;
}

module.exports = { createFiscalRouter };
