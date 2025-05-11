const { createClient } = require('redis');
const config = require('../../config');

/**
 * Redis Client
 * 
 * Manages the connection to Redis cache, including connecting, disconnecting,
 * and handling connection events.
 */
class RedisClient {
  /**
   * Initialize the Redis client
   */
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTtl = config.redis.ttl || 86400; // Default TTL: 1 day
  }

  /**
   * Connect to Redis
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const redisConfig = {
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
      };

      // Add password if specified
      if (config.redis.password) {
        redisConfig.password = config.redis.password;
      }

      // Configure SSL if enabled
      if (config.redis.ssl) {
        redisConfig.socket.tls = true;
        redisConfig.socket.rejectUnauthorized = true;
      }

      // Create the Redis client
      this.client = createClient(redisConfig);

      // Set up event handlers
      this.client.on('connect', () => {
        console.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        console.info('Redis client connected and ready');
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
      });

      this.client.on('end', () => {
        this.isConnected = false;
        console.info('Redis client disconnected');
      });

      this.client.on('reconnecting', () => {
        console.info('Redis client reconnecting...');
      });

      // Connect to Redis server
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  /**
   * Get a value from Redis
   * @param {string} key - Key to get
   * @returns {Promise<any|null>} - Value or null if not found
   */
  async get(key) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting key ${key} from Redis:`, error);
      return null;
    }
  }

  /**
   * Set a value in Redis
   * @param {string} key - Key to set
   * @param {any} value - Value to set
   * @param {number} [ttl=null] - TTL in seconds (null for default)
   * @returns {Promise<boolean>} - True if set successfully
   */
  async set(key, value, ttl = null) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const ttlToUse = ttl || this.defaultTtl;
      
      // Convert complex objects to JSON string
      const valueToStore = JSON.stringify(value);
      
      // Set with expiration
      await this.client.set(key, valueToStore, {
        EX: ttlToUse,
      });
      
      return true;
    } catch (error) {
      console.error(`Error setting key ${key} in Redis:`, error);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   * @param {string} key - Key to delete
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async delete(key) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Error deleting key ${key} from Redis:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param {string} key - Key to check
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(key) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking if key ${key} exists in Redis:`, error);
      return false;
    }
  }

  /**
   * Clear keys matching a pattern
   * @param {string} [pattern='*'] - Pattern to match
   * @returns {Promise<boolean>} - True if successful
   */
  async clear(pattern = '*') {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      // SCAN is safer than KEYS for production environments
      let cursor = '0';
      let keys = [];
      
      do {
        const reply = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        
        cursor = reply.cursor;
        keys = keys.concat(reply.keys);
      } while (cursor !== '0');
      
      // Delete all found keys in batches
      if (keys.length > 0) {
        // Delete in smaller batches for better performance
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          if (batch.length > 0) {
            await this.client.del(batch);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error clearing keys matching pattern ${pattern} from Redis:`, error);
      return false;
    }
  }

  /**
   * Increment a numeric value in Redis
   * @param {string} key - Key to increment
   * @param {number} [increment=1] - Amount to increment
   * @returns {Promise<number|null>} - New value or null if error
   */
  async increment(key, increment = 1) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      return await this.client.incrBy(key, increment);
    } catch (error) {
      console.error(`Error incrementing key ${key} in Redis:`, error);
      return null;
    }
  }

  /**
   * Decrement a numeric value in Redis
   * @param {string} key - Key to decrement
   * @param {number} [decrement=1] - Amount to decrement
   * @returns {Promise<number|null>} - New value or null if error
   */
  async decrement(key, decrement = 1) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      return await this.client.decrBy(key, decrement);
    } catch (error) {
      console.error(`Error decrementing key ${key} in Redis:`, error);
      return null;
    }
  }

  /**
   * Get multiple values from Redis
   * @param {Array<string>} keys - Keys to get
   * @returns {Promise<Object>} - Object mapping keys to values
   */
  async mget(keys) {
    if (!this.isConnected) {
      await this.connect();
    }

    if (!keys || keys.length === 0) {
      return {};
    }

    try {
      const values = await this.client.mGet(keys);
      
      // Create a map of key -> parsed value
      const result = {};
      for (let i = 0; i < keys.length; i++) {
        try {
          result[keys[i]] = values[i] ? JSON.parse(values[i]) : null;
        } catch (e) {
          // If parsing fails, use the raw value
          result[keys[i]] = values[i];
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error getting multiple keys from Redis:`, error);
      return {};
    }
  }

  /**
   * Set multiple values in Redis
   * @param {Object} keyValues - Object mapping keys to values
   * @param {number} [ttl=null] - TTL in seconds (null for default)
   * @returns {Promise<boolean>} - True if successful
   */
  async mset(keyValues, ttl = null) {
    if (!this.isConnected) {
      await this.connect();
    }

    if (!keyValues || Object.keys(keyValues).length === 0) {
      return false;
    }

    try {
      const ttlToUse = ttl || this.defaultTtl;
      const pipeline = this.client.multi();
      
      // Add each key-value pair to the pipeline
      for (const [key, value] of Object.entries(keyValues)) {
        const valueToStore = JSON.stringify(value);
        pipeline.set(key, valueToStore, { EX: ttlToUse });
      }
      
      // Execute the pipeline
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error(`Error setting multiple keys in Redis:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   * @param {string} key - Key to check
   * @returns {Promise<number|null>} - TTL in seconds, -1 if no TTL, null if not found
   */
  async ttl(key) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const ttl = await this.client.ttl(key);
      return ttl;
    } catch (error) {
      console.error(`Error getting TTL for key ${key} from Redis:`, error);
      return null;
    }
  }

  /**
   * Get the client instance
   * @returns {Object|null} - Redis client or null if not connected
   */
  getClient() {
    return this.client;
  }

  /**
   * Check if connected to Redis
   * @returns {boolean} - True if connected
   */
  isConnectedToRedis() {
    return this.isConnected;
  }
}

// Create and export a singleton instance
const redisClient = new RedisClient();
module.exports = redisClient;