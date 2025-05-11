const { validationResult } = require('express-validator');
const createError = require('http-errors');
const responseFormatter = require('./responseFormatter');

/**
 * Validator Utility
 * 
 * Utility functions for validation and error handling in Express.js.
 */

/**
 * Validate request using express-validator
 * 
 * This middleware validates the request using the validation result from
 * express-validator and returns a formatted error response if validation fails.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      param: err.param,
      msg: err.msg,
      location: err.location,
      value: err.value
    }));
    
    const errorResponse = responseFormatter.formatValidationError(formattedErrors);
    return res.status(400).json(errorResponse);
  }
  
  next();
}

/**
 * Validate URL format
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Validate custom alias format
 * 
 * @param {string} alias - Custom alias to validate
 * @returns {boolean} - True if alias is valid
 */
function isValidAlias(alias) {
  const aliasRegex = /^[a-zA-Z0-9-_]+$/;
  return aliasRegex.test(alias) && alias.length >= 3 && alias.length <= 50;
}

/**
 * Normalize URL
 * 
 * @param {string} url - URL to normalize
 * @returns {string} - Normalized URL
 */
function normalizeUrl(url) {
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  return url;
}

/**
 * Validate date format (ISO 8601)
 * 
 * @param {string} date - Date string to validate
 * @returns {boolean} - True if date is valid
 */
function isValidDate(date) {
  if (!date) return false;
  
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  return isoDateRegex.test(date) && !isNaN(new Date(date).getTime());
}

/**
 * Validate that a date is in the future
 * 
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - True if date is in the future
 */
function isFutureDate(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
}

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * 
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password is strong enough
 */
function isStrongPassword(password) {
  // At least 8 characters, with at least one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Sanitize HTML content
 * 
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHtml(html) {
  if (!html) return '';
  
  // Simple HTML sanitization for basic tags
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize input for MongoDB query
 * 
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeForDb(input) {
  if (!input) return '';
  
  // Remove MongoDB operators
  return input.replace(/[${}()[\]]/g, '');
}

/**
 * Check if a value is undefined or null
 * 
 * @param {any} value - Value to check
 * @returns {boolean} - True if value is undefined or null
 */
function isNil(value) {
  return value === undefined || value === null;
}

/**
 * Check if a value is empty (undefined, null, empty string, empty array, empty object)
 * 
 * @param {any} value - Value to check
 * @returns {boolean} - True if value is empty
 */
function isEmpty(value) {
  if (isNil(value)) return true;
  
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  
  return false;
}

/**
 * Validate IP address
 * 
 * @param {string} ip - IP address to validate
 * @returns {boolean} - True if IP is valid
 */
function isValidIp(ip) {
  // IPv4 format
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => parseInt(part, 10) <= 255);
  }
  
  // IPv6 format (simplified check)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
}

module.exports = {
  validate,
  isValidUrl,
  isValidAlias,
  normalizeUrl,
  isValidDate,
  isFutureDate,
  isValidEmail,
  isStrongPassword,
  sanitizeHtml,
  sanitizeForDb,
  isNil,
  isEmpty,
  isValidIp
};