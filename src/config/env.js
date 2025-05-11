const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Set default to development
const environment = process.env.APP_ENV || 'development';
const envFileName = `.env.${environment === 'development' ? 'dev' : environment}`;
const envFilePath = path.resolve(process.cwd(), envFileName);

// Check if the file exists
if (!fs.existsSync(envFilePath)) {
  console.warn(`Warning: ${envFileName} not found. Using system environment variables.`);
} else {
  const result = dotenv.config({ path: envFilePath });
  if (result.error) {
    throw new Error(`Error loading environment from ${envFileName}: ${result.error}`);
  }
}

module.exports = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_ENV: process.env.APP_ENV || 'development',
  
  // Server settings
  PORT: parseInt(process.env.PORT, 10) || 3000,
  HOST: process.env.HOST || 'localhost:3000',
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  
  // MongoDB
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/shortlydb_dev',
    options: process.env.MONGO_OPTIONS ? JSON.parse(process.env.MONGO_OPTIONS) : {},
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    ssl: process.env.REDIS_SSL === 'true',
    ttl: parseInt(process.env.REDIS_TTL, 10) || 86400, // Default: 1 day
  },
  
  // URL Configuration
  url: {
    length: parseInt(process.env.URL_LENGTH, 10) || 7,
    domain: process.env.DOMAIN_URL || 'http://localhost:3000',
  },
  
  // External APIs
  apis: {
    ipInfo: {
      apiKey: process.env.IPINFO_API_KEY,
    },
  },
  
  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKey: process.env.AWS_ACCESS_KEY,
    secretKey: process.env.AWS_SECRET_KEY,
    lambda: {
      function: process.env.AWS_LAMBDA_FUNCTION || 'short-ly-redirect',
      useForRedirects: process.env.USE_LAMBDA_REDIRECTS === 'true',
    },
  },
  
  // Analytics settings
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    requestLogging: process.env.REQUEST_LOGGING === 'true',
  },
  
  // Security
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
    },
  },
  
  // Helper function to check if we're in production
  isProd: process.env.NODE_ENV === 'production',
  
  // Helper function to check if we're in development
  isDev: process.env.NODE_ENV === 'development',
};