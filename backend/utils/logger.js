/**
 * Structured Logger — JSON Logging with Correlation IDs
 *
 * Provides structured JSON logging for Lambda functions with:
 * - Correlation ID (API Gateway requestId) in all log entries
 * - Request/response logging middleware with latency tracking
 * - Log levels per environment (debug for dev, info for prod)
 * - Consistent log format for CloudWatch Logs Insights queries
 *
 *  10.1, 10.2, 1.7
 */

// ─── Log Levels ──────────────────────────────────────────────────────────────

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ??
  (process.env.NODE_ENV === 'production' ? LOG_LEVELS.info : LOG_LEVELS.debug);

// ─── Logger Class ────────────────────────────────────────────────────────────

class Logger {
  constructor(context = {}) {
    this.context = context;
  }

  /**
   * Creates a child logger with additional context fields.
   * @param {object} additionalContext - Extra fields to include in all log entries
   * @returns {Logger}
   */
  child(additionalContext) {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Formats and writes a structured log entry.
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} data - Additional structured data
   */
  _log(level, message, data = {}) {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    };

    // Remove undefined values for cleaner output
    const cleaned = Object.fromEntries(
      Object.entries(entry).filter(([, v]) => v !== undefined)
    );

    const output = JSON.stringify(cleaned);

    switch (level) {
      case 'error':
      case 'fatal':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message, data) { this._log('debug', message, data); }
  info(message, data) { this._log('info', message, data); }
  warn(message, data) { this._log('warn', message, data); }
  error(message, data) { this._log('error', message, data); }
  fatal(message, data) { this._log('fatal', message, data); }
}

// ─── Default Logger Instance ─────────────────────────────────────────────────

const logger = new Logger({
  service: 'taskly-api',
  environment: process.env.NODE_ENV || 'development',
});

// ─── Request Logging Middleware ──────────────────────────────────────────────

/**
 * Express middleware that logs request/response with latency tracking.
 * Extracts correlation ID from headers (set by Lambda handler or API Gateway).
 *
 * Log format:
 * - Request: method, path, correlationId, userAgent, ip
 * - Response: statusCode, durationMs, contentLength
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Extract correlation ID from Lambda-injected headers
  const correlationId =
    req.headers['x-correlation-id'] ||
    req.headers['x-lambda-request-id'] ||
    req.headers['x-amzn-requestid'] ||
    generateId();

  // Attach to request for downstream use
  req.correlationId = correlationId;

  // Create request-scoped logger
  req.log = logger.child({
    correlationId,
    method: req.method,
    path: req.path,
  });

  // Log incoming request
  req.log.info('Request received', {
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection?.remoteAddress,
    contentLength: req.headers['content-length'],
  });

  // Capture response
  const originalEnd = res.end;
  res.end = function (...args) {
    const durationMs = Date.now() - startTime;

    req.log.info('Response sent', {
      statusCode: res.statusCode,
      durationMs,
      contentLength: res.getHeader('content-length'),
    });

    // Add correlation ID to response headers
    res.setHeader('X-Correlation-Id', correlationId);

    originalEnd.apply(res, args);
  };

  next();
}

// ─── Error Logging Middleware ────────────────────────────────────────────────

/**
 * Express error-handling middleware that logs errors with full context.
 * Should be registered after all routes.
 */
function errorLogger(err, req, res, next) {
  const log = req.log || logger;

  log.error('Unhandled error', {
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    code: err.code,
    statusCode: err.status || err.statusCode || 500,
    correlationId: req.correlationId,
  });

  next(err);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { Logger, logger, requestLogger, errorLogger, LOG_LEVELS };
export default logger;
