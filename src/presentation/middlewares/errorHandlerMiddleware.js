const createError = require('http-errors');
const config = require('../../config');

/**
 * Error Handler Middleware
 * 
 * Central error handling for the application.
 * Formats errors in a consistent way.
 */
class ErrorHandlerMiddleware {
  /**
   * Handle 404 errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  notFound(req, res, next) {
    next(createError(404, 'Resource not found'));
  }

  /**
   * Handle all errors
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  handleError(err, req, res, next) {
    // Set default status code
    const statusCode = err.status || err.statusCode || 500;
    
    // Prepare error response
    const errorResponse = {
      success: false,
      error: {
        message: err.message || 'Internal Server Error',
        status: statusCode
      }
    };
    
    // Add validation errors if present
    if (err.errors) {
      errorResponse.error.errors = err.errors;
    }
    
    // Add stack trace in development
    if (config.isDev && err.stack) {
      errorResponse.error.stack = err.stack;
    }
    
    // Log error
    this._logError(err, req);
    
    // Send response
    res.status(statusCode).json(errorResponse);
  }

  /**
   * Log error
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @private
   */
  _logError(err, req) {
    // Skip logging for 404 errors in production
    if (!config.isDev && (err.status === 404 || err.statusCode === 404)) {
      return;
    }
    
    const errorLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      status: err.status || err.statusCode || 500,
      message: err.message || 'Internal Server Error',
      stack: config.isDev ? err.stack : undefined
    };
    
    // Log error to console
    if (errorLog.status >= 500) {
      console.error('Server Error:', errorLog);
    } else {
      console.warn('Client Error:', errorLog);
    }
    
    // In a real application, you might want to log to a file or error monitoring service
  }
}

// Export error handler methods
const errorHandler = new ErrorHandlerMiddleware();
module.exports = {
  notFound: errorHandler.notFound,
  handleError: errorHandler.handleError.bind(errorHandler)
};