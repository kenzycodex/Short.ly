const UrlRepository = require('../../../core/interfaces/UrlRepository');
const UrlModel = require('../models/UrlModel');

/**
 * MongoDB implementation of the URL Repository
 * 
 * This implements the UrlRepository interface using MongoDB/Mongoose
 */
class MongoUrlRepository extends UrlRepository {
  /**
   * Find a URL by its short code
   * @param {string} shortCode - The short code to lookup
   * @returns {Promise<Object|null>} - The URL object if found, null otherwise
   */
  async findByShortCode(shortCode) {
    try {
      const url = await UrlModel.findOne({ shortCode });
      return url ? url.toObject() : null;
    } catch (error) {
      console.error('Error finding URL by short code:', error);
      throw error;
    }
  }

  /**
   * Find a URL by its original URL
   * @param {string} originalUrl - The original URL
   * @returns {Promise<Object|null>} - The URL object if found, null otherwise
   */
  async findByOriginalUrl(originalUrl) {
    try {
      const url = await UrlModel.findOne({ originalUrl });
      return url ? url.toObject() : null;
    } catch (error) {
      console.error('Error finding URL by original URL:', error);
      throw error;
    }
  }

  /**
   * Find a URL by custom alias
   * @param {string} alias - The custom alias
   * @returns {Promise<Object|null>} - The URL object if found, null otherwise
   */
  async findByCustomAlias(alias) {
    try {
      const url = await UrlModel.findOne({ customAlias: alias });
      return url ? url.toObject() : null;
    } catch (error) {
      console.error('Error finding URL by custom alias:', error);
      throw error;
    }
  }

  /**
   * Create a new shortened URL
   * @param {Object} urlData - URL data
   * @returns {Promise<Object>} - The created URL object
   */
  async create(urlData) {
    try {
      const url = new UrlModel(urlData);
      await url.save();
      return url.toObject();
    } catch (error) {
      console.error('Error creating URL:', error);
      throw error;
    }
  }

  /**
   * Update an existing URL
   * @param {string} shortCode - Short code of the URL to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object|null>} - The updated URL object, or null if not found
   */
  async update(shortCode, updateData) {
    try {
      const url = await UrlModel.findOneAndUpdate(
        { shortCode },
        updateData,
        { new: true } // Return the updated document
      );
      return url ? url.toObject() : null;
    } catch (error) {
      console.error('Error updating URL:', error);
      throw error;
    }
  }

  /**
   * Delete a URL by its short code
   * @param {string} shortCode - The short code to delete
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async delete(shortCode) {
    try {
      const result = await UrlModel.deleteOne({ shortCode });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting URL:', error);
      throw error;
    }
  }

  /**
   * Get all URLs, with optional pagination and filtering
   * @param {Object} options - Query options
   * @param {number} [options.limit=10] - Maximum number of results
   * @param {number} [options.skip=0] - Number of results to skip
   * @param {Object} [options.filter={}] - Filter criteria
   * @returns {Promise<Array<Object>>} - Array of URL objects
   */
  async findAll({ limit = 10, skip = 0, filter = {} }) {
    try {
      const urls = await UrlModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return urls.map(url => url.toObject());
    } catch (error) {
      console.error('Error finding all URLs:', error);
      throw error;
    }
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
    try {
      const urls = await UrlModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return urls.map(url => url.toObject());
    } catch (error) {
      console.error('Error finding URLs by user:', error);
      throw error;
    }
  }

  /**
   * Count the total number of URLs matching a filter
   * @param {Object} [filter={}] - Filter criteria
   * @returns {Promise<number>} - The count
   */
  async count(filter = {}) {
    try {
      return await UrlModel.countDocuments(filter);
    } catch (error) {
      console.error('Error counting URLs:', error);
      throw error;
    }
  }
  
  /**
   * Check if a short code already exists
   * @param {string} shortCode - The short code to check
   * @returns {Promise<boolean>} - True if exists, false otherwise
   */
  async shortCodeExists(shortCode) {
    try {
      const count = await UrlModel.countDocuments({ shortCode });
      return count > 0;
    } catch (error) {
      console.error('Error checking if short code exists:', error);
      throw error;
    }
  }
  
  /**
   * Check if a custom alias already exists
   * @param {string} alias - The custom alias to check
   * @returns {Promise<boolean>} - True if exists, false otherwise
   */
  async customAliasExists(alias) {
    try {
      const count = await UrlModel.countDocuments({ customAlias: alias });
      return count > 0;
    } catch (error) {
      console.error('Error checking if custom alias exists:', error);
      throw error;
    }
  }
  
  /**
   * Update URL metadata (click count, last accessed, etc.)
   * @param {string} shortCode - Short code of the URL
   * @param {Object} metadata - Metadata to update
   * @returns {Promise<boolean>} - True if updated successfully
   */
  async updateMetadata(shortCode, metadata) {
    try {
      const result = await UrlModel.updateOne(
        { shortCode },
        { $set: { metadata } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating URL metadata:', error);
      return false;
    }
  }
  
  /**
   * Increment the click count for a URL
   * @param {string} shortCode - Short code of the URL
   * @returns {Promise<boolean>} - True if incremented successfully
   */
  async incrementClickCount(shortCode) {
    try {
      const result = await UrlModel.updateOne(
        { shortCode },
        { 
          $inc: { 'metadata.totalClicks': 1 },
          $set: { 'metadata.lastAccessed': new Date() }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error incrementing click count:', error);
      return false;
    }
  }
}

module.exports = MongoUrlRepository;