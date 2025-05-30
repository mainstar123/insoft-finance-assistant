import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface RedisConfig {
  url: string;
  pooled?: boolean;
  poolOptions?: {
    min?: number;
    max?: number;
    acquireTimeoutMillis?: number;
    evictionRunIntervalMillis?: number;
    numTestsPerEvictionRun?: number;
    idleTimeoutMillis?: number;
  };
  clientOptions?: {
    maxRetriesPerRequest?: number;
    enableReadyCheck?: boolean;
    keyPrefix?: string;
  };
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: RedisConfig | string) {
    console.log('🚀 ~ RedisService ~ constructor ~ config:', config);
    if (typeof config === 'string') {
      // Legacy string URL constructor
      this.client = new Redis(config, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        family: 0,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
      });
    } else {
      // New config object constructor
      this.client = new Redis(config.url, {
        maxRetriesPerRequest: config.clientOptions?.maxRetriesPerRequest ?? 3,
        enableReadyCheck: config.clientOptions?.enableReadyCheck ?? true,
        keyPrefix: config.clientOptions?.keyPrefix,
        family: 0,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
      });
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (ttlSeconds !== undefined) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async flushdb(): Promise<'OK'> {
    return this.client.flushdb();
  }

  getClient(): Redis {
    return this.client;
  }
}
