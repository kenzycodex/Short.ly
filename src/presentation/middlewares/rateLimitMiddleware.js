const rateLimit = require('express-rate-limit');
const config = require('../../config');

/**
 * Rate Limiting Middleware
 * 
 * Sets up different rate limits for different API endpoints
 * to prevent abuse.
 */
class RateLimitMiddleware {
  constructor() {
    const {
      windowMs,
      max
    } = config.security.rateLimit;
    
    // General API rate limit
    this.apiLimiter = rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many requests, please try again later.'
      }
    });
    
    // Higher limit for redirections
    this.redirectLimiter = rateLimit({
      windowMs,
      max: max * 5, // Allow more redirects than API calls
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many redirect requests, please try again later.'
      }
    });
    
    // Resolve URL endpoint
    this.resolveLimiter = rateLimit({
      windowMs,
      max: max * 2, // Allow more resolves than API calls
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many resolve requests, please try again later.'
      }
    });
    
    // Create URL endpoint (more restricted to prevent spam)
    this.createUrlLimiter = rateLimit({
      windowMs,
      max: Math.floor(max / 2), // More restricted
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many URL creation requests, please try again later.'
      }
    });
    
    // Analytics record endpoint
    this.recordClickLimiter = rateLimit({
      windowMs,
      max: max * 10, // Very permissive for analytics
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many analytics record requests, please try again later.'
      }
    });
  }

  /**
   * Rate limit for the general API
   * @returns {Function} Express middleware
   */
  get api() {
    return this.apiLimiter;
  }

  /**
   * Rate limit for the redirect endpoint
   * @returns {Function} Express middleware
   */
  get redirect() {
    return this.redirectLimiter;
  }

  /**
   * Rate limit for the resolve endpoint
   * @returns {Function} Express middleware
   */
  get resolve() {
    return this.resolveLimiter;
  }

  /**
   * Rate limit for the create URL endpoint
   * @returns {Function} Express middleware
   */
  get createUrl() {
    return this.createUrlLimiter;
  }

  /**
   * Rate limit for the record click endpoint
   * @returns {Function} Express middleware
   */
  get recordClick() {
    return this.recordClickLimiter;
  }
}

// Export a singleton instance
module.exports = new RateLimitMiddleware();