const CreateShortUrl = require('../../../src/core/use-cases/CreateShortUrl');
const Url = require('../../../src/core/entities/Url');

// Mock dependencies
const mockUrlRepository = {
  findByOriginalUrl: jest.fn(),
  findByShortCode: jest.fn(),
  customAliasExists: jest.fn(),
  shortCodeExists: jest.fn(),
  create: jest.fn()
};

const mockCacheRepository = {
  set: jest.fn(),
  get: jest.fn(),
  delete: jest.fn()
};

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn().mockReturnValue('abc1234')
}));

// Test suite
describe('CreateShortUrl Use Case', () => {
  let createShortUrl;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create use case instance with mocked dependencies
    createShortUrl = new CreateShortUrl({
      urlRepository: mockUrlRepository,
      cacheRepository: mockCacheRepository
    });
    
    // Default mock responses
    mockUrlRepository.findByOriginalUrl.mockResolvedValue(null);
    mockUrlRepository.customAliasExists.mockResolvedValue(false);
    mockUrlRepository.shortCodeExists.mockResolvedValue(false);
    mockUrlRepository.create.mockImplementation(data => Promise.resolve({
      ...data,
      id: 'mock-id-123'
    }));
  });
  
  it('should create a new short URL with auto-generated code', async () => {
    // Arrange
    const urlData = {
      originalUrl: 'https://example.com/some/long/path'
    };
    
    // Act
    const result = await createShortUrl.execute(urlData);
    
    // Assert
    expect(mockUrlRepository.findByOriginalUrl).toHaveBeenCalledWith('https://example.com/some/long/path');
    expect(mockUrlRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      originalUrl: 'https://example.com/some/long/path',
      shortCode: 'abc1234',
      isActive: true
    }));
    expect(mockCacheRepository.set).toHaveBeenCalledWith(
      'url:abc1234',
      'https://example.com/some/long/path',
      expect.any(Number)
    );
    expect(result).toEqual(expect.objectContaining({
      originalUrl: 'https://example.com/some/long/path',
      shortCode: 'abc1234'
    }));
  });
  
  it('should create a URL with custom alias', async () => {
    // Arrange
    const urlData = {
      originalUrl: 'https://example.com/some/long/path',
      customAlias: 'my-custom-alias'
    };
    
    // Act
    const result = await createShortUrl.execute(urlData);
    
    // Assert
    expect(mockUrlRepository.customAliasExists).toHaveBeenCalledWith('my-custom-alias');
    expect(mockUrlRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      originalUrl: 'https://example.com/some/long/path',
      shortCode: 'my-custom-alias',
      customAlias: 'my-custom-alias'
    }));
    expect(result).toEqual(expect.objectContaining({
      shortCode: 'my-custom-alias',
      customAlias: 'my-custom-alias'
    }));
  });
  
  it('should return existing URL if original URL already exists', async () => {
    // Arrange
    const existingUrl = {
      id: 'existing-id',
      originalUrl: 'https://example.com/some/long/path',
      shortCode: 'existing123',
      createdAt: new Date()
    };
    mockUrlRepository.findByOriginalUrl.mockResolvedValue(existingUrl);
    
    const urlData = {
      originalUrl: 'https://example.com/some/long/path'
    };
    
    // Act
    const result = await createShortUrl.execute(urlData);
    
    // Assert
    expect(mockUrlRepository.findByOriginalUrl).toHaveBeenCalledWith('https://example.com/some/long/path');
    expect(mockUrlRepository.create).not.toHaveBeenCalled();
    expect(result).toEqual(existingUrl);
  });
  
  it('should throw error if custom alias is already taken', async () => {
    // Arrange
    mockUrlRepository.customAliasExists.mockResolvedValue(true);
    
    const urlData = {
      originalUrl: 'https://example.com/some/long/path',
      customAlias: 'taken-alias'
    };
    
    // Act & Assert
    await expect(createShortUrl.execute(urlData)).rejects.toThrow(
      'Custom alias already in use. Please choose another one.'
    );
    expect(mockUrlRepository.create).not.toHaveBeenCalled();
  });
  
  it('should throw error if custom alias format is invalid', async () => {
    // Arrange
    const urlData = {
      originalUrl: 'https://example.com/some/long/path',
      customAlias: 'invalid alias with spaces!'
    };
    
    // Act & Assert
    await expect(createShortUrl.execute(urlData)).rejects.toThrow(
      'Invalid custom alias format'
    );
    expect(mockUrlRepository.create).not.toHaveBeenCalled();
  });
  
  it('should normalize URL by adding https protocol', async () => {
    // Arrange
    const urlData = {
      originalUrl: 'example.com/some/path'
    };
    
    // Act
    await createShortUrl.execute(urlData);
    
    // Assert
    expect(mockUrlRepository.findByOriginalUrl).toHaveBeenCalledWith('https://example.com/some/path');
    expect(mockUrlRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      originalUrl: 'https://example.com/some/path'
    }));
  });
  
  it('should normalize URL by removing trailing slash', async () => {
    // Arrange
    const urlData = {
      originalUrl: 'https://example.com/some/path/'
    };
    
    // Act
    await createShortUrl.execute(urlData);
    
    // Assert
    expect(mockUrlRepository.findByOriginalUrl).toHaveBeenCalledWith('https://example.com/some/path');
    expect(mockUrlRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      originalUrl: 'https://example.com/some/path'
    }));
  });
  
  it('should create URL with expiration date', async () => {
    // Arrange
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const urlData = {
      originalUrl: 'https://example.com/some/long/path',
      expiresAt
    };
    
    // Act
    const result = await createShortUrl.execute(urlData);
    
    // Assert
    expect(mockUrlRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      expiresAt
    }));
    expect(result).toEqual(expect.objectContaining({
      expiresAt
    }));
  });
  
  it('should create URL with user ID', async () => {
    // Arrange
    const urlData = {
      originalUrl: 'https://example.com/some/long/path',
      userId: 'user123'
    };
    
    // Act
    const result = await createShortUrl.execute(urlData);
    
    // Assert
    expect(mockUrlRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user123'
    }));
    expect(result).toEqual(expect.objectContaining({
      userId: 'user123'
    }));
  });
  
  it('should not fail if caching fails', async () => {
    // Arrange
    mockCacheRepository.set.mockRejectedValue(new Error('Cache error'));
    
    const urlData = {
      originalUrl: 'https://example.com/some/long/path'
    };
    
    // Act & Assert
    await expect(createShortUrl.execute(urlData)).resolves.toBeDefined();
    expect(mockUrlRepository.create).toHaveBeenCalled();
  });
  
  it('should try multiple times if short code collision occurs', async () => {
    // Arrange
    mockUrlRepository.shortCodeExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValue(false);
    
    const urlData = {
      originalUrl: 'https://example.com/some/long/path'
    };
    
    // Act
    await createShortUrl.execute(urlData);
    
    // Assert
    expect(mockUrlRepository.shortCodeExists).toHaveBeenCalledTimes(3);
    expect(mockUrlRepository.create).toHaveBeenCalled();
  });
});