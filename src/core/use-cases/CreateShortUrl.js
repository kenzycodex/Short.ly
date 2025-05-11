const { nanoid } = require('nanoid');
const Url = require('../entities/Url');
const config = require('../../config');

/**
 * Create Short URL Use Case
 * 
 * This use case handles creating a new shortened URL from a long URL.
 * It encapsulates the business logic for URL shortening and validation.
 */
class CreateShortUrl {
  /**
   * Constructor
   * @param {Object} dependencies - Dependency injection
   * @param {Object} dependencies.urlRepository - URL repository implementation
   * @param {Object} dependencies.cacheRepository - Cache repository implementation
   */
  constructor({ urlRepository, cacheRepository }) {
    this.urlRepository = urlRepository;
    this.cacheRepository = cacheRepository;
    this.urlLength = config.url.length || 7;
  }

  /**
   * Execute the use case
   * @param {Object} urlData - URL data
   * @param {string} urlData.originalUrl - The long URL to shorten
   * @param {string} [urlData.customAlias] - Optional custom alias for the URL
   * @param {string} [urlData.userId] - Optional user ID for authentication
   * @param {Date} [urlData.expiresAt] - Optional expiration date
   * @returns {Promise<Object>} - The created short URL entity
   */
  async execute({ originalUrl, customAlias = null, userId = null, expiresAt = null }) {
    // Normalize the URL to ensure consistency
    const normalizedUrl = this._normalizeUrl(originalUrl);
    
    // Check if URL already exists to avoid duplicates
    const existingUrl = await this.urlRepository.findByOriginalUrl(normalizedUrl);
    if (existingUrl) {
      // Reuse existing short URL
      return existingUrl;
    }
    
    // Handle custom alias if provided
    let shortCode;
    if (customAlias) {
      // Validate custom alias format
      if (!this._isValidCustomAlias(customAlias)) {
        throw new Error('Invalid custom alias format. Use alphanumeric characters and hyphens only.');
      }
      
      // Check if custom alias is already taken
      const aliasExists = await this.urlRepository.customAliasExists(customAlias);
      if (aliasExists) {
        throw new Error('Custom alias already in use. Please choose another one.');
      }
      
      shortCode = customAlias;
    } else {
      // Generate a unique short code
      shortCode = await this._generateUniqueShortCode();
    }
    
    // Create URL entity
    const url = new Url({
      originalUrl: normalizedUrl,
      shortCode,
      customAlias,
      userId,
      expiresAt,
      createdAt: new Date(),
      isActive: true,
    });
    
    // Persist the URL
    const createdUrl = await this.urlRepository.create(url.toObject());
    
    // Cache the URL for faster lookups
    await this._cacheUrl(shortCode, normalizedUrl);
    
    return createdUrl;
  }

  /**
   * Normalize a URL to ensure consistent format
   * @param {string} url - URL to normalize
   * @returns {string} - Normalized URL
   * @private
   */
  _normalizeUrl(url) {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Remove trailing slash for consistency
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    
    return url;
  }

  /**
   * Generate a unique short code that doesn't exist yet
   * @returns {Promise<string>} - Unique short code
   * @private
   */
  async _generateUniqueShortCode() {
    let shortCode;
    let exists;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      // Generate a random code using nanoid
      shortCode = nanoid(this.urlLength);
      
      // Check if it already exists
      exists = await this.urlRepository.shortCodeExists(shortCode);
      attempts++;
      
      // If we've made too many attempts, increase the length to reduce collisions
      if (attempts >= maxAttempts) {
        this.urlLength += 1;
        attempts = 0;
      }
    } while (exists);
    
    return shortCode;
  }

  /**
   * Validate custom alias format
   * @param {string} alias - Custom alias to validate
   * @returns {boolean} - True if valid
   * @private
   */
  _isValidCustomAlias(alias) {
    // Allow alphanumeric characters and hyphens only
    const regex = /^[a-zA-Z0-9-_]+$/;
    return regex.test(alias) && alias.length >= 3 && alias.length <= 50;
  }

  /**
   * Cache a URL for faster lookups
   * @param {string} shortCode - Short code
   * @param {string} longUrl - Original URL
   * @returns {Promise<void>}
   * @private
   */
  async _cacheUrl(shortCode, longUrl) {
    // Cache with reasonable TTL (from config)
    try {
      await this.cacheRepository.set(`url:${shortCode}`, longUrl, config.redis.ttl);
    } catch (error) {
      // Log but don't fail if caching fails
      console.error('Cache storage error:', error);
    }
  }
}

module.exports = CreateShortUrl;