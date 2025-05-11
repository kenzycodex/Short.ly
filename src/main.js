const Server = require('./server');
const mongoClient = require('./infrastructure/db/mongoClient');
const redisClient = require('./infrastructure/cache/redisClient');
const config = require('./config');

/**
 * Main application entry point
 */
async function main() {
  try {
    console.log(`Starting Short.ly in ${config.APP_ENV} environment`);
    
    // Connect to MongoDB
    await mongoClient.connect();
    console.log('MongoDB connected');
    
    // Connect to Redis
    await redisClient.connect();
    console.log('Redis connected');
    
    // Create and start the server
    const server = new Server();
    server.start();
    
    // Set up graceful shutdown
    setupGracefulShutdown(server);
    
    return server;
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

/**
 * Set up graceful shutdown handlers
 * @param {Server} server - Express server instance
 */
function setupGracefulShutdown(server) {
  // Handle SIGTERM (e.g., from Docker, Kubernetes, etc.)
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await shutdown(server);
  });
  
  // Handle SIGINT (e.g., Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await shutdown(server);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await shutdown(server);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
    await shutdown(server);
  });
}

/**
 * Shutdown the application gracefully
 * @param {Server} server - Express server instance
 */
async function shutdown(server) {
  try {
    // Close the HTTP server
    if (server && server.getApp().listening) {
      await new Promise((resolve) => {
        server.getApp().close(resolve);
      });
      console.log('HTTP server closed');
    }
    
    // Disconnect from Redis
    await redisClient.disconnect();
    console.log('Redis disconnected');
    
    // Disconnect from MongoDB
    await mongoClient.disconnect();
    console.log('MongoDB disconnected');
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;