const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Get application health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *       503:
 *         description: Application is unhealthy
 */
router.get('/', healthController.getHealth);

module.exports = router;