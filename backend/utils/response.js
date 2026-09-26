/**
 * Response utility functions for consistent API responses
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Array} details - Optional array of error details
 */
export const errorResponse = (res, message, code, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      code
    }
  };

  if (details && Array.isArray(details) && details.length > 0) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const paginatedResponse = (res, data, pagination, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
    message
  });
};

/**
 * Send created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
export const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * Send no content response (204)
 * @param {Object} res - Express response object
 */
export const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Send bad request response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Array} details - Optional error details
 */
export const badRequestResponse = (res, message = 'Bad request', details = null) => {
  return errorResponse(res, message, 'BAD_REQUEST', 400, details);
};

/**
 * Send unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 'UNAUTHORIZED', 401);
};

/**
 * Send forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 'FORBIDDEN', 403);
};

/**
 * Send not found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 'NOT_FOUND', 404);
};

/**
 * Send conflict response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const conflictResponse = (res, message = 'Conflict') => {
  return errorResponse(res, message, 'CONFLICT', 409);
};

/**
 * Send internal server error response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const internalErrorResponse = (res, message = 'Internal server error') => {
  return errorResponse(res, message, 'INTERNAL_ERROR', 500);
};

export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  internalErrorResponse
};
