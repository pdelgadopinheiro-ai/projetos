const crypto = require('crypto');

function requestContext(req, res, next) {
    req.context = {
        requestId: crypto.randomUUID()
    };
    res.setHeader('X-Request-Id', req.context.requestId);
    next();
}

module.exports = { requestContext };

