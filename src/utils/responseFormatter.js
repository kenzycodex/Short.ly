/**
 * Response Formatter
 * 
 * Utility to format API responses consistently across the application.
 * Ensures all responses follow the standard format:
 * {
 *   success: true/false,
 *   data: { ... } or error: { ... }
 * }
 */

/**
 * Format a successful response
 * @param {any} data - Response data
 * @returns {Object} - Formatted response
 */
function formatSuccess(data) {
    return {
      success: true,
      data
    };
  }
  
  /**
   * Format an error response
   * @param {string} message - Error message
   * @param {number} [status=500] - HTTP status code
   * @param {Array<Object>} [errors] - Validation errors
   * @returns {Object} - Formatted error response
   */
  function formatError(message, status = 500, errors = null) {
    const error = {
      message,
      status
    };
    
    if (errors) {
      error.errors = errors;
    }
    
    return {
      success: false,
      error
    };
  }
  
  /**
   * Format a validation error response
   * @param {Array<Object>} errors - Validation errors
   * @returns {Object} - Formatted validation error response
   */
  function formatValidationError(errors) {
    return formatError('Validation error', 400, errors);
  }
  
  /**
   * Format a not found error response
   * @param {string} [message='Resource not found'] - Error message
   * @returns {Object} - Formatted not found error response
   */
  function formatNotFound(message = 'Resource not found') {
    return formatError(message, 404);
  }
  
  /**
   * Format a forbidden error response
   * @param {string} [message='Access forbidden'] - Error message
   * @returns {Object} - Formatted forbidden error response
   */
  function formatForbidden(message = 'Access forbidden') {
    return formatError(message, 403);
  }
  
  /**
   * Format an unauthorized error response
   * @param {string} [message='Authentication required'] - Error message
   * @returns {Object} - Formatted unauthorized error response
   */
  function formatUnauthorized(message = 'Authentication required') {
    return formatError(message, 401);
  }
  
  /**
   * Format a conflict error response
   * @param {string} [message='Resource already exists'] - Error message
   * @returns {Object} - Formatted conflict error response
   */
  function formatConflict(message = 'Resource already exists') {
    return formatError(message, 409);
  }
  
  /**
   * Format a gone error response
   * @param {string} [message='Resource no longer available'] - Error message
   * @returns {Object} - Formatted gone error response
   */
  function formatGone(message = 'Resource no longer available') {
    return formatError(message, 410);
  }
  
  /**
   * Format a too many requests error response
   * @param {string} [message='Too many requests, please try again later'] - Error message
   * @returns {Object} - Formatted too many requests error response
   */
  function formatTooManyRequests(message = 'Too many requests, please try again later') {
    return formatError(message, 429);
  }
  
  /**
   * Format a server error response
   * @param {string} [message='Internal server error'] - Error message
   * @returns {Object} - Formatted server error response
   */
  function formatServerError(message = 'Internal server error') {
    return formatError(message, 500);
  }
  
  module.exports = {
    formatSuccess,
    formatError,
    formatValidationError,
    formatNotFound,
    formatForbidden,
    formatUnauthorized,
    formatConflict,
    formatGone,
    formatTooManyRequests,
    formatServerError
  };