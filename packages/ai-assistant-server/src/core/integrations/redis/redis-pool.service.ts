import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { IORedisPool, IORedisPoolOptions } from 'ts-ioredis-pool';
import Redis from 'ioredis';
import type { RedisConfig } from './redis.service';

@Injectable()
export class RedisPoolService implements OnModuleDestroy {
  private readonly pool: IORedisPool;

  constructor(config: RedisConfig) {
    console.log('🚀 ~ RedisPoolService ~ constructor ~ config.url:', config.url);
    const poolOptions = IORedisPoolOptions.fromUrl(config.url)
      .withIORedisOptions({
        maxRetriesPerRequest: config.clientOptions?.maxRetriesPerRequest ?? 3,
        enableReadyCheck: config.clientOptions?.enableReadyCheck ?? true,
        keyPrefix: config.clientOptions?.keyPrefix,
        family: 0,
      })
      .withPoolOptions({
        min: config.poolOptions?.min ?? 2,
        max: config.poolOptions?.max ?? 10,
        acquireTimeoutMillis: config.poolOptions?.acquireTimeoutMillis ?? 5000,
        evictionRunIntervalMillis:
          config.poolOptions?.evictionRunIntervalMillis ?? 30000,
        numTestsPerEvictionRun: config.poolOptions?.numTestsPerEvictionRun ?? 5,
        idleTimeoutMillis: config.poolOptions?.idleTimeoutMillis ?? 60000,
        fifo: true,
      });

    this.pool = new IORedisPool(poolOptions);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /**
   * Execute a function with a Redis client from the pool
   * @param fn Function that takes a Redis client and returns a promise
   * @returns Result of the function execution
   */
  async execute<T>(fn: (client: Redis) => Promise<T>): Promise<T> {
    return this.pool.execute(fn);
  }

  /**
   * Get the underlying Redis pool
   * @returns The Redis connection pool
   */
  getPool(): IORedisPool {
    return this.pool;
  }

  /**
   * Check if the Redis connection pool is healthy
   * @param timeoutMs Optional timeout in milliseconds (default: 2000)
   * @returns True if the connection is healthy, false otherwise
   */
  async isHealthy(timeoutMs = 2000): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(
          () => reject(new Error('Redis health check timeout')),
          timeoutMs,
        );
      });

      const healthCheckPromise = this.execute(async (client) => {
        const result = await client.ping();
        return result === 'PONG';
      });

      return await Promise.race([healthCheckPromise, timeoutPromise]);
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}
