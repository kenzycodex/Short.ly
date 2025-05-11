/**
 * URL Entity Class - Core domain entity representing a shortened URL
 */
class Url {
    /**
     * Creates a new URL entity
     * @param {Object} urlData - URL data
     * @param {string} urlData.originalUrl - The original long URL
     * @param {string} urlData.shortCode - The unique short code for the URL
     * @param {string} [urlData.customAlias] - Optional custom alias
     * @param {string} [urlData.userId] - Owner of the URL (if authenticated)
     * @param {Date} [urlData.createdAt] - Creation date
     * @param {Date} [urlData.expiresAt] - Expiration date (optional)
     * @param {boolean} [urlData.isActive] - Whether the URL is active
     */
    constructor({
      originalUrl,
      shortCode,
      customAlias = null,
      userId = null,
      createdAt = new Date(),
      expiresAt = null,
      isActive = true,
    }) {
      this.originalUrl = originalUrl;
      this.shortCode = shortCode;
      this.customAlias = customAlias;
      this.userId = userId;
      this.createdAt = createdAt;
      this.expiresAt = expiresAt;
      this.isActive = isActive;
      
      // Validate essential properties
      this._validate();
    }
  
    /**
     * Validate the URL entity
     * @private
     */
    _validate() {
      if (!this.originalUrl) {
        throw new Error('Original URL is required');
      }
      
      if (!this.shortCode) {
        throw new Error('Short code is required');
      }
      
      // Basic URL validation - could be more comprehensive
      try {
        new URL(this.originalUrl);
      } catch (error) {
        throw new Error('Invalid URL format');
      }
    }
  
    /**
     * Check if this URL has expired
     * @returns {boolean} - True if expired
     */
    isExpired() {
      return this.expiresAt !== null && new Date() > this.expiresAt;
    }
  
    /**
     * Check if this URL is valid for redirection
     * @returns {boolean} - True if valid
     */
    isValidForRedirect() {
      return this.isActive && !this.isExpired();
    }
  
    /**
     * Convert to a plain object (for persistence or serialization)
     * @returns {Object} - Plain object representation
     */
    toObject() {
      return {
        originalUrl: this.originalUrl,
        shortCode: this.shortCode,
        customAlias: this.customAlias,
        userId: this.userId,
        createdAt: this.createdAt,
        expiresAt: this.expiresAt,
        isActive: this.isActive,
      };
    }
  
    /**
     * Create a URL entity from a plain object (hydration)
     * @param {Object} data - Plain object data
     * @returns {Url} - URL entity instance
     */
    static fromObject(data) {
      return new Url({
        originalUrl: data.originalUrl,
        shortCode: data.shortCode,
        customAlias: data.customAlias,
        userId: data.userId,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
    }
  }
  
  module.exports = Url;