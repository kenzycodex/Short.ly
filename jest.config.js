/**
 * Jest configuration for Short.ly
 */
module.exports = {
    // Base testing directory
    roots: ['<rootDir>/tests'],
    
    // Test file pattern
    testMatch: [
      '**/__tests__/**/*.js?(x)',
      '**/?(*.)+(spec|test).js?(x)'
    ],
    
    // Ignore patterns
    testPathIgnorePatterns: [
      '/node_modules/',
      '/coverage/',
      '/dist/'
    ],
    
    // Environment
    testEnvironment: 'node',
    
    // Code coverage
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/main.js',
      '!**/node_modules/**',
      '!**/vendor/**'
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    },
    
    // Test setup
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    // Mock files
    moduleNameMapper: {
      '\\.css$': '<rootDir>/tests/mocks/styleMock.js',
      '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/mocks/fileMock.js'
    },
    
    // Timeouts
    testTimeout: 10000,
    
    // Output
    verbose: true,
    
    // Modules
    transform: {
      '^.+\\.jsx?$': 'babel-jest'
    },
    
    // Clear mocks between each test
    clearMocks: true,
    
    // Allow module mocking
    resetModules: true,
    
    // Cache control
    cache: true,
    
    // Report slow tests
    slowTestThreshold: 5,
    
    // Error handling
    bail: 0, // Don't bail on first test failure
    
    // Maximum number of workers
    maxWorkers: '50%', // Use half of available CPU cores
  };