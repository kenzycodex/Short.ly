const express = require('express');
const { body, param } = require('express-validator');
const urlController = require('../controllers/urlController');
const authMiddleware = require('../middlewares/authMiddleware');
const rateLimitMiddleware = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/v1/urls:
 *   post:
 *     summary: Create a new short URL
 *     tags: [URLs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalUrl
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 description: The original URL to shorten
 *               customAlias:
 *                 type: string
 *                 description: Optional custom alias
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *     responses:
 *       201:
 *         description: URL created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Custom alias already in use
 */
router.post(
  '/',
  rateLimitMiddleware.createUrl,
  [
    body('originalUrl')
      .notEmpty().withMessage('Original URL is required')
      .isURL({ protocols: ['http', 'https'] }).withMessage('Invalid URL format'),
    body('customAlias')
      .optional()
      .isString().withMessage('Custom alias must be a string')
      .isLength({ min: 3, max: 50 }).withMessage('Custom alias must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Custom alias can only contain alphanumeric characters, hyphens, and underscores'),
    body('expiresAt')
      .optional()
      .isISO8601().withMessage('Invalid expiration date format')
  ],
  urlController.createShortUrl
);

/**
 * @swagger
 * /api/v1/urls/{shortCode}:
 *   get:
 *     summary: Get details of a URL by short code
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL details retrieved successfully
 *       404:
 *         description: URL not found
 */
router.get(
  '/:shortCode',
  param('shortCode').notEmpty().withMessage('Short code is required'),
  urlController.getUrl
);

/**
 * @swagger
 * /api/v1/urls/{shortCode}:
 *   patch:
 *     summary: Update a URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: URL updated successfully
 *       404:
 *         description: URL not found
 */
router.patch(
  '/:shortCode',
  authMiddleware.optional,
  [
    param('shortCode').notEmpty().withMessage('Short code is required'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    body('expiresAt')
      .optional()
      .isISO8601().withMessage('Invalid expiration date format')
  ],
  urlController.updateUrl
);

/**
 * @swagger
 * /api/v1/urls/{shortCode}:
 *   delete:
 *     summary: Delete a URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *       404:
 *         description: URL not found
 */
router.delete(
  '/:shortCode',
  authMiddleware.optional,
  param('shortCode').notEmpty().withMessage('Short code is required'),
  urlController.deleteUrl
);

/**
 * @swagger
 * /api/v1/urls:
 *   get:
 *     summary: Get all URLs (admin only)
 *     tags: [URLs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: URLs retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get(
  '/',
  authMiddleware.required,
  urlController.getAllUrls
);

/**
 * @swagger
 * /api/v1/urls/user/me:
 *   get:
 *     summary: Get URLs for the authenticated user
 *     tags: [URLs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: URLs retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  '/user/me',
  authMiddleware.required,
  urlController.getUserUrls
);

/**
 * @swagger
 * /api/v1/urls/alias/{alias}/check:
 *   get:
 *     summary: Check if a custom alias is available
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alias availability checked successfully
 */
router.get(
  '/alias/:alias/check',
  param('alias').notEmpty().withMessage('Alias is required'),
  urlController.checkAliasAvailability
);

module.exports = router;