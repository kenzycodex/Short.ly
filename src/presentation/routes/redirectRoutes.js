const express = require('express');
const { param } = require('express-validator');
const urlController = require('../controllers/urlController');
const rateLimitMiddleware = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

/**
 * @swagger
 * /{shortCode}:
 *   get:
 *     summary: Redirect to the original URL
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to the original URL
 *       404:
 *         description: URL not found
 *       410:
 *         description: URL has been deactivated or expired
 */
router.get(
  '/:shortCode',
  rateLimitMiddleware.redirect,
  param('shortCode').notEmpty().withMessage('Short code is required'),
  urlController.redirectToUrl
);

/**
 * @swagger
 * /api/v1/resolve/{shortCode}:
 *   get:
 *     summary: Resolve a short URL without redirecting
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL resolved successfully
 *       404:
 *         description: URL not found
 */
router.get(
  '/api/v1/resolve/:shortCode',
  rateLimitMiddleware.resolve,
  param('shortCode').notEmpty().withMessage('Short code is required'),
  urlController.resolveUrl
);

module.exports = router;