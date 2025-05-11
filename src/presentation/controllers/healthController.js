const mongoClient = require('../../infrastructure/db/mongoClient');
const redisClient = require('../../infrastructure/cache/redisClient');
const config = require('../../config');

/**
 * Health Controller
 * 
 * Handles health check requests to monitor the application status.
 */
class HealthController {
  /**
   * Get application health status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {void}
   */
  async getHealth(req, res) {
    // Check MongoDB connection
    const mongoStatus = mongoClient.isConnectedToDb() ? 'connected' : 'disconnected';
    
    // Check Redis connection
    const redisStatus = redisClient.isConnectedToRedis() ? 'connected' : 'disconnected';
    
    // Determine overall status
    const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';
    
    // Prepare response
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: config.APP_ENV,
      services: {
        api: {
          status: 'running',
          version: config.app.version
        },
        mongo: {
          status: mongoStatus
        },
        redis: {
          status: redisStatus
        }
      },
      uptime: process.uptime()
    };
    
    // Send response with appropriate status code
    res.status(isHealthy ? 200 : 503).json(healthData);
  }
}

// Export controller methods
module.exports = new HealthController();