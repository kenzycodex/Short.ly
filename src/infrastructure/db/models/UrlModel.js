const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Mongoose Schema for URL
 */
const urlSchema = new Schema(
  {
    // Original long URL
    originalUrl: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    
    // Short code (unique identifier for the short URL)
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    
    // Custom alias (if user provided their own short code)
    customAlias: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    
    // User ID (if authentication is used)
    userId: {
      type: String,
      sparse: true,
      index: true,
    },
    
    // When the URL expires (if applicable)
    expiresAt: {
      type: Date,
      index: true,
    },
    
    // Whether the URL is active or disabled
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    // Metadata and statistics for quick access
    metadata: {
      // Total clicks (duplicated from analytics for performance)
      totalClicks: {
        type: Number,
        default: 0,
      },
      
      // Last accessed date
      lastAccessed: {
        type: Date,
      },
      
      // Tags for organization
      tags: [String],
      
      // Optional title/description for the URL
      title: String,
      description: String,
    },
  },
  {
    // Enable Mongoose timestamps (createdAt, updatedAt)
    timestamps: true,
    
    // Enable conversion to JSON
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    
    // Enable Mongoose virtuals
    virtuals: true,
  }
);

// Virtual for getting the full short URL
urlSchema.virtual('shortUrl').get(function () {
  // This should be loaded from config, but for simplicity we're using a placeholder
  const config = require('../../../config');
  return `${config.url.domain}/${this.shortCode}`;
});

// Index for optimization
urlSchema.index({ createdAt: -1 });
urlSchema.index({ userId: 1, createdAt: -1 });

// Add methods to the model

// Check if the URL is expired
urlSchema.methods.isExpired = function () {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Check if the URL is valid for redirection
urlSchema.methods.isValidForRedirect = function () {
  return this.isActive && !this.isExpired();
};

// Create the model if it doesn't exist or get it if it does
let UrlModel;
try {
  UrlModel = mongoose.model('Url');
} catch (e) {
  UrlModel = mongoose.model('Url', urlSchema);
}

module.exports = UrlModel;