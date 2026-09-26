/**
 * Centralized error handling middleware
 * Provides consistent error response format across all endpoints
 */

export const errorHandler = (err, req, res, next) => {
  // Log error with context
  // console.error('Error:', {
  //   message: err.message,
  //   code: err.code,
  //   status: err.statusCode || 500,
  //   path: req.path,
  //   method: req.method,
  //   timestamp: new Date().toISOString(),
  //   ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  // });

  // Default error response
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid ID format';
  }

  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    message = 'Duplicate key error';
    const field = Object.keys(err.keyPattern || {})[0];
    if (field) {
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code: errorCode,
      ...(details && { details })
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 * Catches errors and passes them to error handler middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default errorHandler;
