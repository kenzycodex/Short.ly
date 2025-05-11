const createError = require('http-errors');
const config = require('../../config');

/**
 * Authentication Middleware
 * 
 * Handles user authentication. This is a simplified version - in a real app,
 * you would use JWT, OAuth, or another proper authentication method.
 */
class AuthMiddleware {
  /**
   * Required authentication middleware
   * If authentication fails, it returns a 401 error
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  required(req, res, next) {
    try {
      // Get the auth token from header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(createError(401, 'Authentication required'));
      }
      
      const token = authHeader.split(' ')[1];
      
      // Validate the token - in a real app, you would verify JWT
      // Here we're simulating a simple check for demonstration purposes
      if (!token || token === 'invalid') {
        return next(createError(401, 'Invalid authentication token'));
      }
      
      // Set the user on the request - in a real app, decode from JWT
      // Here we're simulating a user for demonstration purposes
      req.user = {
        id: 'user123',
        email: 'user@example.com',
        isAdmin: token === 'admin-token'
      };
      
      next();
    } catch (error) {
      next(createError(401, 'Authentication failed'));
    }
  }

  /**
   * Optional authentication middleware
   * If authentication succeeds, it sets the user on the request
   * If authentication fails, it continues without setting the user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  optional(req, res, next) {
    try {
      // Get the auth token from header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }
      
      const token = authHeader.split(' ')[1];
      
      // Validate the token - in a real app, you would verify JWT
      if (!token || token === 'invalid') {
        return next();
      }
      
      // Set the user on the request - in a real app, decode from JWT
      req.user = {
        id: 'user123',
        email: 'user@example.com',
        isAdmin: token === 'admin-token'
      };
      
      next();
    } catch (error) {
      // Continue even if authentication fails
      next();
    }
  }

  /**
   * Admin authentication middleware
   * If authentication fails or user is not admin, it returns a 403 error
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  admin(req, res, next) {
    try {
      // First check if the user is authenticated
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(createError(401, 'Authentication required'));
      }
      
      const token = authHeader.split(' ')[1];
      
      // Validate the token - in a real app, you would verify JWT
      if (!token || token === 'invalid') {
        return next(createError(401, 'Invalid authentication token'));
      }
      
      // Set the user on the request - in a real app, decode from JWT
      const isAdmin = token === 'admin-token';
      
      if (!isAdmin) {
        return next(createError(403, 'Admin access required'));
      }
      
      req.user = {
        id: 'admin123',
        email: 'admin@example.com',
        isAdmin: true
      };
      
      next();
    } catch (error) {
      next(createError(403, 'Admin access required'));
    }
  }
}

// Export a singleton instance
module.exports = new AuthMiddleware();