class AppError extends Error {
    constructor(message, statusCode = 400, details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Recurso nao encontrado.') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

class ValidationError extends AppError {
    constructor(message = 'Dados invalidos.', details = null) {
        super(message, 422, details);
        this.name = 'ValidationError';
    }
}

module.exports = {
    AppError,
    NotFoundError,
    ValidationError
};

