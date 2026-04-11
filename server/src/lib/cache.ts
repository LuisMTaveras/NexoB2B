import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    if ((process.env as any).REDIS_URL || (env as any).REDIS_URL) {
      try {
        const url = (process.env as any).REDIS_URL || (env as any).REDIS_URL;
        this.redis = new Redis(url, {
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => {
            if (times > 3) {
              this.isConnected = false;
              return null; // stop retrying
            }
            return Math.min(times * 50, 2000);
          }
        });

        this.redis.on('connect', () => {
          this.isConnected = true;
          logger.info('🚀 Redis cache connected');
        });

        this.redis.on('error', (err) => {
          this.isConnected = false;
          logger.warn('⚠️ Redis error, cache disabled:', err.message);
        });
      } catch (err) {
        logger.error('Failed to initialize Redis', err);
      }
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) return null;
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Set value in cache with TTL (seconds)
   */
  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    if (!this.isConnected || !this.redis) return;
    try {
      const data = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, data);
    } catch (err) {
      // ignore
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.redis) return;
    try {
      await this.redis.del(key);
    } catch (err) {
      // ignore
    }
  }

  /**
   * Clear keys matching a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.redis) return;
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      // ignore
    }
  }
}

export const cache = new CacheService();
