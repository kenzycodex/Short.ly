/**
 * Cache Repository Interface
 * 
 * This file defines the contract that any cache implementation must fulfill.
 * This allows decoupling the application logic from specific caching technologies.
 */

/**
 * @interface CacheRepository
 */
class CacheRepository {
    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} - The cached value or null if not found/expired
     */
    async get(key) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} [ttl=null] - TTL in seconds, null for default
     * @returns {Promise<boolean>} - True if set successfully
     */
    async set(key, value, ttl = null) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Delete a value from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - True if deleted, false if not found
     */
    async delete(key) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Check if a key exists in cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - True if exists, false otherwise
     */
    async exists(key) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Clear the entire cache or a pattern
     * @param {string} [pattern=null] - Optional pattern to match keys
     * @returns {Promise<boolean>} - True if cleared successfully
     */
    async clear(pattern = null) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Increment a numeric value in cache
     * @param {string} key - Cache key
     * @param {number} [increment=1] - Amount to increment
     * @returns {Promise<number|null>} - New value or null if key doesn't exist
     */
    async increment(key, increment = 1) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Decrement a numeric value in cache
     * @param {string} key - Cache key
     * @param {number} [decrement=1] - Amount to decrement
     * @returns {Promise<number|null>} - New value or null if key doesn't exist
     */
    async decrement(key, decrement = 1) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Get multiple values from cache
     * @param {Array<string>} keys - Array of cache keys
     * @returns {Promise<Object>} - Object mapping keys to values (null for missing)
     */
    async mget(keys) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Set multiple values in cache
     * @param {Object} keyValues - Object mapping keys to values
     * @param {number} [ttl=null] - TTL in seconds, null for default
     * @returns {Promise<boolean>} - True if all set successfully
     */
    async mset(keyValues, ttl = null) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Get time-to-live for a key
     * @param {string} key - Cache key
     * @returns {Promise<number|null>} - TTL in seconds, -1 if no TTL, null if not found
     */
    async ttl(key) {
      throw new Error('Method not implemented');
    }
  }
  
  module.exports = CacheRepository;