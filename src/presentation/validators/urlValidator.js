const { body, param, query } = require('express-validator');

/**
 * URL Validators
 * 
 * Validators for URL-related requests using express-validator.
 * These are used in the route definitions to validate incoming requests.
 */

/**
 * Validation rules for creating a new short URL
 */
const createUrlValidation = [
  body('originalUrl')
    .notEmpty().withMessage('Original URL is required')
    .isURL({ 
      protocols: ['http', 'https'], 
      require_protocol: true 
    }).withMessage('Invalid URL format. URL must include http:// or https:// protocol')
    .trim(),
  
  body('customAlias')
    .optional()
    .isString().withMessage('Custom alias must be a string')
    .isLength({ min: 3, max: 50 }).withMessage('Custom alias must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Custom alias can only contain alphanumeric characters, hyphens, and underscores')
    .trim(),
  
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('Invalid expiration date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),
  
  body('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate must be a boolean value'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((value) => {
      if (!value.every(tag => typeof tag === 'string')) {
        throw new Error('All tags must be strings');
      }
      return true;
    })
];

/**
 * Validation rules for updating a URL
 */
const updateUrlValidation = [
  param('shortCode')
    .notEmpty().withMessage('Short code is required')
    .isString().withMessage('Short code must be a string')
    .trim(),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value'),
  
  body('expiresAt')
    .optional()
    .custom((value) => {
      if (value === null) return true; // Allow explicitly setting to null
      
      if (!value) {
        throw new Error('expiresAt must be a valid date or null');
      }
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) {
        throw new Error('Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)');
      }
      
      // Validate date is in the future
      if (new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      
      return true;
    }),
  
  body('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate must be a boolean value'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((value) => {
      if (!value.every(tag => typeof tag === 'string')) {
        throw new Error('All tags must be strings');
      }
      return true;
    })
];

/**
 * Validation rules for getting URL details
 */
const getUrlValidation = [
  param('shortCode')
    .notEmpty().withMessage('Short code is required')
    .isString().withMessage('Short code must be a string')
    .trim()
];

/**
 * Validation rules for checking alias availability
 */
const checkAliasValidation = [
  param('alias')
    .notEmpty().withMessage('Alias is required')
    .isString().withMessage('Alias must be a string')
    .isLength({ min: 3, max: 50 }).withMessage('Alias must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Alias can only contain alphanumeric characters, hyphens, and underscores')
    .trim()
];

/**
 * Validation rules for bulk URL creation
 */
const bulkCreateUrlValidation = [
  body('urls')
    .isArray().withMessage('urls must be an array')
    .notEmpty().withMessage('urls array cannot be empty')
    .custom((urls) => {
      if (urls.length > 100) {
        throw new Error('Maximum of 100 URLs can be created at once');
      }
      return true;
    }),
  
  body('urls.*.originalUrl')
    .notEmpty().withMessage('Original URL is required')
    .isURL({ 
      protocols: ['http', 'https'], 
      require_protocol: true 
    }).withMessage('Invalid URL format. URL must include http:// or https:// protocol')
    .trim(),
  
  body('urls.*.customAlias')
    .optional()
    .isString().withMessage('Custom alias must be a string')
    .isLength({ min: 3, max: 50 }).withMessage('Custom alias must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Custom alias can only contain alphanumeric characters, hyphens, and underscores')
    .trim(),
  
  body('urls.*.expiresAt')
    .optional()
    .isISO8601().withMessage('Invalid expiration date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),
  
  body('urls.*.tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
];

/**
 * Validation rules for listing user URLs
 */
const listUrlsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'expiresAt', 'lastAccessed', 'totalClicks']).withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be either "asc" or "desc"'),
  
  query('isActive')
    .optional()
    .isIn(['true', 'false']).withMessage('isActive must be either "true" or "false"')
    .customSanitizer(value => value === 'true'),
  
  query('tags')
    .optional()
    .isString().withMessage('Tags must be a comma-separated string')
    .customSanitizer(value => value.split(',').map(tag => tag.trim()))
];

module.exports = {
  createUrlValidation,
  updateUrlValidation,
  getUrlValidation,
  checkAliasValidation,
  bulkCreateUrlValidation,
  listUrlsValidation
};