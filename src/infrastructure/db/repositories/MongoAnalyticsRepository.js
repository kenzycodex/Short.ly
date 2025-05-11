const AnalyticsRepository = require('../../../core/interfaces/AnalyticsRepository');
const AnalyticsModel = require('../models/AnalyticsModel');
const UrlModel = require('../models/UrlModel');

/**
 * MongoDB implementation of the Analytics Repository
 * 
 * This implements the AnalyticsRepository interface using MongoDB/Mongoose
 */
class MongoAnalyticsRepository extends AnalyticsRepository {
  /**
   * Record a click event for a URL
   * @param {Object} clickData - The click data
   * @returns {Promise<Object>} - The created analytics record
   */
  async recordClick(clickData) {
    try {
      // Create new analytics record
      const analytics = new AnalyticsModel(clickData);
      await analytics.save();
      
      // Also update the URL's click count for quick access
      await UrlModel.updateOne(
        { shortCode: clickData.shortCode },
        { 
          $inc: { 'metadata.totalClicks': 1 },
          $set: { 'metadata.lastAccessed': new Date() }
        }
      );
      
      return analytics.toObject();
    } catch (error) {
      console.error('Error recording click:', error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific URL
   * @param {string} shortCode - Short code of the URL
   * @param {Object} options - Query options
   * @param {number} [options.limit=100] - Maximum number of results
   * @param {number} [options.skip=0] - Number of results to skip
   * @param {string} [options.from] - Start date filter (ISO string)
   * @param {string} [options.to] - End date filter (ISO string)
   * @returns {Promise<Array<Object>>} - Array of click analytics records
   */
  async getUrlAnalytics(shortCode, { limit = 100, skip = 0, from = null, to = null } = {}) {
    try {
      // Build query
      const query = { shortCode };
      
      // Add date range if provided
      if (from || to) {
        query.timestamp = {};
        if (from) query.timestamp.$gte = new Date(from);
        if (to) query.timestamp.$lte = new Date(to);
      }
      
      // Execute query with pagination
      const analytics = await AnalyticsModel.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
      
      return analytics.map(record => record.toObject());
    } catch (error) {
      console.error('Error getting URL analytics:', error);
      throw error;
    }
  }

  /**
   * Get click count for a specific URL
   * @param {string} shortCode - Short code of the URL
   * @param {Object} options - Query options
   * @param {string} [options.from] - Start date filter (ISO string)
   * @param {string} [options.to] - End date filter (ISO string)
   * @returns {Promise<number>} - Click count
   */
  async getClickCount(shortCode, { from = null, to = null } = {}) {
    try {
      // If no date filters, try to get from URL metadata for better performance
      if (!from && !to) {
        const url = await UrlModel.findOne(
          { shortCode },
          { 'metadata.totalClicks': 1 }
        );
        
        if (url && url.metadata && typeof url.metadata.totalClicks === 'number') {
          return url.metadata.totalClicks;
        }
      }
      
      // Otherwise, count from analytics collection
      const query = { shortCode };
      
      // Add date range if provided
      if (from || to) {
        query.timestamp = {};
        if (from) query.timestamp.$gte = new Date(from);
        if (to) query.timestamp.$lte = new Date(to);
      }
      
      return await AnalyticsModel.countDocuments(query);
    } catch (error) {
      console.error('Error getting click count:', error);
      throw error;
    }
  }

  /**
   * Get analytics aggregated by referrer
   * @param {string} shortCode - Short code of the URL
   * @returns {Promise<Array<{referrer: string, count: number}>>} - Referrer counts
   */
  async getReferrerStats(shortCode) {
    try {
      const stats = await AnalyticsModel.aggregate([
        { $match: { shortCode } },
        { $group: {
            _id: '$referrer',
            count: { $sum: 1 }
          }
        },
        { $project: {
            referrer: { $ifNull: ['$_id', 'Direct/None'] },
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Replace null/empty referrers with "Direct/None"
      return stats.map(item => ({
        referrer: item.referrer || 'Direct/None',
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting referrer stats:', error);
      throw error;
    }
  }

  /**
   * Get analytics aggregated by browser
   * @param {string} shortCode - Short code of the URL
   * @returns {Promise<Array<{browser: string, count: number}>>} - Browser counts
   */
  async getBrowserStats(shortCode) {
    try {
      const stats = await AnalyticsModel.aggregate([
        { $match: { shortCode } },
        { $group: {
            _id: '$device.browser.name',
            count: { $sum: 1 }
          }
        },
        { $project: {
            browser: { $ifNull: ['$_id', 'Unknown'] },
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Replace null/empty browsers with "Unknown"
      return stats.map(item => ({
        browser: item.browser || 'Unknown',
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting browser stats:', error);
      throw error;
    }
  }

  /**
   * Get analytics aggregated by device type
   * @param {string} shortCode - Short code of the URL
   * @returns {Promise<Array<{device: string, count: number}>>} - Device type counts
   */
  async getDeviceStats(shortCode) {
    try {
      const stats = await AnalyticsModel.aggregate([
        { $match: { shortCode } },
        { $group: {
            _id: '$device.type',
            count: { $sum: 1 }
          }
        },
        { $project: {
            device: { $ifNull: ['$_id', 'Unknown'] },
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Replace null/empty devices with "Unknown"
      return stats.map(item => ({
        device: item.device || 'Unknown',
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting device stats:', error);
      throw error;
    }
  }

  /**
   * Get analytics aggregated by operating system
   * @param {string} shortCode - Short code of the URL
   * @returns {Promise<Array<{os: string, count: number}>>} - OS counts
   */
  async getOsStats(shortCode) {
    try {
      const stats = await AnalyticsModel.aggregate([
        { $match: { shortCode } },
        { $group: {
            _id: '$device.os.name',
            count: { $sum: 1 }
          }
        },
        { $project: {
            os: { $ifNull: ['$_id', 'Unknown'] },
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Replace null/empty OS with "Unknown"
      return stats.map(item => ({
        os: item.os || 'Unknown',
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting OS stats:', error);
      throw error;
    }
  }

  /**
   * Get analytics aggregated by location (country)
   * @param {string} shortCode - Short code of the URL
   * @returns {Promise<Array<{country: string, count: number}>>} - Country counts
   */
  async getLocationStats(shortCode) {
    try {
      const stats = await AnalyticsModel.aggregate([
        { $match: { shortCode } },
        { $group: {
            _id: '$location.country',
            count: { $sum: 1 }
          }
        },
        { $project: {
            country: { $ifNull: ['$_id', 'Unknown'] },
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Replace null/empty countries with "Unknown"
      return stats.map(item => ({
        country: item.country || 'Unknown',
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting location stats:', error);
      throw error;
    }
  }

  /**
   * Get time-series analytics data (clicks per day/hour)
   * @param {string} shortCode - Short code of the URL
   * @param {string} interval - Interval ('day' or 'hour')
   * @param {Object} options - Query options
   * @param {string} [options.from] - Start date filter (ISO string)
   * @param {string} [options.to] - End date filter (ISO string)
   * @returns {Promise<Array<{date: string, count: number}>>} - Time series data
   */
  async getTimeSeriesStats(shortCode, interval = 'day', { from = null, to = null } = {}) {
    try {
      // Build query
      const query = { shortCode };
      
      // Add date range if provided
      if (from || to) {
        query.timestamp = {};
        if (from) query.timestamp.$gte = new Date(from);
        if (to) query.timestamp.$lte = new Date(to);
      }
      
      // Define date format based on interval
      let dateFormat;
      if (interval === 'hour') {
        dateFormat = { 
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
      } else {
        // Default to day
        dateFormat = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
      }
      
      const stats = await AnalyticsModel.aggregate([
        { $match: query },
        { $group: {
            _id: dateFormat,
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
        { $project: {
            date: {
              $dateToString: {
                format: interval === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day',
                    hour: interval === 'hour' ? '$_id.hour' : 0
                  }
                }
              }
            },
            count: 1,
            _id: 0
          }
        }
      ]);
      
      return stats;
    } catch (error) {
      console.error('Error getting time series stats:', error);
      throw error;
    }
  }

  /**
   * Delete analytics for a URL
   * @param {string} shortCode - Short code of the URL
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async deleteForUrl(shortCode) {
    try {
      const result = await AnalyticsModel.deleteMany({ shortCode });
      
      // Reset the click count in URL metadata
      await UrlModel.updateOne(
        { shortCode },
        { 'metadata.totalClicks': 0 }
      );
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting analytics for URL:', error);
      throw error;
    }
  }

  /**
   * Get analytics for all URLs in a specified time range
   * @param {Object} options - Query options
   * @param {string} [options.from] - Start date filter (ISO string)
   * @param {string} [options.to] - End date filter (ISO string)
   * @param {number} [options.limit=100] - Maximum number of results
   * @param {number} [options.skip=0] - Number of results to skip
   * @returns {Promise<Array<Object>>} - Array of analytics data
   */
  async getAllAnalytics({ from = null, to = null, limit = 100, skip = 0 } = {}) {
    try {
      // Build query
      const query = {};
      
      // Add date range if provided
      if (from || to) {
        query.timestamp = {};
        if (from) query.timestamp.$gte = new Date(from);
        if (to) query.timestamp.$lte = new Date(to);
      }
      
      // Execute query with pagination
      const analytics = await AnalyticsModel.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
      
      return analytics.map(record => record.toObject());
    } catch (error) {
      console.error('Error getting all analytics:', error);
      throw error;
    }
  }
}

module.exports = MongoAnalyticsRepository;