class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }

    async salesSummary(req, res) {
        const summary = await this.reportsService.getSalesSummary({
            from: req.query.from || null,
            to: req.query.to || null
        });
        res.status(200).json(summary);
    }

    async topProducts(req, res) {
        const items = await this.reportsService.getTopProducts({
            from: req.query.from || null,
            to: req.query.to || null,
            limit: req.query.limit || 10
        });
        res.status(200).json({ items });
    }

    async inventorySnapshot(req, res) {
        const snapshot = await this.reportsService.getInventorySnapshot();
        res.status(200).json(snapshot);
    }
}

module.exports = { ReportsController };

