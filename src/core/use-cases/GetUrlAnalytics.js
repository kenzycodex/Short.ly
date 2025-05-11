/**
 * Get URL Analytics Use Case
 * 
 * This use case handles retrieving analytics data for a specific URL.
 * It includes caching for performance and provides various analytics views.
 */
class GetUrlAnalytics {
    /**
     * Constructor
     * @param {Object} dependencies - Dependency injection
     * @param {Object} dependencies.urlRepository - URL repository implementation
     * @param {Object} dependencies.analyticsRepository - Analytics repository implementation
     * @param {Object} dependencies.cacheRepository - Cache repository implementation
     */
    constructor({ urlRepository, analyticsRepository, cacheRepository }) {
      this.urlRepository = urlRepository;
      this.analyticsRepository = analyticsRepository;
      this.cacheRepository = cacheRepository;
    }
  
    /**
     * Execute the use case
     * @param {Object} params - Parameters
     * @param {string} params.shortCode - The short code to get analytics for
     * @param {string} [params.view='summary'] - Type of analytics to retrieve
     *   (summary, clicks, referrers, browsers, devices, locations, timeSeries)
     * @param {Object} [params.options] - Additional options
     * @param {string} [params.options.from] - Start date filter (ISO string)
     * @param {string} [params.options.to] - End date filter (ISO string)
     * @param {string} [params.options.interval='day'] - Interval for time series (day/hour)
     * @param {number} [params.options.limit=100] - Maximum number of results
     * @param {number} [params.options.skip=0] - Number of results to skip
     * @returns {Promise<Object>} - Analytics data
     */
    async execute({ shortCode, view = 'summary', options = {} }) {
      if (!shortCode) {
        throw new Error('Short code is required');
      }
      
      // First, verify the URL exists
      const urlExists = await this.urlRepository.shortCodeExists(shortCode);
      if (!urlExists) {
        throw new Error('URL not found');
      }
      
      // Set default options
      const queryOptions = {
        from: options.from || null,
        to: options.to || null,
        limit: options.limit || 100,
        skip: options.skip || 0,
        interval: options.interval || 'day'
      };
      
      // Create cache key based on parameters
      const cacheKey = this._createCacheKey(shortCode, view, queryOptions);
      
      // Try to get from cache first
      const cachedData = await this._getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Not in cache, fetch the requested analytics
      let analyticsData;
      
      switch (view) {
        case 'summary':
          analyticsData = await this._getSummary(shortCode, queryOptions);
          break;
        case 'clicks':
          analyticsData = await this.analyticsRepository.getUrlAnalytics(shortCode, queryOptions);
          break;
        case 'referrers':
          analyticsData = await this.analyticsRepository.getReferrerStats(shortCode);
          break;
        case 'browsers':
          analyticsData = await this.analyticsRepository.getBrowserStats(shortCode);
          break;
        case 'devices':
          analyticsData = await this.analyticsRepository.getDeviceStats(shortCode);
          break;
        case 'os':
          analyticsData = await this.analyticsRepository.getOsStats(shortCode);
          break;
        case 'locations':
          analyticsData = await this.analyticsRepository.getLocationStats(shortCode);
          break;
        case 'timeSeries':
          analyticsData = await this.analyticsRepository.getTimeSeriesStats(
            shortCode, 
            queryOptions.interval, 
            { from: queryOptions.from, to: queryOptions.to }
          );
          break;
        default:
          throw new Error(`Unknown analytics view: ${view}`);
      }
      
      // Cache the results (except for large datasets)
      if (view !== 'clicks' || analyticsData.length <= 100) {
        await this._cacheData(cacheKey, analyticsData);
      }
      
      return analyticsData;
    }
  
    /**
     * Get summary analytics data for a URL
     * @param {string} shortCode - Short code
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Summary data
     * @private
     */
    async _getSummary(shortCode, options) {
      const [
        clickCount,
        referrers,
        browsers,
        devices,
        locations,
        timeSeries
      ] = await Promise.all([
        this.analyticsRepository.getClickCount(shortCode, options),
        this.analyticsRepository.getReferrerStats(shortCode),
        this.analyticsRepository.getBrowserStats(shortCode),
        this.analyticsRepository.getDeviceStats(shortCode),
        this.analyticsRepository.getLocationStats(shortCode),
        this.analyticsRepository.getTimeSeriesStats(shortCode, options.interval, options)
      ]);
      
      // Get URL details
      const urlDetails = await this.urlRepository.findByShortCode(shortCode);
      
      return {
        urlDetails,
        analytics: {
          totalClicks: clickCount,
          referrers: referrers.slice(0, 5), // Top 5 referrers
          browsers: browsers.slice(0, 5),   // Top 5 browsers
          devices: devices.slice(0, 3),     // Top 3 device types
          locations: locations.slice(0, 5), // Top 5 locations
          clicksOverTime: timeSeries.slice(-14), // Last 14 data points
        }
      };
    }
  
    /**
     * Create a cache key for analytics data
     * @param {string} shortCode - Short code
     * @param {string} view - Analytics view
     * @param {Object} options - Query options
     * @returns {string} - Cache key
     * @private
     */
    _createCacheKey(shortCode, view, options) {
      const optionsHash = JSON.stringify(options);
      return `analytics:${shortCode}:${view}:${optionsHash}`;
    }
  
    /**
     * Get data from cache
     * @param {string} key - Cache key
     * @returns {Promise<Object|null>} - Cached data or null
     * @private
     */
    async _getFromCache(key) {
      try {
        return await this.cacheRepository.get(key);
      } catch (error) {
        console.error('Cache retrieval error:', error);
        return null;
      }
    }
  
    /**
     * Cache analytics data
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     * @returns {Promise<void>}
     * @private
     */
    async _cacheData(key, data) {
      try {
        // Cache analytics for a shorter time (1 hour)
        await this.cacheRepository.set(key, data, 3600);
      } catch (error) {
        // Log but don't fail if caching fails
        console.error('Cache storage error:', error);
      }
    }
  }
  
  module.exports = GetUrlAnalytics;