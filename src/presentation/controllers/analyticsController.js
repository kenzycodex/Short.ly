const analyticsService = require('../../services/analyticsService');
const shortenerService = require('../../services/shortenerService');
const { validationResult } = require('express-validator');
const createError = require('http-errors');
const config = require('../../config');

/**
 * Analytics Controller
 * 
 * Handles HTTP requests related to analytics operations.
 */
class AnalyticsController {
  /**
   * Get analytics for a URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async getUrlAnalytics(req, res, next) {
    try {
      if (!config.analytics.enabled) {
        return next(createError(403, 'Analytics are disabled'));
      }
      
      const { shortCode } = req.params;
      const view = req.query.view || 'summary';
      
      // Validate view type
      const validViews = ['summary', 'clicks', 'referrers', 'browsers', 
                         'devices', 'os', 'locations', 'timeSeries'];
      
      if (!validViews.includes(view)) {
        return next(createError(400, `Invalid view type. Must be one of: ${validViews.join(', ')}`));
      }
      
      // Get URL details first
      const url = await shortenerService.getUrl(shortCode);
      
      if (!url) {
        return next(createError(404, 'URL not found'));
      }
      
      // Check if user has permission to view analytics for this URL
      if (url.userId && (!req.user || req.user.id !== url.userId)) {
        return next(createError(403, 'You do not have permission to view analytics for this URL'));
      }
      
      // Parse date range if provided
      const options = {};
      
      if (req.query.from) {
        options.from = req.query.from;
      }
      
      if (req.query.to) {
        options.to = req.query.to;
      }
      
      if (req.query.interval) {
        options.interval = req.query.interval;
      }
      
      // Parse pagination params if needed
      if (view === 'clicks') {
        options.limit = parseInt(req.query.limit) || 100;
        options.skip = parseInt(req.query.skip) || 0;
      }
      
      // Get analytics data
      const analyticsData = await analyticsService.getAnalytics(shortCode, view, options);
      
      // Format URL for response
      const formattedUrl = shortenerService.formatUrlForResponse(url);
      
      res.json({
        success: true,
        data: {
          url: formattedUrl,
          view,
          analytics: analyticsData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record a click event (for API use)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async recordClick(req, res, next) {
    try {
      if (!config.analytics.enabled) {
        return res.json({
          success: true,
          message: 'Analytics are disabled, but request was successful'
        });
      }
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, 'Validation error', { errors: errors.array() }));
      }
      
      const { shortCode } = req.body;
      
      // Get URL details first
      const url = await shortenerService.getUrl(shortCode);
      
      if (!url) {
        return next(createError(404, 'URL not found'));
      }
      
      // Collect request data
      const clickData = {
        shortCode,
        ip: req.body.ip || req.ip,
        userAgent: req.body.userAgent || req.get('user-agent'),
        referrer: req.body.referrer || req.get('referer') || req.get('referrer')
      };
      
      // Record click
      await analyticsService.recordClick(clickData);
      
      res.json({
        success: true,
        message: 'Click recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete analytics for a URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async deleteAnalytics(req, res, next) {
    try {
      if (!config.analytics.enabled) {
        return next(createError(403, 'Analytics are disabled'));
      }
      
      const { shortCode } = req.params;
      
      // Get URL details first
      const url = await shortenerService.getUrl(shortCode);
      
      if (!url) {
        return next(createError(404, 'URL not found'));
      }
      
      // Check if user has permission to delete analytics for this URL
      if (url.userId && (!req.user || req.user.id !== url.userId)) {
        return next(createError(403, 'You do not have permission to delete analytics for this URL'));
      }
      
      // Delete analytics
      await analyticsService.deleteAnalytics(shortCode);
      
      res.json({
        success: true,
        message: 'Analytics deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard analytics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   * @returns {Promise<void>}
   */
  async getDashboardAnalytics(req, res, next) {
    try {
      if (!config.analytics.enabled) {
        return next(createError(403, 'Analytics are disabled'));
      }
      
      // Check if user is admin
      if (!req.user || !req.user.isAdmin) {
        return next(createError(403, 'Admin access required'));
      }
      
      // Get dashboard data
      const dashboardData = await analyticsService.getDashboardAnalytics();
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export controller methods
module.exports = new AnalyticsController();