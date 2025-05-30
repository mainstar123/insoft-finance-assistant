import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config';
import { LoggerService } from './logger.service';
import { RedisService } from '@/core/integrations/redis/redis.service';

/**
 * Service for caching LLM responses and other data
 */
@Injectable()
export class CacheService implements OnModuleInit {
  private readonly defaultTtl: number;
  private enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
  ) {
    this.logger.setContext('CacheService');

    // Default TTL is 1 hour
    this.defaultTtl = 3600;

    // Cache is enabled by default in production
    this.enabled = process.env.CACHE_ENABLED !== 'false';
  }

  /**
   * Initialize cache service
   */
  async onModuleInit() {
    try {
      this.logger.customLog('Cache service initialized');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Failed to initialize cache service: ${errorMessage}`,
        errorStack,
      );

      // Disable cache if initialization fails
      this.enabled = false;
    }
  }

  /**
   * Generate a cache key from a prompt and model parameters
   * @param prompt The prompt text
   * @param modelParams Model parameters
   * @returns Cache key
   */
  generateCacheKey(prompt: string, modelParams: Record<string, any>): string {
    try {
      // Normalize prompt by trimming and converting to lowercase
      const normalizedPrompt = prompt.trim().toLowerCase();

      // Convert model parameters to a stable string representation
      const paramsString = JSON.stringify(this.sortObjectKeys(modelParams));

      // Combine prompt and parameters to create a unique key
      return `${normalizedPrompt}:${paramsString}`;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error generating cache key: ${errorMessage}`,
        errorStack,
      );

      // Return a fallback key
      return `fallback:${Date.now()}`;
    }
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    // Return null if cache is disabled
    if (!this.enabled) return null;

    try {
      const value = await this.redisService.get(`llm:${key}`);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error getting cache: ${errorMessage}`,
        errorStack,
      );
      return null;
    }
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (default: 1 hour)
   */
  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTtl,
  ): Promise<void> {
    // Do nothing if cache is disabled
    if (!this.enabled) return;

    try {
      await this.redisService.set(`llm:${key}`, JSON.stringify(value), ttl);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error setting cache: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    // Do nothing if cache is disabled
    if (!this.enabled) return;

    try {
      await this.redisService.del(`llm:${key}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error deleting cache: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Clear all cache with the llm: prefix
   */
  async clear(): Promise<void> {
    // Do nothing if cache is disabled
    if (!this.enabled) return;

    try {
      const keys = await this.redisService.keys('llm:*');
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.redisService.del(key)));
        this.logger.customLog(`Cleared ${keys.length} cache entries`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.customError(
        `Error clearing cache: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Sort object keys to ensure consistent serialization
   * @param obj Object to sort
   * @returns Object with sorted keys
   */
  private sortObjectKeys(obj: Record<string, any>): Record<string, any> {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObjectKeys(item));
    }

    return Object.keys(obj)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = this.sortObjectKeys(obj[key]);
          return result;
        },
        {} as Record<string, any>,
      );
  }
}
