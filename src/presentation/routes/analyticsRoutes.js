const express = require('express');
const { body, param, query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const rateLimitMiddleware = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/v1/analytics/{shortCode}:
 *   get:
 *     summary: Get analytics for a URL
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [summary, clicks, referrers, browsers, devices, os, locations, timeSeries]
 *           default: summary
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, hour]
 *           default: day
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       404:
 *         description: URL not found
 */
router.get(
  '/:shortCode',
  authMiddleware.optional,
  [
    param('shortCode').notEmpty().withMessage('Short code is required'),
    query('view')
      .optional()
      .isIn(['summary', 'clicks', 'referrers', 'browsers', 'devices', 'os', 'locations', 'timeSeries'])
      .withMessage('Invalid view type'),
    query('from')
      .optional()
      .isISO8601().withMessage('Invalid from date format'),
    query('to')
      .optional()
      .isISO8601().withMessage('Invalid to date format'),
    query('interval')
      .optional()
      .isIn(['day', 'hour']).withMessage('Invalid interval (must be "day" or "hour")')
  ],
  analyticsController.getUrlAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/{shortCode}:
 *   delete:
 *     summary: Delete analytics for a URL
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics deleted successfully
 *       404:
 *         description: URL not found
 */
router.delete(
  '/:shortCode',
  authMiddleware.optional,
  param('shortCode').notEmpty().withMessage('Short code is required'),
  analyticsController.deleteAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/record:
 *   post:
 *     summary: Manually record a click event for a URL
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shortCode
 *             properties:
 *               shortCode:
 *                 type: string
 *               ip:
 *                 type: string
 *               userAgent:
 *                 type: string
 *               referrer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Click recorded successfully
 *       404:
 *         description: URL not found
 */
router.post(
  '/record',
  rateLimitMiddleware.recordClick,
  [
    body('shortCode').notEmpty().withMessage('Short code is required'),
    body('ip').optional().isIP().withMessage('Invalid IP address'),
    body('userAgent').optional().isString().withMessage('User agent must be a string'),
    body('referrer').optional().isString().withMessage('Referrer must be a string')
  ],
  analyticsController.recordClick
);

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics (admin only)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get(
  '/dashboard',
  authMiddleware.required,
  analyticsController.getDashboardAnalytics
);

module.exports = router;