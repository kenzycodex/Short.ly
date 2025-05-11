/**
 * URL Repository Interface
 * 
 * This file defines the contract that any URL repository implementation must fulfill.
 * Following the Dependency Inversion Principle, domain logic will depend on this
 * interface rather than directly on database implementations.
 */

/**
 * @interface UrlRepository
 */
class UrlRepository {
    /**
     * Find a URL by its short code
     * @param {string} shortCode - The short code to lookup
     * @returns {Promise<Object|null>} - The URL object if found, null otherwise
     */
    async findByShortCode(shortCode) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Find a URL by its original URL
     * @param {string} originalUrl - The original URL
     * @returns {Promise<Object|null>} - The URL object if found, null otherwise
     */
    async findByOriginalUrl(originalUrl) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Find a URL by custom alias
     * @param {string} alias - The custom alias
     * @returns {Promise<Object|null>} - The URL object if found, null otherwise
     */
    async findByCustomAlias(alias) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Create a new shortened URL
     * @param {Object} urlData - URL data
     * @returns {Promise<Object>} - The created URL object
     */
    async create(urlData) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Update an existing URL
     * @param {string} shortCode - Short code of the URL to update
     * @param {Object} updateData - The data to update
     * @returns {Promise<Object|null>} - The updated URL object, or null if not found
     */
    async update(shortCode, updateData) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Delete a URL by its short code
     * @param {string} shortCode - The short code to delete
     * @returns {Promise<boolean>} - True if deleted, false if not found
     */
    async delete(shortCode) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Get all URLs, with optional pagination
     * @param {Object} options - Query options
     * @param {number} [options.limit=10] - Maximum number of results
     * @param {number} [options.skip=0] - Number of results to skip
     * @param {Object} [options.filter={}] - Filter criteria
     * @returns {Promise<Array<Object>>} - Array of URL objects
     */
    async findAll({ limit = 10, skip = 0, filter = {} }) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Get URLs belonging to a user
     * @param {string} userId - The user ID
     * @param {Object} options - Query options
     * @param {number} [options.limit=10] - Maximum number of results
     * @param {number} [options.skip=0] - Number of results to skip
     * @returns {Promise<Array<Object>>} - Array of URL objects
     */
    async findByUser(userId, { limit = 10, skip = 0 }) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Count the total number of URLs matching a filter
     * @param {Object} [filter={}] - Filter criteria
     * @returns {Promise<number>} - The count
     */
    async count(filter = {}) {
      throw new Error('Method not implemented');
    }
    
    /**
     * Check if a short code already exists
     * @param {string} shortCode - The short code to check
     * @returns {Promise<boolean>} - True if exists, false otherwise
     */
    async shortCodeExists(shortCode) {
      throw new Error('Method not implemented');
    }
    
    /**
     * Check if a custom alias already exists
     * @param {string} alias - The custom alias to check
     * @returns {Promise<boolean>} - True if exists, false otherwise
     */
    async customAliasExists(alias) {
      throw new Error('Method not implemented');
    }
  }
  
  module.exports = UrlRepository;