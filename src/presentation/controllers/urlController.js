const shortenerService = require('../../services/shortenerService');
const analyticsService = require('../../services/analyticsService');
const lambdaService = require('../../services/lambdaService');
const config = require('../../config');
const { body, validationResult } = require('express-validator');
const createError = require('http-errors');

/**
 * URL Controller
 * 
 * Handles HTTP requests related to URL operations.
 */
class UrlController {
  /**
   * Create a new short URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async createShortUrl(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, 'Validation error', { errors: errors.array() }));
      }
      
      const { originalUrl, customAlias, expiresAt } = req.body;
      
      // Get user ID if authenticated
      const userId = req.user ? req.user.id : null;
      
      // Create short URL
      const url = await shortenerService.shortenUrl({
        originalUrl,
        customAlias,
        userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });
      
      // Format response
      const formattedUrl = shortenerService.formatUrlForResponse(url);
      
      res.status(201).json({
        success: true,
        data: formattedUrl
      });
    } catch (error) {
      // Handle specific errors
      if (error.message && error.message.includes('Custom alias already in use')) {
        return next(createError(409, error.message));
      }
      
      if (error.message && error.message.includes('Invalid custom alias')) {
        return next(createError(400, error.message));
      }
      
      next(error);
    }
  }

  /**
   * Redirect to the original URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async redirectToUrl(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      // Check if we should use Lambda for redirection
      if (lambdaService.isLambdaRedirectEnabled()) {
        // Collect request data for Lambda
        const requestContext = {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          referrer: req.get('referer') || req.get('referrer')
        };
        
        // Invoke Lambda for redirection
        const lambdaResponse = await lambdaService.invokeRedirect(shortCode, requestContext);
        
        if (lambdaResponse.originalUrl) {
          return res.redirect(302, lambdaResponse.originalUrl);
        } else {
          return next(createError(404, 'Short URL not found'));
        }
      } else {
        // Handle redirection directly
        
        // Collect request data for analytics
        const requestData = {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          referrer: req.get('referer') || req.get('referrer')
        };
        
        // Resolve URL
        try {
          const originalUrl = await shortenerService.resolveUrl(shortCode, requestData);
          return res.redirect(302, originalUrl);
        } catch (error) {
          if (error.message.includes('URL not found')) {
            return next(createError(404, 'Short URL not found'));
          }
          
          if (error.message.includes('deactivated')) {
            return next(createError(410, 'This link has been deactivated'));
          }
          
          if (error.message.includes('expired')) {
            return next(createError(410, 'This link has expired'));
          }
          
          throw error;
        }
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve a short URL without redirecting
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async resolveUrl(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      // Get URL details
      const url = await shortenerService.getUrl(shortCode);
      
      if (!url) {
        return next(createError(404, 'Short URL not found'));
      }
      
      if (!url.isActive) {
        return next(createError(410, 'This link has been deactivated'));
      }
      
      if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
        return next(createError(410, 'This link has expired'));
      }
      
      // Format response
      const formattedUrl = shortenerService.formatUrlForResponse(url);
      
      res.json({
        success: true,
        data: {
          originalUrl: formattedUrl.originalUrl,
          shortCode: formattedUrl.shortCode,
          shortUrl: formattedUrl.shortUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a URL by its short code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async getUrl(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      // Get URL details
      const url = await shortenerService.getUrl(shortCode);
      
      if (!url) {
        return next(createError(404, 'Short URL not found'));
      }
      
      // Check if user has permission to view this URL
      if (url.userId && (!req.user || req.user.id !== url.userId)) {
        return next(createError(403, 'You do not have permission to view this URL'));
      }
      
      // Format response
      const formattedUrl = shortenerService.formatUrlForResponse(url);
      
      res.json({
        success: true,
        data: formattedUrl
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async updateUrl(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, 'Validation error', { errors: errors.array() }));
      }
      
      const { shortCode } = req.params;
      const { isActive, expiresAt } = req.body;
      
      // Get URL details
      const url = await shortenerService.getUrl(shortCode);
      
      if (!url) {
        return next(createError(404, 'Short URL not found'));
      }
      
      // Check if user has permission to update this URL
      if (url.userId && (!req.user || req.user.id !== url.userId)) {
        return next(createError(403, 'You do not have permission to update this URL'));
      }
      
      // Prepare update data
      const updateData = {};
      
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }
      
      if (expiresAt !== undefined) {
        updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }
      
      // Update URL
      const updatedUrl = await shortenerService.updateUrl(shortCode, updateData);
      
      // Format response
      const formattedUrl = shortenerService.formatUrlForResponse(updatedUrl);
      
      res.json({
        success: true,
        data: formattedUrl
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async deleteUrl(req, res, next) {
    try {
      const { shortCode } = req.params;
      
      // Get URL details
      const url = await shortenerService.getUrl(shortCode);
      
      if (!url) {
        return next(createError(404, 'Short URL not found'));
      }
      
      // Check if user has permission to delete this URL
      if (url.userId && (!req.user || req.user.id !== url.userId)) {
        return next(createError(403, 'You do not have permission to delete this URL'));
      }
      
      // Delete URL
      await shortenerService.deleteUrl(shortCode);
      
      // Delete analytics
      await analyticsService.deleteAnalytics(shortCode);
      
      res.json({
        success: true,
        message: 'URL deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all URLs (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async getAllUrls(req, res, next) {
    try {
      // Check if user is admin
      if (!req.user || !req.user.isAdmin) {
        return next(createError(403, 'Admin access required'));
      }
      
      // Parse pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // Build filter
      const filter = {};
      
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }
      
      // Get URLs
      const result = await shortenerService.getAllUrls({ page, limit, filter });
      
      // Format response
      const formattedUrls = result.urls.map(url => shortenerService.formatUrlForResponse(url));
      
      res.json({
        success: true,
        data: {
          urls: formattedUrls,
          pagination: {
            totalCount: result.totalCount,
            page: result.page,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's URLs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async getUserUrls(req, res, next) {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return next(createError(401, 'Authentication required'));
      }
      
      // Parse pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // Get URLs
      const result = await shortenerService.getUserUrls(req.user.id, { page, limit });
      
      // Format response
      const formattedUrls = result.urls.map(url => shortenerService.formatUrlForResponse(url));
      
      res.json({
        success: true,
        data: {
          urls: formattedUrls,
          pagination: {
            totalCount: result.totalCount,
            page: result.page,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if a custom alias is available
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async checkAliasAvailability(req, res, next) {
    try {
      const { alias } = req.params;
      
      // Check alias availability
      const isAvailable = await shortenerService.isAliasAvailable(alias);
      
      res.json({
        success: true,
        data: {
          alias,
          isAvailable
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export controller methods
module.exports = new UrlController();