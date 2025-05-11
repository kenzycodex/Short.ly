const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config');
const { notFound, handleError } = require('./presentation/middlewares/errorHandlerMiddleware');

// Routers
const urlRoutes = require('./presentation/routes/urlRoutes');
const analyticsRoutes = require('./presentation/routes/analyticsRoutes');
const redirectRoutes = require('./presentation/routes/redirectRoutes');
const healthRoutes = require('./presentation/routes/healthRoutes');

/**
 * Express server setup
 */
class Server {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupSwagger();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  /**
   * Set up middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors());
    
    // Request body parsers
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    
    // Compression
    this.app.use(compression());
    
    // Logging
    if (config.logging.requestLogging) {
      const morganFormat = config.isDev ? 'dev' : 'combined';
      this.app.use(morgan(morganFormat));
    }
  }

  /**
   * Set up API documentation (Swagger)
   */
  setupSwagger() {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Short.ly API Documentation',
          version: '1.0.0',
          description: 'API documentation for the Short.ly URL shortener service',
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
          contact: {
            name: 'API Support',
            url: 'https://short.ly/support',
            email: 'support@short.ly',
          },
        },
        servers: [
          {
            url: config.BASE_URL,
            description: `${config.APP_ENV} server`,
          },
        ],
      },
      apis: ['./src/presentation/routes/*.js'],
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);

    // Serve the Swagger docs
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    
    // Also serve the raw swagger.json
    this.app.get('/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  /**
   * Set up application routes
   */
  setupRoutes() {
    // API Routes
    this.app.use(`${config.api.fullPrefix}/urls`, urlRoutes);
    this.app.use(`${config.api.fullPrefix}/analytics`, analyticsRoutes);
    this.app.use(`${config.api.fullPrefix}/health`, healthRoutes);
    
    // Root level routes for redirection
    // NOTE: This should be the last route to avoid conflicts
    this.app.use('/', redirectRoutes);
  }

  /**
   * Set up error handlers
   */
  setupErrorHandlers() {
    // 404 handler
    this.app.use(notFound);
    
    // Global error handler
    this.app.use(handleError);
  }

  /**
   * Start the server
   * @returns {http.Server} Express server
   */
  start() {
    const port = config.PORT || 3000;
    
    return this.app.listen(port, () => {
      console.log(`Server running on port ${port} in ${config.NODE_ENV} mode`);
      console.log(`API Documentation: ${config.BASE_URL}/api-docs`);
    });
  }

  /**
   * Get Express app instance
   * @returns {express.Application} Express app
   */
  getApp() {
    return this.app;
  }
}

module.exports = Server;