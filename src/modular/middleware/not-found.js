function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Rota nao encontrada.',
        path: req.originalUrl,
        method: req.method,
        suggestions: [
            '/api/v1/health',
            '/api/v1/fiscal/nfe/emitir (POST)',
            '/vendas',
            '/'
        ]
    });
}

module.exports = { notFoundHandler };
