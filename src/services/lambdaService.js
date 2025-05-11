const AWS = require('aws-sdk');
const config = require('../config');

/**
 * AWS Lambda Service
 * 
 * Service for interacting with AWS Lambda for serverless URL redirection.
 */
class LambdaService {
  constructor() {
    // Configure AWS credentials
    AWS.config.update({
      region: config.aws.region,
      accessKeyId: config.aws.accessKey,
      secretAccessKey: config.aws.secretKey
    });
    
    this.lambda = new AWS.Lambda();
    this.lambdaFunctionName = config.aws.lambda.function;
    this.useForRedirects = config.aws.lambda.useForRedirects;
  }

  /**
   * Check if Lambda redirection is enabled
   * @returns {boolean} - True if enabled
   */
  isLambdaRedirectEnabled() {
    return this.useForRedirects &&
      Boolean(config.aws.accessKey) &&
      Boolean(config.aws.secretKey) &&
      Boolean(this.lambdaFunctionName);
  }

  /**
   * Deploy a Lambda function for URL redirection
   * @param {Object} options - Deployment options
   * @param {string} options.runtime - Lambda runtime (e.g., 'nodejs16.x')
   * @param {string} options.handlerCode - Lambda handler code
   * @returns {Promise<Object>} - Deployment result
   */
  async deployRedirectFunction(options = {
    runtime: 'nodejs16.x',
    handlerCode: null
  }) {
    // Default handler code if not provided
    const code = options.handlerCode || this._getDefaultHandlerCode();
    
    // Check if the function already exists
    let functionExists = false;
    try {
      await this.lambda.getFunction({ FunctionName: this.lambdaFunctionName }).promise();
      functionExists = true;
    } catch (error) {
      if (error.code !== 'ResourceNotFoundException') {
        throw error;
      }
    }
    
    if (functionExists) {
      // Update the existing function
      return await this.lambda.updateFunctionCode({
        FunctionName: this.lambdaFunctionName,
        ZipFile: await this._createZipBuffer(code),
        Publish: true
      }).promise();
    } else {
      // Create a new function
      return await this.lambda.createFunction({
        FunctionName: this.lambdaFunctionName,
        Runtime: options.runtime,
        Role: config.aws.lambdaRole, // IAM role ARN
        Handler: 'index.handler',
        Code: {
          ZipFile: await this._createZipBuffer(code)
        },
        Description: 'Short.ly URL Redirection Lambda Function',
        Timeout: 5, // 5 seconds
        MemorySize: 128, // 128 MB
        Publish: true,
        Environment: {
          Variables: {
            API_BASE_URL: config.BASE_URL,
            DOMAIN_URL: config.url.domain
          }
        }
      }).promise();
    }
  }

  /**
   * Invoke the Lambda function for redirect
   * @param {string} shortCode - Short code to resolve
   * @param {Object} requestContext - Request context
   * @returns {Promise<Object>} - Redirect info from Lambda
   */
  async invokeRedirect(shortCode, requestContext) {
    if (!this.isLambdaRedirectEnabled()) {
      throw new Error('Lambda redirection is not enabled');
    }
    
    try {
      const payload = {
        shortCode,
        requestContext: {
          ip: requestContext.ip,
          userAgent: requestContext.userAgent,
          referrer: requestContext.referrer
        }
      };
      
      const params = {
        FunctionName: this.lambdaFunctionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload)
      };
      
      const response = await this.lambda.invoke(params).promise();
      
      // Parse payload from response
      const responsePayload = JSON.parse(response.Payload);
      
      // Check for Lambda errors
      if (response.FunctionError) {
        throw new Error(`Lambda Error: ${responsePayload.errorMessage}`);
      }
      
      return responsePayload;
    } catch (error) {
      console.error('Error invoking Lambda for redirect:', error);
      throw error;
    }
  }

  /**
   * Create a ZIP buffer for Lambda deployment
   * @param {string} code - Lambda handler code
   * @returns {Promise<Buffer>} - ZIP buffer
   * @private
   */
  async _createZipBuffer(code) {
    const JSZip = require('jszip');
    const zip = new JSZip();
    
    // Add the handler code
    zip.file('index.js', code);
    
    // Generate the ZIP buffer
    return await zip.generateAsync({ type: 'nodebuffer' });
  }

  /**
   * Get default Lambda handler code
   * @returns {string} - Default handler code
   * @private
   */
  _getDefaultHandlerCode() {
    return `
const https = require('https');
const url = require('url');

// API base URL from environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.short.ly';
const DOMAIN_URL = process.env.DOMAIN_URL || 'https://short.ly';

exports.handler = async (event) => {
  try {
    console.log('Event:', JSON.stringify(event));
    
    // Extract short code and request context
    const { shortCode, requestContext } = event;
    
    if (!shortCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Short code is required' })
      };
    }
    
    // Call the API to resolve the URL
    const resolveResponse = await callApi('/api/v1/resolve/' + shortCode, requestContext);
    
    if (resolveResponse.originalUrl) {
      // Record analytics asynchronously (don't wait for it)
      recordAnalytics(shortCode, requestContext).catch(err => {
        console.error('Error recording analytics:', err);
      });
      
      return {
        statusCode: 302,
        originalUrl: resolveResponse.originalUrl,
        headers: {
          'Location': resolveResponse.originalUrl
        }
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'URL not found' })
      };
    }
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

/**
 * Call the API to resolve or record analytics
 * @param {string} path - API path
 * @param {Object} requestContext - Request context
 * @returns {Promise<Object>} - API response
 */
async function callApi(path, requestContext = {}) {
  return new Promise((resolve, reject) => {
    const apiUrl = url.parse(\`\${API_BASE_URL}\${path}\`);
    
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.path,
      method: 'GET',
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
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
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
    await callApi(\`/api/v1/analytics/record\`, {
      method: 'POST',
      body: {
        shortCode,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
        referrer: requestContext.referrer
      }
    });
  } catch (error) {
    console.error('Error recording analytics:', error);
  }
}`;
  }
}

// Export a singleton instance
module.exports = new LambdaService();