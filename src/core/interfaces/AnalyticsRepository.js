/**
 * Analytics Repository Interface
 * 
 * This file defines the contract that any analytics repository implementation must fulfill.
 * Following the Dependency Inversion Principle, domain logic will depend on this
 * interface rather than directly on database implementations.
 */

/**
 * @interface AnalyticsRepository
 */
class AnalyticsRepository {
    /**
     * Record a click event for a URL
     * @param {Object} clickData - The click data
     * @returns {Promise<Object>} - The created analytics record
     */
    async recordClick(clickData) {
      throw new Error('Method not implemented');
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
      throw new Error('Method not implemented');
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
      throw new Error('Method not implemented');
    }
  
    /**
     * Get analytics aggregated by referrer
     * @param {string} shortCode - Short code of the URL
     * @returns {Promise<Array<{referrer: string, count: number}>>} - Referrer counts
     */
    async getReferrerStats(shortCode) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Get analytics aggregated by browser
     * @param {string} shortCode - Short code of the URL
     * @returns {Promise<Array<{browser: string, count: number}>>} - Browser counts
     */
    async getBrowserStats(shortCode) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Get analytics aggregated by device type
     * @param {string} shortCode - Short code of the URL
     * @returns {Promise<Array<{device: string, count: number}>>} - Device type counts
     */
    async getDeviceStats(shortCode) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Get analytics aggregated by operating system
     * @param {string} shortCode - Short code of the URL
     * @returns {Promise<Array<{os: string, count: number}>>} - OS counts
     */
    async getOsStats(shortCode) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Get analytics aggregated by location (country)
     * @param {string} shortCode - Short code of the URL
     * @returns {Promise<Array<{country: string, count: number}>>} - Country counts
     */
    async getLocationStats(shortCode) {
      throw new Error('Method not implemented');
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
      throw new Error('Method not implemented');
    }
  
    /**
     * Delete analytics for a URL
     * @param {string} shortCode - Short code of the URL
     * @returns {Promise<boolean>} - True if deleted, false if not found
     */
    async deleteForUrl(shortCode) {
      throw new Error('Method not implemented');
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
      throw new Error('Method not implemented');
    }
  }
  
  module.exports = AnalyticsRepository;