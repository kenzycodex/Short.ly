const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const redis = require('redis-mock');
const { promisify } = require('util');

// Mock Redis client
jest.mock('../../../src/infrastructure/cache/redisClient', () => {
  const client = redis.createClient();
  
  // Promisify Redis methods
  client.get = promisify(client.get);
  client.set = promisify(client.set);
  client.del = promisify(client.del);
  client.connect = jest.fn().mockResolvedValue();
  client.disconnect = jest.fn().mockResolvedValue();
  client.isConnected = true;
  client.isConnectedToRedis = () => true;
  
  return client;
});

// Mock MongoDB client
jest.mock('../../../src/infrastructure/db/mongoClient', () => {
  return {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    isConnected: true,
    isConnectedToDb: () => true
  };
});

// Get application
const main = require('../../../src/main');
let app;
let mongoServer;

// Test fixture
const testUrl = {
  originalUrl: 'https://example.com/very/long/path',
  customAlias: 'test-url'
};

let createdUrlCode;
let authToken;

describe('URL API Endpoints', () => {
  // Setup before tests
  beforeAll(async () => {
    // Create in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set environment variables
    process.env.MONGO_URI = mongoUri;
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'test';
    
    // Start application
    const server = await main();
    app = server.getApp();
    
    // Create a test user and get auth token
    const authResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    
    authToken = authResponse.body.data.token;
  });
  
  // Cleanup after tests
  afterAll(async () => {
    // Cleanup MongoDB
    if (mongoServer) {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  });
  
  describe('POST /api/v1/urls', () => {
    it('should create a new short URL', async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .send(testUrl)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('originalUrl', testUrl.originalUrl);
      expect(response.body.data).toHaveProperty('shortCode', testUrl.customAlias);
      expect(response.body.data).toHaveProperty('shortUrl');
      
      // Save for later tests
      createdUrlCode = response.body.data.shortCode;
    });
    
    it('should return 400 for invalid URL', async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .send({
          originalUrl: 'not-a-valid-url'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('errors');
    });
    
    it('should return 409 for duplicate custom alias', async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .send({
          originalUrl: 'https://example.com/another/path',
          customAlias: testUrl.customAlias
        })
        .expect(409);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already in use');
    });
    
    it('should create URL with authentication', async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          originalUrl: 'https://example.com/authenticated/path'
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userId');
    });
  });
  
  describe('GET /api/v1/urls/:shortCode', () => {
    it('should get details of a URL by short code', async () => {
      const response = await request(app)
        .get(`/api/v1/urls/${createdUrlCode}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('originalUrl', testUrl.originalUrl);
      expect(response.body.data).toHaveProperty('shortCode', createdUrlCode);
    });
    
    it('should return 404 for non-existent URL', async () => {
      await request(app)
        .get('/api/v1/urls/nonexistent')
        .expect(404);
    });
  });
  
  describe('PATCH /api/v1/urls/:shortCode', () => {
    it('should update a URL', async () => {
      const response = await request(app)
        .patch(`/api/v1/urls/${createdUrlCode}`)
        .send({
          isActive: false
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isActive', false);
    });
    
    it('should return 404 for non-existent URL', async () => {
      await request(app)
        .patch('/api/v1/urls/nonexistent')
        .send({
          isActive: false
        })
        .expect(404);
    });
    
    it('should return 400 for invalid update data', async () => {
      await request(app)
        .patch(`/api/v1/urls/${createdUrlCode}`)
        .send({
          expiresAt: 'not-a-date'
        })
        .expect(400);
    });
  });
  
  describe('DELETE /api/v1/urls/:shortCode', () => {
    it('should delete a URL', async () => {
      const response = await request(app)
        .delete(`/api/v1/urls/${createdUrlCode}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });
    
    it('should return 404 after URL is deleted', async () => {
      await request(app)
        .get(`/api/v1/urls/${createdUrlCode}`)
        .expect(404);
    });
  });
  
  describe('GET /api/v1/urls/alias/:alias/check', () => {
    it('should check if alias is available', async () => {
      const response = await request(app)
        .get('/api/v1/urls/alias/available-alias/check')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('alias', 'available-alias');
      expect(response.body.data).toHaveProperty('isAvailable', true);
    });
    
    it('should check if alias is unavailable', async () => {
      // First create a URL with the alias
      await request(app)
        .post('/api/v1/urls')
        .send({
          originalUrl: 'https://example.com/alias-test',
          customAlias: 'taken-alias'
        });
      
      // Then check if it's available
      const response = await request(app)
        .get('/api/v1/urls/alias/taken-alias/check')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('alias', 'taken-alias');
      expect(response.body.data).toHaveProperty('isAvailable', false);
    });
  });
  
  describe('GET /:shortCode', () => {
    it('should redirect to the original URL', async () => {
      // First create a URL
      const createResponse = await request(app)
        .post('/api/v1/urls')
        .send({
          originalUrl: 'https://example.com/redirect-test',
          customAlias: 'redirect-test'
        })
        .expect(201);
      
      // Then try to get redirected
      const response = await request(app)
        .get('/redirect-test')
        .expect(302);
      
      expect(response.header.location).toBe('https://example.com/redirect-test');
    });
    
    it('should return 404 for non-existent short code', async () => {
      await request(app)
        .get('/nonexistent-code')
        .expect(404);
    });
    
    it('should return 410 for inactive URL', async () => {
      // First create a URL
      const createResponse = await request(app)
        .post('/api/v1/urls')
        .send({
          originalUrl: 'https://example.com/inactive-test',
          customAlias: 'inactive-test'
        })
        .expect(201);
      
      // Deactivate the URL
      await request(app)
        .patch('/api/v1/urls/inactive-test')
        .send({
          isActive: false
        })
        .expect(200);
      
      // Try to access the URL
      await request(app)
        .get('/inactive-test')
        .expect(410);
    });
  });
  
  describe('GET /api/v1/urls/user/me', () => {
    it('should get URLs for the authenticated user', async () => {
      // Create a URL with authentication
      await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          originalUrl: 'https://example.com/user-url',
          customAlias: 'user-url'
        })
        .expect(201);
      
      // Get user's URLs
      const response = await request(app)
        .get('/api/v1/urls/user/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('urls');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.urls.length).toBeGreaterThan(0);
      expect(response.body.data.urls[0]).toHaveProperty('originalUrl');
    });
    
    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/urls/user/me')
        .expect(401);
    });
  });
});