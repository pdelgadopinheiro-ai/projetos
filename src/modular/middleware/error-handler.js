const { AppError } = require('../shared/errors');

function errorHandler(error, req, res, _next) {
    const status = error instanceof AppError
        ? error.statusCode
        : 500;

    if (status >= 500) {
        console.error(`[${req.context?.requestId || 'no-request-id'}]`, error);
    }

    res.status(status).json({
        error: error.message || 'Erro interno.',
        requestId: req.context?.requestId || null,
        details: error instanceof AppError ? (error.details || null) : null
    });
}

module.exports = { errorHandler };

