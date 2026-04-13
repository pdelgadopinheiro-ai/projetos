class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }

    async list(req, res) {
        const products = await this.productsService.listProducts({ search: req.query.search || '' });
        res.status(200).json({ items: products });
    }

    async getById(req, res) {
        const product = await this.productsService.getProductById(req.params.productId);
        res.status(200).json(product);
    }

    async create(req, res) {
        const product = await this.productsService.createProduct(req.body);
        res.status(201).json(product);
    }

    async update(req, res) {
        const product = await this.productsService.updateProduct(req.params.productId, req.body || {});
        res.status(200).json(product);
    }
}

module.exports = { ProductsController };

