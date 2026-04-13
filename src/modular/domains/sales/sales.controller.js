class SalesController {
    constructor(salesService) {
        this.salesService = salesService;
    }

    async list(req, res) {
        const items = await this.salesService.listSales({
            from: req.query.from || null,
            to: req.query.to || null,
            limit: req.query.limit || 100
        });
        res.status(200).json({ items });
    }

    async getById(req, res) {
        const sale = await this.salesService.getSaleById(req.params.saleId);
        res.status(200).json(sale);
    }

    async create(req, res) {
        const sale = await this.salesService.createSale(req.body || {});
        res.status(201).json(sale);
    }
}

module.exports = { SalesController };

