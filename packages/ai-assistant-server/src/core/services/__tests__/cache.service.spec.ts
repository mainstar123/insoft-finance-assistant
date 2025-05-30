import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../cache.service';
import { LoggerService } from '../logger.service';
import { SentryService } from '../sentry.service';
import { ConfigService } from '../../../config/config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: Cache;
  let loggerService: LoggerService;
  let sentryService: SentryService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockSentryService = {
    captureException: jest.fn(),
    addBreadcrumb: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      const config = {
        CACHE_TTL: '3600',
        NODE_ENV: 'test',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SentryService, useValue: mockSentryService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    loggerService = module.get<LoggerService>(LoggerService);
    sentryService = module.get<SentryService>(SentryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should get a value from cache', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        `Cache hit for key: ${key}`,
        'CacheService',
      );
    });

    it('should return null for cache miss', async () => {
      const key = 'test-key';
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        `Cache miss for key: ${key}`,
        'CacheService',
      );
    });

    it('should handle errors', async () => {
      const key = 'test-key';
      const error = new Error('Cache error');
      mockCacheManager.get.mockRejectedValue(error);

      const result = await service.get(key);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Error getting from cache: ${error.message}`,
        error,
        'CacheService',
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('set', () => {
    it('should set a value in cache with default TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        value,
        3600 * 1000,
      );
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        `Cache set for key: ${key}`,
        'CacheService',
      );
    });

    it('should set a value in cache with custom TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 60;

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl * 1000);
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        `Cache set for key: ${key}`,
        'CacheService',
      );
    });

    it('should handle errors', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const error = new Error('Cache error');
      mockCacheManager.set.mockRejectedValue(error);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        value,
        3600 * 1000,
      );
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Error setting to cache: ${error.message}`,
        error,
        'CacheService',
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('delete', () => {
    it('should delete a value from cache', async () => {
      const key = 'test-key';

      await service.delete(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        `Cache delete for key: ${key}`,
        'CacheService',
      );
    });

    it('should handle errors', async () => {
      const key = 'test-key';
      const error = new Error('Cache error');
      mockCacheManager.del.mockRejectedValue(error);

      await service.delete(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Error deleting from cache: ${error.message}`,
        error,
        'CacheService',
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('reset', () => {
    it('should reset the cache', async () => {
      await service.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Cache reset',
        'CacheService',
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Cache error');
      mockCacheManager.reset.mockRejectedValue(error);

      await service.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Error resetting cache: ${error.message}`,
        error,
        'CacheService',
      );
      expect(mockSentryService.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if it exists', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const factory = jest.fn();
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.getOrSet(key, factory);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(factory).not.toHaveBeenCalled();
      expect(result).toEqual(value);
    });

    it('should call factory and cache result if value does not exist', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const factory = jest.fn().mockResolvedValue(value);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getOrSet(key, factory);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        value,
        3600 * 1000,
      );
      expect(result).toEqual(value);
    });

    it('should use custom TTL if provided', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 60;
      const factory = jest.fn().mockResolvedValue(value);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getOrSet(key, factory, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl * 1000);
      expect(result).toEqual(value);
    });

    it('should handle factory errors', async () => {
      const key = 'test-key';
      const error = new Error('Factory error');
      const factory = jest.fn().mockRejectedValue(error);
      mockCacheManager.get.mockResolvedValue(null);

      await expect(service.getOrSet(key, factory)).rejects.toThrow(error);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).not.toHaveBeenCalled();
      expect(mockSentryService.captureException).toHaveBeenCalledWith(error);
    });
  });
});
