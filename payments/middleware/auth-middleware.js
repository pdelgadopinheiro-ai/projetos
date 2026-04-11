/**
 * Authentication Middleware
 * Valida token/API key nas requisições
 */

class AuthMiddleware {
  /**
   * Valida API Key no header Authorization
   * Espera: Authorization: Bearer sk_test_123456
   */
  static validateApiKey(allowedKeys = []) {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Authorization header não encontrado',
        });
      }

      const [scheme, token] = authHeader.split(' ');

      if (scheme !== 'Bearer') {
        return res.status(401).json({
          success: false,
          error: 'Esquema de autenticação inválido. Use: Bearer <token>',
        });
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token não fornecido',
        });
      }

      // Validar token contra lista permitida (ou JWT)
      if (allowedKeys.length > 0 && !allowedKeys.includes(token)) {
        return res.status(403).json({
          success: false,
          error: 'Token inválido',
        });
      }

      // Token válido, continuar
      req.apiKey = token;
      next();
    };
  }

  /**
   * Middleware de erro 404
   */
  static notFound(req, res) {
    return res.status(404).json({
      success: false,
      error: 'Rota não encontrada',
      path: req.path,
      method: req.method,
    });
  }

  /**
   * Middleware de erro global
   */
  static errorHandler(err, req, res, next) {
    console.error('❌ Erro não tratado:', err);

    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Erro interno do servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  /**
   * CORS e headers de segurança
   */
  static setupSecurityHeaders(req, res, next) {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // CORS
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  }

  /**
   * Valida Content-Type
   */
  static validateContentType(req, res, next) {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (!req.is('application/json')) {
        return res.status(415).json({
          success: false,
          error: 'Content-Type deve ser application/json',
        });
      }
    }
    next();
  }

  /**
   * Registra requisições (logging)
   */
  static requestLogger(req, res, next) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusEmoji = res.statusCode >= 400 ? '❌' : '✅';
      
      console.log(
        `${statusEmoji} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
      );
    });

    next();
  }

  /**
   * Rate limiting simples (por IP)
   */
  static rateLimit(maxRequests = 100, windowMs = 60000) {
    const requests = new Map();

    return (req, res, next) => {
      const ip = req.ip;
      const now = Date.now();
      const key = `${ip}:${Math.floor(now / windowMs)}`;

      const count = requests.get(key) || 0;

      if (count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Muitas requisições. Tente novamente depois',
          retryAfter: windowMs / 1000,
        });
      }

      requests.set(key, count + 1);

      // Limpar dados antigos periodicamente
      if (Math.random() < 0.01) {
        const threshold = now - windowMs * 2;
        for (const [k] of requests) {
          const storedTime = parseInt(k.split(':')[1], 10) * windowMs;
          if (storedTime < threshold) {
            requests.delete(k);
          }
        }
      }

      next();
    };
  }
}

module.exports = AuthMiddleware;
