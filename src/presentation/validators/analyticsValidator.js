const { param, query, body } = require('express-validator');

/**
 * Analytics Validators
 * 
 * Validators for analytics-related requests using express-validator.
 * These are used in the route definitions to validate incoming requests.
 */

/**
 * Validation rules for getting URL analytics
 */
const getAnalyticsValidation = [
  param('shortCode')
    .notEmpty().withMessage('Short code is required')
    .isString().withMessage('Short code must be a string')
    .trim(),
  
  query('view')
    .optional()
    .isIn(['summary', 'clicks', 'referrers', 'browsers', 'devices', 'os', 'locations', 'timeSeries'])
    .withMessage('Invalid view type. Must be one of: summary, clicks, referrers, browsers, devices, os, locations, timeSeries'),
  
  query('from')
    .optional()
    .isISO8601().withMessage('Invalid from date format. Must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'),
  
  query('to')
    .optional()
    .isISO8601().withMessage('Invalid to date format. Must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)')
    .custom((value, { req }) => {
      if (req.query.from && new Date(value) < new Date(req.query.from)) {
        throw new Error('To date must be after from date');
      }
      return true;
    }),
  
  query('interval')
    .optional()
    .isIn(['day', 'hour']).withMessage('Invalid interval. Must be "day" or "hour"'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
    .toInt(),
  
  query('skip')
    .optional()
    .isInt({ min: 0 }).withMessage('Skip must be a non-negative integer')
    .toInt()
];

/**
 * Validation rules for recording a click
 */
const recordClickValidation = [
  body('shortCode')
    .notEmpty().withMessage('Short code is required')
    .isString().withMessage('Short code must be a string')
    .trim(),
  
  body('ip')
    .optional()
    .isIP().withMessage('Invalid IP address format'),
  
  body('userAgent')
    .optional()
    .isString().withMessage('User agent must be a string'),
  
  body('referrer')
    .optional()
    .isString().withMessage('Referrer must be a string')
];

/**
 * Validation rules for exporting analytics
 */
const exportAnalyticsValidation = [
  param('shortCode')
    .notEmpty().withMessage('Short code is required')
    .isString().withMessage('Short code must be a string')
    .trim(),
  
  query('format')
    .optional()
    .isIn(['json', 'csv', 'excel']).withMessage('Invalid format. Must be "json", "csv", or "excel"'),
  
  query('from')
    .optional()
    .isISO8601().withMessage('Invalid from date format. Must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'),
  
  query('to')
    .optional()
    .isISO8601().withMessage('Invalid to date format. Must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)')
    .custom((value, { req }) => {
      if (req.query.from && new Date(value) < new Date(req.query.from)) {
        throw new Error('To date must be after from date');
      }
      return true;
    })
];

/**
 * Validation rules for getting dashboard analytics
 */
const getDashboardValidation = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period. Must be "day", "week", "month", or "year"')
];

module.exports = {
  getAnalyticsValidation,
  recordClickValidation,
  exportAnalyticsValidation,
  getDashboardValidation
};