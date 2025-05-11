const winston = require('winston');
const config = require('../config');

/**
 * Logger utility based on Winston
 * 
 * Provides structured logging for the application with different log levels
 * and formats based on the environment.
 */
class Logger {
  constructor() {
    const { format } = winston;
    
    // Define log format based on environment
    let logFormat;
    if (config.isDev) {
      // For development, use colorized console output
      logFormat = format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.colorize(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      );
    } else {
      // For production, use structured JSON
      logFormat = format.combine(
        format.timestamp(),
        format.json()
      );
    }
    
    // Create logger with console transport
    this.logger = winston.createLogger({
      level: config.logging.level || 'info',
      format: logFormat,
      defaultMeta: { service: 'shortly' },
      transports: [
        new winston.transports.Console({
          stderrLevels: ['error'],
        }),
      ],
      exitOnError: false,
    });
    
    // Add file transport in production
    if (!config.isDev && config.logging.logToFile) {
      this.logger.add(
        new winston.transports.File({
          filename: 'shortly-error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        })
      );
      
      this.logger.add(
        new winston.transports.File({
          filename: 'shortly.log',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        })
      );
    }
  }

  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or additional metadata
   */
  error(message, error = {}) {
    let meta = {};
    
    if (error instanceof Error) {
      meta = {
        error: {
          message: error.message,
          stack: error.stack,
          ...error,
        },
      };
    } else {
      meta = error;
    }
    
    this.logger.error(message, meta);
  }

  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Create a child logger with additional metadata
   * @param {Object} meta - Default metadata for the child logger
   * @returns {Logger} - Child logger instance
   */
  child(meta = {}) {
    const childLogger = new Logger();
    childLogger.logger = this.logger.child(meta);
    return childLogger;
  }

  /**
   * Stream interface for Morgan HTTP logger
   * @returns {Object} - Stream interface
   */
  get morganStream() {
    return {
      write: (message) => {
        // Remove the trailing newline
        this.info(message.trim(), { source: 'http' });
      },
    };
  }
}

// Create a singleton instance
const logger = new Logger();

module.exports = logger;