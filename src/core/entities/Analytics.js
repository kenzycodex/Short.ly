/**
 * Analytics Entity Class - Core domain entity representing URL analytics
 */
class Analytics {
    /**
     * Creates a new Analytics entity
     * @param {Object} analyticsData - Analytics data
     * @param {string} analyticsData.shortCode - The associated short URL code
     * @param {string} analyticsData.ip - The visitor's IP address (can be anonymized)
     * @param {string} [analyticsData.referrer] - The referrer URL
     * @param {string} [analyticsData.userAgent] - The user agent string
     * @param {Object} [analyticsData.device] - Device information parsed from user agent
     * @param {Object} [analyticsData.location] - Geographic location derived from IP
     * @param {Date} [analyticsData.timestamp] - When the visit occurred
     */
    constructor({
      shortCode,
      ip,
      referrer = null,
      userAgent = null,
      device = null,
      location = null,
      timestamp = new Date(),
    }) {
      this.shortCode = shortCode;
      this.ip = ip;
      this.referrer = referrer;
      this.userAgent = userAgent;
      this.device = device || Analytics.parseDevice(userAgent);
      this.location = location;
      this.timestamp = timestamp;
      
      // Validate essential properties
      this._validate();
    }
  
    /**
     * Validate the analytics entity
     * @private
     */
    _validate() {
      if (!this.shortCode) {
        throw new Error('Short code is required for analytics');
      }
      
      if (!this.ip) {
        throw new Error('IP address is required for analytics');
      }
    }
  
    /**
     * Parse device information from user agent
     * @param {string} userAgent - User agent string
     * @returns {Object|null} - Device info or null if not available
     * @static
     */
    static parseDevice(userAgent) {
      if (!userAgent) return null;
      
      // This is a simplified version - in production, use ua-parser-js library
      const deviceInfo = {
        browser: Analytics.detectBrowser(userAgent),
        os: Analytics.detectOS(userAgent),
        device: Analytics.detectDeviceType(userAgent),
      };
      
      return deviceInfo;
    }
  
    /**
     * Simple browser detection (placeholder)
     * @param {string} userAgent - User agent string
     * @returns {string} - Browser name
     * @static
     * @private
     */
    static detectBrowser(userAgent) {
      // This would be replaced with proper UA parsing library
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
      return 'Unknown';
    }
  
    /**
     * Simple OS detection (placeholder)
     * @param {string} userAgent - User agent string
     * @returns {string} - OS name
     * @static
     * @private
     */
    static detectOS(userAgent) {
      // This would be replaced with proper UA parsing library
      if (userAgent.includes('Windows')) return 'Windows';
      if (userAgent.includes('Mac OS')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
      return 'Unknown';
    }
  
    /**
     * Simple device type detection (placeholder)
     * @param {string} userAgent - User agent string
     * @returns {string} - Device type
     * @static
     * @private
     */
    static detectDeviceType(userAgent) {
      // This would be replaced with proper UA parsing library
      if (userAgent.includes('Mobile')) return 'Mobile';
      if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'Tablet';
      return 'Desktop';
    }
  
    /**
     * Convert to a plain object (for persistence or serialization)
     * @returns {Object} - Plain object representation
     */
    toObject() {
      return {
        shortCode: this.shortCode,
        ip: this.ip,
        referrer: this.referrer,
        userAgent: this.userAgent,
        device: this.device,
        location: this.location,
        timestamp: this.timestamp,
      };
    }
  
    /**
     * Create an Analytics entity from a plain object (hydration)
     * @param {Object} data - Plain object data
     * @returns {Analytics} - Analytics entity instance
     */
    static fromObject(data) {
      return new Analytics({
        shortCode: data.shortCode,
        ip: data.ip,
        referrer: data.referrer,
        userAgent: data.userAgent,
        device: data.device,
        location: data.location,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      });
    }
  }
  
  module.exports = Analytics;