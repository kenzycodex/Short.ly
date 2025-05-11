const mongoose = require('mongoose');
const config = require('../../config');

/**
 * MongoDB Connection Manager
 * 
 * Manages the connection to MongoDB, including connecting, disconnecting,
 * and handling connection events.
 */
class MongoClient {
  /**
   * Initialize the MongoDB client
   */
  constructor() {
    this.mongoose = mongoose;
    this.isConnected = false;
    this.connection = null;
    
    // Configure mongoose settings
    mongoose.set('strictQuery', false); // Consistent with MongoDB behavior

    // Set up connection event handlers
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      console.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      this.isConnected = false;
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.info('MongoDB disconnected');
    });
  }

  /**
   * Connect to MongoDB
   * @returns {Promise<mongoose.Connection>} - Mongoose connection
   */
  async connect() {
    if (this.isConnected) {
      return this.connection;
    }

    try {
      console.info(`Connecting to MongoDB at ${this._getRedactedUri()}`);
      
      // Connect to MongoDB
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      
      this.connection = mongoose.connection;
      this.isConnected = true;
      return this.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      this.connection = null;
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get the MongoDB connection
   * @returns {mongoose.Connection|null} - Mongoose connection or null if not connected
   */
  getConnection() {
    return this.connection;
  }

  /**
   * Check if connected to MongoDB
   * @returns {boolean} - True if connected
   */
  isConnectedToDb() {
    return this.isConnected;
  }

  /**
   * Get a redacted version of the MongoDB URI for logging
   * @returns {string} - Redacted URI
   * @private
   */
  _getRedactedUri() {
    const uri = config.mongodb.uri;
    
    // Replace password with asterisks if present
    if (uri.includes('@')) {
      return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    }
    
    return uri;
  }
}

// Create and export a singleton instance
const mongoClient = new MongoClient();
module.exports = mongoClient;