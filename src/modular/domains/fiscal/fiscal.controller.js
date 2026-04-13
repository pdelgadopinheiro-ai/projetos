class FiscalController {
    constructor(fiscalService) {
        this.fiscalService = fiscalService;
    }

    async emitirNfe(req, res) {
        const result = await this.fiscalService.emitirNotaFiscal(req.body || {});
        const statusCode = result.status === 'AUTORIZADA' ? 201 : 422;
        res.status(statusCode).json(result);
    }
}

module.exports = { FiscalController };
