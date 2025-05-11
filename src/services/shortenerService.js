const CreateShortUrl = require('../core/use-cases/CreateShortUrl');
const ResolveUrl = require('../core/use-cases/ResolveUrl');
const MongoUrlRepository = require('../infrastructure/db/repositories/MongoUrlRepository');
const RedisCacheRepository = require('../infrastructure/cache/RedisCacheRepository');
const config = require('../config');

/**
 * URL Shortener Service
 * 
 * Service for handling URL shortening operations.
 * This service is a facade over the use cases and repositories.
 */
class ShortenerService {
  constructor() {
    this.urlRepository = new MongoUrlRepository();
    this.cacheRepository = new RedisCacheRepository();
    
    // Initialize use cases
    this.createShortUrl = new CreateShortUrl({
      urlRepository: this.urlRepository,
      cacheRepository: this.cacheRepository,
    });
    
    this.resolveUrl = new ResolveUrl({
      urlRepository: this.urlRepository,
      cacheRepository: this.cacheRepository,
    });
  }

  /**
   * Shorten a URL
   * @param {Object} urlData - URL data
   * @param {string} urlData.originalUrl - Original URL to shorten
   * @param {string} [urlData.customAlias] - Custom alias (optional)
   * @param {string} [urlData.userId] - User ID (if authenticated)
   * @param {Date} [urlData.expiresAt] - Expiration date (optional)
   * @returns {Promise<Object>} - Shortened URL object
   */
  async shortenUrl(urlData) {
    return await this.createShortUrl.execute(urlData);
  }

  /**
   * Resolve a short URL to its original URL
   * @param {string} shortCode - Short code to resolve
   * @param {Object} [requestData] - Optional request data for analytics
   * @returns {Promise<string>} - Original URL
   */
  async resolveUrl(shortCode, requestData = null) {
    const result = await this.resolveUrl.execute({ shortCode, requestData });
    return result.originalUrl;
  }

  /**
   * Get a URL by its short code
   * @param {string} shortCode - Short code to retrieve
   * @returns {Promise<Object|null>} - URL object or null if not found
   */
  async getUrl(shortCode) {
    return await this.urlRepository.findByShortCode(shortCode);
  }

  /**
   * Update a URL
   * @param {string} shortCode - Short code of the URL to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated URL or null if not found
   */
  async updateUrl(shortCode, updateData) {
    // Remove the shortCode from the update data to prevent changing it
    if (updateData.shortCode) {
      delete updateData.shortCode;
    }
    
    const updatedUrl = await this.urlRepository.update(shortCode, updateData);
    
    // If URL was updated, invalidate cache
    if (updatedUrl) {
      await this.cacheRepository.delete(`url:${shortCode}`);
    }
    
    return updatedUrl;
  }

  /**
   * Delete a URL
   * @param {string} shortCode - Short code of the URL to delete
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async deleteUrl(shortCode) {
    const deleted = await this.urlRepository.delete(shortCode);
    
    // If URL was deleted, remove from cache
    if (deleted) {
      await this.cacheRepository.delete(`url:${shortCode}`);
    }
    
    return deleted;
  }

  /**
   * Deactivate a URL
   * @param {string} shortCode - Short code of the URL to deactivate
   * @returns {Promise<Object|null>} - Updated URL or null if not found
   */
  async deactivateUrl(shortCode) {
    const updatedUrl = await this.urlRepository.update(shortCode, { isActive: false });
    
    // If URL was updated, invalidate cache
    if (updatedUrl) {
      await this.cacheRepository.delete(`url:${shortCode}`);
    }
    
    return updatedUrl;
  }

  /**
   * Activate a URL
   * @param {string} shortCode - Short code of the URL to activate
   * @returns {Promise<Object|null>} - Updated URL or null if not found
   */
  async activateUrl(shortCode) {
    const updatedUrl = await this.urlRepository.update(shortCode, { isActive: true });
    
    // If URL was updated, invalidate cache
    if (updatedUrl) {
      await this.cacheRepository.delete(`url:${shortCode}`);
    }
    
    return updatedUrl;
  }

  /**
   * Get all URLs
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Results per page
   * @param {Object} [options.filter={}] - Filter criteria
   * @returns {Promise<{urls: Array<Object>, totalCount: number, page: number, totalPages: number}>} - Paginated URLs
   */
  async getAllUrls({ page = 1, limit = 10, filter = {} } = {}) {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get URLs and total count in parallel
    const [urls, totalCount] = await Promise.all([
      this.urlRepository.findAll({ limit, skip, filter }),
      this.urlRepository.count(filter)
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      urls,
      totalCount,
      page,
      totalPages
    };
  }

  /**
   * Get URLs for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Results per page
   * @returns {Promise<{urls: Array<Object>, totalCount: number, page: number, totalPages: number}>} - Paginated URLs
   */
  async getUserUrls(userId, { page = 1, limit = 10 } = {}) {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get URLs and total count in parallel
    const [urls, totalCount] = await Promise.all([
      this.urlRepository.findByUser(userId, { limit, skip }),
      this.urlRepository.count({ userId })
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      urls,
      totalCount,
      page,
      totalPages
    };
  }

  /**
   * Check if a custom alias is available
   * @param {string} alias - Custom alias to check
   * @returns {Promise<boolean>} - True if available
   */
  async isAliasAvailable(alias) {
    const exists = await this.urlRepository.customAliasExists(alias);
    return !exists;
  }

  /**
   * Format a URL object for public API response
   * @param {Object} url - URL object from repository
   * @returns {Object} - Formatted URL object
   */
  formatUrlForResponse(url) {
    if (!url) return null;
    
    // Create the short URL with the domain from config
    const shortUrl = `${config.url.domain}/${url.shortCode}`;
    
    return {
      id: url._id || url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl,
      customAlias: url.customAlias,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      isActive: url.isActive,
      metadata: {
        totalClicks: url.metadata?.totalClicks || 0,
        lastAccessed: url.metadata?.lastAccessed || null
      }
    };
  }
}

// Export a singleton instance
module.exports = new ShortenerService();