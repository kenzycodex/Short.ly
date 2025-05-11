/**
 * AWS Lambda Function for URL Redirection
 * 
 * This function handles URL redirection in a serverless manner.
 * It can be deployed to AWS Lambda and configured with API Gateway.
 */

const https = require('https');
const url = require('url');

// API base URL from environment variables (will be set during deployment)
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.short.ly';
const DOMAIN_URL = process.env.DOMAIN_URL || 'https://short.ly';

/**
 * Lambda Handler Function
 * 
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context
 * @returns {Promise<Object>} - Lambda response
 */
exports.handler = async (event, context) => {
  try {
    console.log('Event received:', JSON.stringify(event));
    
    // Extract the short code from the path
    // This will be different depending on how you set up API Gateway
    let shortCode;
    
    // Extract from different possible sources
    if (event.pathParameters && event.pathParameters.shortCode) {
      // API Gateway REST API
      shortCode = event.pathParameters.shortCode;
    } else if (event.path) {
      // API Gateway HTTP API or direct invocation
      shortCode = event.path.split('/').filter(Boolean)[0];
    } else if (event.shortCode) {
      // Direct invocation with shortCode
      shortCode = event.shortCode;
    } else {
      return formatResponse(400, { error: 'Short code is required' });
    }
    
    // Collect request context for analytics
    const requestContext = {
      ip: getClientIp(event),
      userAgent: getHeader(event, 'user-agent'),
      referrer: getHeader(event, 'referer') || getHeader(event, 'referrer')
    };
    
    console.log('Resolving short code:', shortCode);
    console.log('Request context:', requestContext);
    
    // Call the API to resolve the URL
    const resolveResponse = await callApi(`/api/v1/resolve/${shortCode}`, requestContext);
    
    if (resolveResponse.originalUrl) {
      // Record analytics asynchronously (don't wait for it)
      recordAnalytics(shortCode, requestContext).catch(err => {
        console.error('Error recording analytics:', err);
      });
      
      // Return redirect response
      if (event.source === 'api-gateway' || event.requestContext) {
        // For API Gateway, return a redirect
        return formatResponse(302, null, {
          'Location': resolveResponse.originalUrl,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
      } else {
        // For direct invocation, return the URL
        return {
          statusCode: 302,
          originalUrl: resolveResponse.originalUrl,
          headers: {
            'Location': resolveResponse.originalUrl
          }
        };
      }
    } else {
      // URL not found
      return formatResponse(404, { 
        error: 'URL not found',
        message: 'The requested short URL does not exist or has been removed.' 
      });
    }
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    
    return formatResponse(500, { 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request.'
    });
  }
};

/**
 * Call the API to resolve or record analytics
 * @param {string} path - API path
 * @param {Object} requestContext - Request context
 * @param {string} [method='GET'] - HTTP method
 * @param {Object} [body=null] - Request body
 * @returns {Promise<Object>} - API response
 */
async function callApi(path, requestContext = {}, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const apiUrl = url.parse(`${API_BASE_URL}${path}`);
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': requestContext.ip,
        'User-Agent': requestContext.userAgent,
        'Referer': requestContext.referrer
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Try to parse as JSON
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            // If not JSON, return the raw data
            parsedData = { data };
          }
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Record analytics for a click
 * @param {string} shortCode - Short code
 * @param {Object} requestContext - Request context
 * @returns {Promise<void>}
 */
async function recordAnalytics(shortCode, requestContext) {
  try {
    await callApi('/api/v1/analytics/record', requestContext, 'POST', {
      shortCode,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      referrer: requestContext.referrer
    });
  } catch (error) {
    console.error('Error recording analytics:', error);
  }
}

/**
 * Format a Lambda response
 * @param {number} statusCode - HTTP status code
 * @param {Object|null} body - Response body
 * @param {Object} [headers={}] - Response headers
 * @returns {Object} - Formatted response
 */
function formatResponse(statusCode, body = null, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : null
  };
}

/**
 * Get client IP from event
 * @param {Object} event - Lambda event
 * @returns {string} - Client IP
 */
function getClientIp(event) {
  // Try different possible locations
  if (event.headers && event.headers['x-forwarded-for']) {
    // Get the first IP if there are multiple
    return event.headers['x-forwarded-for'].split(',')[0].trim();
  }
  
  if (event.requestContext && event.requestContext.identity) {
    return event.requestContext.identity.sourceIp;
  }
  
  if (event.requestContext && event.requestContext.http && event.requestContext.http.sourceIp) {
    return event.requestContext.http.sourceIp;
  }
  
  if (event.ip) {
    return event.ip;
  }
  
  return '0.0.0.0';
}

/**
 * Get header value from event
 * @param {Object} event - Lambda event
 * @param {string} headerName - Header name
 * @returns {string|null} - Header value
 */
function getHeader(event, headerName) {
  if (!event.headers) {
    return null;
  }
  
  // Try case-sensitive first
  if (event.headers[headerName]) {
    return event.headers[headerName];
  }
  
  // Try case-insensitive
  headerName = headerName.toLowerCase();
  for (const key in event.headers) {
    if (key.toLowerCase() === headerName) {
      return event.headers[key];
    }
  }
  
  return null;
}