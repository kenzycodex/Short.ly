const GetUrlAnalytics = require('../core/use-cases/GetUrlAnalytics');
const MongoUrlRepository = require('../infrastructure/db/repositories/MongoUrlRepository');
const MongoAnalyticsRepository = require('../infrastructure/db/repositories/MongoAnalyticsRepository');
const RedisCacheRepository = require('../infrastructure/cache/RedisCacheRepository');
const axios = require('axios');
const UAParser = require('ua-parser-js');
const config = require('../config');
const Analytics = require('../core/entities/Analytics');

/**
 * Analytics Service
 * 
 * Service for handling analytics operations.
 * This service is a facade over the use cases and repositories.
 */
class AnalyticsService {
  constructor() {
    this.urlRepository = new MongoUrlRepository();
    this.analyticsRepository = new MongoAnalyticsRepository();
    this.cacheRepository = new RedisCacheRepository();
    
    // Initialize use cases
    this.getUrlAnalytics = new GetUrlAnalytics({
      urlRepository: this.urlRepository,
      analyticsRepository: this.analyticsRepository,
      cacheRepository: this.cacheRepository,
    });
    
    // IP info API settings
    this.ipInfoApiKey = config.apis.ipInfo.apiKey;
    this.analyticsEnabled = config.analytics.enabled;
  }

  /**
   * Record a click event for a URL
   * @param {Object} clickData - Click data
   * @param {string} clickData.shortCode - Short code of the URL
   * @param {string} clickData.ip - IP address of the visitor
   * @param {string} [clickData.userAgent] - User agent string
   * @param {string} [clickData.referrer] - Referrer URL
   * @returns {Promise<Object>} - Recorded analytics data
   */
  async recordClick({ shortCode, ip, userAgent, referrer }) {
    // Skip if analytics are disabled
    if (!this.analyticsEnabled) {
      return null;
    }
    
    try {
      // Parse user agent
      const device = this._parseUserAgent(userAgent);
      
      // Get location data from IP (if API key is configured)
      const location = await this._getLocationFromIp(ip);
      
      // Create analytics entity
      const analytics = new Analytics({
        shortCode,
        ip,
        referrer,
        userAgent,
        device,
        location,
        timestamp: new Date()
      });
      
      // Record the click
      return await this.analyticsRepository.recordClick(analytics.toObject());
    } catch (error) {
      console.error('Error recording click:', error);
      // Don't throw to prevent impacting the main redirection flow
      return null;
    }
  }

  /**
   * Get analytics for a URL
   * @param {string} shortCode - Short code of the URL
   * @param {string} [view='summary'] - Analytics view type
   * @param {Object} [options] - Query options
   * @returns {Promise<Object>} - Analytics data
   */
  async getAnalytics(shortCode, view = 'summary', options = {}) {
    // Skip if analytics are disabled
    if (!this.analyticsEnabled) {
      return { error: 'Analytics are disabled' };
    }
    
    return await this.getUrlAnalytics.execute({ shortCode, view, options });
  }

  /**
   * Delete analytics for a URL
   * @param {string} shortCode - Short code of the URL
   * @returns {Promise<boolean>} - True if deleted
   */
  async deleteAnalytics(shortCode) {
    // Skip if analytics are disabled
    if (!this.analyticsEnabled) {
      return false;
    }
    
    // Delete analytics
    const deleted = await this.analyticsRepository.deleteForUrl(shortCode);
    
    // Clear cache
    if (deleted) {
      await this.cacheRepository.clear(`analytics:${shortCode}:*`);
    }
    
    return deleted;
  }

