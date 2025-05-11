/**
 * Test setup file for Jest
 * 
 * This file runs before each test file is executed.
 * It sets up the testing environment, mocks, and global utilities.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.APP_ENV = 'test';
process.env.PORT = '3000';
process.env.BASE_URL = 'http://localhost:3000';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Silence console output during tests to keep output clean
// Comment these out if you want to see logs during test runs
global.console.log = jest.fn();
global.console.info = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();

// Mock Date.now() to return a fixed timestamp for deterministic tests
const fixedDate = new Date('2023-01-01T12:00:00Z');
global.Date.now = jest.fn(() => fixedDate.getTime());

// Helper function to create mock requests for testing controllers directly
global.createMockRequest = (options = {}) => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    ip: options.ip || '127.0.0.1',
    get: (header) => (options.headers || {})[header],
    user: options.user || null
  };
};

// Helper function to create mock responses for testing controllers directly
global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    contentType: jest.fn().mockReturnThis(),
    statusCode: 200,
    sentData: null
  };
  
  // Track actual JSON data sent
  res.json = jest.fn((data) => {
    res.sentData = data;
    return res;
  });
  
  return res;
};

// Helper function to create mock next function for testing controllers directly
global.createMockNext = () => {
  return jest.fn();
};

// Add custom Jest matchers
expect.extend({
  toBeType(received, expected) {
    const type = typeof received;
    const pass = type === expected;
    return {
      pass,
      message: () => `Expected ${received} to be of type ${expected}, but was ${type}`
    };
  },
  
  toHaveStatus(received, expected) {
    const { statusCode } = received;
    const pass = statusCode === expected;
    return {
      pass,
      message: () => `Expected response to have status ${expected}, but was ${statusCode}`
    };
  }
});