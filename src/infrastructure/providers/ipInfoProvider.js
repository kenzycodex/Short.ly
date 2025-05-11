const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');
const RedisCacheRepository = require('../cache/RedisCacheRepository');

/**
 * IP Information Provider
 * 
 * Service to fetch geolocation data from IP addresses using the ipinfo.io API.
 * Includes caching to minimize API calls for repeated IP addresses.
 */
class IpInfoProvider {
  constructor() {
    this.apiKey = config.apis.ipInfo.apiKey;
    this.baseUrl = 'https://ipinfo.io';
    this.cacheRepository = new RedisCacheRepository();
    this.cacheTtl = 30 * 24 * 60 * 60; // 30 days (IPs don't change often)
    this.logger = logger.child({ service: 'IpInfoProvider' });
  }

  /**
   * Get location information for an IP address
   * @param {string} ip - IP address
   * @returns {Promise<Object|null>} - Location data or null if unavailable
   */
  async getLocationByIp(ip) {
    if (!this.apiKey) {
      this.logger.debug('No API key configured for IP info service');
      return null;
    }
    
    // Skip for localhost or private IPs
    if (this._isPrivateIp(ip)) {
      return {
        country: 'Local',
        region: 'Local',
        city: 'Local',
        coordinates: { latitude: 0, longitude: 0 }
      };
    }
    
    try {
      // Try to get from cache first
      const cacheKey = `location:${ip}`;
      const cachedLocation = await this.cacheRepository.get(cacheKey);
      
      if (cachedLocation) {
        this.logger.debug(`IP location found in cache for ${ip}`);
        return cachedLocation;
      }
      
      // Fetch from API
      this.logger.debug(`Fetching IP location for ${ip}`);
      const response = await axios.get(`${this.baseUrl}/${ip}/json`, {
        params: { token: this.apiKey }
      });
      
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
      
      // Cache for future use
      await this.cacheRepository.set(cacheKey, location, this.cacheTtl);
      
      return location;
    } catch (error) {
      this.logger.error(`Error getting location for IP ${ip}:`, error);
      return null;
    }
  }

  /**
   * Check if an IP address is private/local
   * @param {string} ip - IP address to check
   * @returns {boolean} - True if IP is private/local
   * @private
   */
  _isPrivateIp(ip) {
    return ip === '127.0.0.1' || 
           ip === 'localhost' || 
           ip.startsWith('192.168.') || 
           ip.startsWith('10.') || 
           ip.startsWith('172.16.') ||
           ip === '::1';
  }

  /**
   * Get enriched request info including geolocation
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} - Request info with geolocation
   */
  async enrichRequestInfo(req) {
    const ip = this._getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers.referer || req.headers.referrer;
    
    // Get location information
    const location = await this.getLocationByIp(ip);
    
    return {
      ip,
      userAgent,
      referrer,
      location
    };
  }

  /**
   * Get client IP from request
   * @param {Object} req - Express request object
   * @returns {string} - Client IP address
   * @private
   */
  _getClientIp(req) {
    // Get IP from various headers
    const forwardedFor = req.headers['x-forwarded-for'];
    
    if (forwardedFor) {
      // Get the first IP if multiple are listed
      return forwardedFor.split(',')[0].trim();
    }
    
    return req.ip || req.connection.remoteAddress || '127.0.0.1';
  }
}

// Export a singleton instance
module.exports = new IpInfoProvider();