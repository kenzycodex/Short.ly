const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Mongoose Schema for Analytics
 */
const analyticsSchema = new Schema(
  {
    // Short code (reference to URL)
    shortCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    
    // Visitor IP address (can be anonymized)
    ip: {
      type: String,
      required: true,
    },
    
    // Referrer URL (where the visitor came from)
    referrer: {
      type: String,
      trim: true,
      index: true,
    },
    
    // User Agent string
    userAgent: {
      type: String,
    },
    
    // Device information parsed from user agent
    device: {
      // Browser name and version
      browser: {
        name: String,
        version: String,
      },
      
      // Operating system
      os: {
        name: String,
        version: String,
      },
      
      // Device type (desktop, mobile, tablet)
      type: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'unknown',
      },
    },
    
    // Location information derived from IP
    location: {
      // Country code (ISO 3166-1 alpha-2)
      country: {
        type: String,
        trim: true,
        index: true,
      },
      
      // Region or state
      region: String,
      
      // City
      city: String,
      
      // Coordinates
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    
    // Optional session/user identifier (anonymized)
    sessionId: {
      type: String,
      index: true,
    },
    
    // Date when the click occurred
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // We're setting timestamps: false because we already have a timestamp field
    // that we control explicitly
    timestamps: false,
    
    // Enable conversion to JSON
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        // Optionally anonymize IP address for privacy when serializing
        ret.ip = ret.ip.replace(/\d+$/, 'xxx');
        return ret;
      },
    },
  }
);

// Create compound indices for faster analytics queries
analyticsSchema.index({ shortCode: 1, timestamp: -1 });
analyticsSchema.index({ shortCode: 1, 'device.browser.name': 1 });
analyticsSchema.index({ shortCode: 1, 'device.os.name': 1 });
analyticsSchema.index({ shortCode: 1, 'device.type': 1 });
analyticsSchema.index({ shortCode: 1, 'location.country': 1 });
analyticsSchema.index({ shortCode: 1, referrer: 1 });

// Add a method to anonymize IP
analyticsSchema.methods.anonymizeIp = function() {
  // Replace the last octet with xxx
  this.ip = this.ip.replace(/\d+$/, 'xxx');
  return this;
};

// Create the model if it doesn't exist or get it if it does
let AnalyticsModel;
try {
  AnalyticsModel = mongoose.model('Analytics');
} catch (e) {
  AnalyticsModel = mongoose.model('Analytics', analyticsSchema);
}

module.exports = AnalyticsModel;