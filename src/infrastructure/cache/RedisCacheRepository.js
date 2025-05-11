const CacheRepository = require('../../core/interfaces/CacheRepository');
const redisClient = require('./redisClient');

/**
 * Redis implementation of the Cache Repository
 * 
 * This implements the CacheRepository interface using Redis
 */
class RedisCacheRepository extends CacheRepository {
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} - The cached value or null if not found/expired
   */
  async get(key) {
    return await redisClient.get(key);
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttl=null] - TTL in seconds, null for default
   * @returns {Promise<boolean>} - True if set successfully
   */
  async set(key, value, ttl = null) {
    return await redisClient.set(key, value, ttl);
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async delete(key) {
    return await redisClient.delete(key);
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if exists, false otherwise
   */
  async exists(key) {
    return await redisClient.exists(key);
  }

  /**
   * Clear the entire cache or a pattern
   * @param {string} [pattern=null] - Optional pattern to match keys
   * @returns {Promise<boolean>} - True if cleared successfully
   */
  async clear(pattern = null) {
    return await redisClient.clear(pattern || '*');
  }

  /**
   * Increment a numeric value in cache
   * @param {string} key - Cache key
   * @param {number} [increment=1] - Amount to increment
   * @returns {Promise<number|null>} - New value or null if key doesn't exist
   */
  async increment(key, increment = 1) {
    return await redisClient.increment(key, increment);
  }

  /**
   * Decrement a numeric value in cache
   * @param {string} key - Cache key
   * @param {number} [decrement=1] - Amount to decrement
   * @returns {Promise<number|null>} - New value or null if key doesn't exist
   */
  async decrement(key, decrement = 1) {
    return await redisClient.decrement(key, decrement);
  }

  /**
   * Get multiple values from cache
   * @param {Array<string>} keys - Array of cache keys
   * @returns {Promise<Object>} - Object mapping keys to values (null for missing)
   */
  async mget(keys) {
    return await redisClient.mget(keys);
  }

  /**
   * Set multiple values in cache
   * @param {Object} keyValues - Object mapping keys to values
   * @param {number} [ttl=null] - TTL in seconds, null for default
   * @returns {Promise<boolean>} - True if all set successfully
   */
  async mset(keyValues, ttl = null) {
    return await redisClient.mset(keyValues, ttl);
  }

  /**
   * Get time-to-live for a key
   * @param {string} key - Cache key
   * @returns {Promise<number|null>} - TTL in seconds, -1 if no TTL, null if not found
   */
  async ttl(key) {
    return await redisClient.ttl(key);
  }
}

module.exports = RedisCacheRepository;