  /**
   * Get dashboard analytics data
   * @returns {Promise<Object>} - Dashboard analytics data
   */
  async getDashboardAnalytics() {
    // Skip if analytics are disabled
    if (!this.analyticsEnabled) {
      return { error: 'Analytics are disabled' };
    }
    
    // Try to get from cache first
    const cacheKey = 'analytics:dashboard';
    const cachedData = await this.cacheRepository.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Get total URLs count
      const totalUrls = await this.urlRepository.count();
      
      // Get recent analytics data
      const recentAnalytics = await this.analyticsRepository.getAllAnalytics({
        limit: 10,
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
      });
      
      // Get top performing URLs
      const topUrls = await this._getTopPerformingUrls();
      
      // Compile dashboard data
      const dashboardData = {
        totalUrls,
        recentClicks: recentAnalytics.length,
        topUrls,
        lastUpdated: new Date()
      };
      
      // Cache for 1 hour
      await this.cacheRepository.set(cacheKey, dashboardData, 3600);
      
      return dashboardData;
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Parse user agent string
   * @param {string} userAgent - User agent string
   * @returns {Object} - Device information
   * @private
   */
  _parseUserAgent(userAgent) {
    if (!userAgent) {
      return {
        browser: { name: 'Unknown', version: null },
        os: { name: 'Unknown', version: null },
        type: 'unknown'
      };
    }
    
    // Use ua-parser-js to parse user agent
    const parser = new UAParser(userAgent);
    const browserInfo = parser.getBrowser();
    const osInfo = parser.getOS();
    const deviceInfo = parser.getDevice();
    
    // Determine device type
    let deviceType = 'desktop';
    if (deviceInfo.type === 'mobile') deviceType = 'mobile';
    if (deviceInfo.type === 'tablet') deviceType = 'tablet';
    
    return {
      browser: {
        name: browserInfo.name || 'Unknown',
        version: browserInfo.version || null,
      },
      os: {
        name: osInfo.name || 'Unknown',
        version: osInfo.version || null,
      },
      type: deviceType
    };
  }

  /**
   * Get location information from IP address
   * @param {string} ip - IP address
   * @returns {Promise<Object|null>} - Location info or null
   * @private
   */
  async _getLocationFromIp(ip) {
    // Skip if no API key configured
    if (!this.ipInfoApiKey) {
      return null;
    }
    
    // Skip for localhost or private IPs
    if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Local',
        region: 'Local',
        city: 'Local',
        coordinates: { latitude: 0, longitude: 0 }
      };
    }
    
    try {
      // Try cache first
      const cacheKey = `location:${ip}`;
      const cachedLocation = await this.cacheRepository.get(cacheKey);
      if (cachedLocation) {
        return cachedLocation;
      }
      
      // Call IP info API
      const response = await axios.get(`https://ipinfo.io/${ip}/json`, {
        params: { token: this.ipInfoApiKey }
      });
      
      // Extract location data
      const data = response.data;
      
      // Parse coordinates
      let coordinates = { latitude: null, longitude: null };
      if (data.loc) {
        const [latitude, longitude] = data.loc.split(',').map(coord => parseFloat(coord));
        coordinates = { latitude, longitude };
      }
      
      // Format location data
      const location = {
        country: data.country,
        region: data.region,
        city: data.city,
        coordinates
      };
      
      // Cache for 30 days (IPs don't change often)
      await this.cacheRepository.set(cacheKey, location, 30 * 24 * 60 * 60);
      
      return location;
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return null;
    }
  }

  /**
   * Get top performing URLs
   * @param {number} [limit=5] - Number of top URLs to retrieve
   * @returns {Promise<Array<Object>>} - Top URLs
   * @private
   */
  async _getTopPerformingUrls(limit = 5) {
    try {
      // Find URLs with the most clicks
      const urls = await this.urlRepository.findAll({
        limit,
        filter: {},
        sort: { 'metadata.totalClicks': -1 }
      });
      
      // Format for response
      return urls.map(url => ({
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        totalClicks: url.metadata?.totalClicks || 0
      }));
    } catch (error) {
      console.error('Error getting top performing URLs:', error);
      return [];
    }
  }
}

// Export a singleton instance
module.exports = new AnalyticsService();