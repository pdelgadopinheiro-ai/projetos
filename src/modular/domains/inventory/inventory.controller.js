class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }

    async listMovements(req, res) {
        const items = await this.inventoryService.listMovements({
            productId: req.query.productId || '',
            limit: req.query.limit || 100
        });
        res.status(200).json({ items });
    }

    async listLowStock(req, res) {
        const items = await this.inventoryService.listLowStockProducts();
        res.status(200).json({ items });
    }

    async registerMovement(req, res) {
        const result = await this.inventoryService.registerManualMovement(req.body || {});
        res.status(201).json(result);
    }
}

module.exports = { InventoryController };

