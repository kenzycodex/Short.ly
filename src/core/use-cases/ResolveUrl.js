/**
 * Resolve URL Use Case
 * 
 * This use case handles resolving a short URL to its original URL.
 * It includes caching logic for performance and validation for active/expired URLs.
 */
class ResolveUrl {
    /**
     * Constructor
     * @param {Object} dependencies - Dependency injection
     * @param {Object} dependencies.urlRepository - URL repository implementation
     * @param {Object} dependencies.cacheRepository - Cache repository implementation
     * @param {Object} dependencies.analyticsService - Analytics service for tracking clicks (optional)
     */
    constructor({ urlRepository, cacheRepository, analyticsService = null }) {
      this.urlRepository = urlRepository;
      this.cacheRepository = cacheRepository;
      this.analyticsService = analyticsService;
    }
  
    /**
     * Execute the use case
     * @param {Object} params - Parameters
     * @param {string} params.shortCode - The short code to resolve
     * @param {Object} [params.requestData=null] - Optional request data for analytics
     * @returns {Promise<Object>} - Object with the original URL and URL entity
     * @throws {Error} - If URL is not found, inactive, or expired
     */
    async execute({ shortCode, requestData = null }) {
      if (!shortCode) {
        throw new Error('Short code is required');
      }
      
      // Try to get the URL from cache first for performance
      let originalUrl = await this._getFromCache(shortCode);
      let urlEntity = null;
      
      if (!originalUrl) {
        // Not in cache, fetch from repository
        urlEntity = await this.urlRepository.findByShortCode(shortCode);
        
        if (!urlEntity) {
          throw new Error('URL not found');
        }
        
        // Check if URL is active and not expired
        if (!urlEntity.isActive) {
          throw new Error('This link has been deactivated');
        }
        
        if (urlEntity.expiresAt && new Date() > new Date(urlEntity.expiresAt)) {
          throw new Error('This link has expired');
        }
        
        originalUrl = urlEntity.originalUrl;
        
        // Cache for future requests
        await this._cacheUrl(shortCode, originalUrl);
      }
      
      // Record analytics asynchronously if analytics service is provided
      if (this.analyticsService && requestData) {
        // Don't await to avoid blocking the response
        this._recordAnalytics(shortCode, requestData).catch(err => {
          console.error('Error recording analytics:', err);
        });
      }
      
      return {
        originalUrl,
        urlEntity
      };
    }
  
    /**
     * Get a URL from cache
     * @param {string} shortCode - Short code
     * @returns {Promise<string|null>} - Original URL or null if not in cache
     * @private
     */
    async _getFromCache(shortCode) {
      try {
        return await this.cacheRepository.get(`url:${shortCode}`);
      } catch (error) {
        console.error('Cache retrieval error:', error);
        return null;
      }
    }
  
    /**
     * Cache a URL
     * @param {string} shortCode - Short code
     * @param {string} originalUrl - Original URL
     * @returns {Promise<void>}
     * @private
     */
    async _cacheUrl(shortCode, originalUrl) {
      try {
        await this.cacheRepository.set(`url:${shortCode}`, originalUrl);
      } catch (error) {
        // Log but don't fail if caching fails
        console.error('Cache storage error:', error);
      }
    }
  
    /**
     * Record analytics for a click
     * @param {string} shortCode - Short code
     * @param {Object} requestData - Request data
     * @returns {Promise<void>}
     * @private
     */
    async _recordAnalytics(shortCode, requestData) {
      if (!this.analyticsService) return;
      
      try {
        await this.analyticsService.recordClick({
          shortCode,
          ip: requestData.ip,
          userAgent: requestData.userAgent,
          referrer: requestData.referrer
        });
      } catch (error) {
        // Log but don't rethrow to prevent breaking the main flow
        console.error('Analytics recording error:', error);
      }
    }
  }
  
  module.exports = ResolveUrl;