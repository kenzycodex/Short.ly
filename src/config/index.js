const env = require('./env');

module.exports = {
  // Export all environment variables
  ...env,
  
  // Application settings
  app: {
    name: 'Short.ly',
    version: '1.0.0',
    description: 'Production-ready URL shortener',
  },
  
  // API versioning
  api: {
    prefix: '/api',
    version: 'v1',
    fullPrefix: '/api/v1',
  },
};