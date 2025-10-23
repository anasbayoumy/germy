import Redis from 'ioredis';
import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: string;
}

export class CacheService {
  private redis: Redis;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number.parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: Number.parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }

  // Basic Cache Operations
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      }
      this.stats.misses++;
      return null;
    } catch (error: any) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  // Advanced Cache Operations
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const value = await fetcher();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      throw error;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map((value: string | null) => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const serializedPairs: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs.push(key, JSON.stringify(value as any));
      }

      await this.redis.mset(...serializedPairs);

      if (ttl) {
        const pipeline = this.redis.pipeline();
        for (const key of Object.keys(keyValuePairs)) {
          pipeline.expire(key, ttl);
        }
        await pipeline.exec();
      }

      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  // Pattern-based Operations
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.redis.del(...keys);
    } catch (error) {
      logger.error('Cache deletePattern error:', error);
      return 0;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      logger.error('Cache getKeys error:', error);
      return [];
    }
  }

  // Hash Operations
  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache hget error:', error);
      return null;
    }
  }

  async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      const result = await this.redis.hset(key, field, JSON.stringify(value));
      return result >= 0;
    } catch (error) {
      logger.error('Cache hset error:', error);
      return false;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    try {
      const hash = await this.redis.hgetall(key);
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error('Cache hgetall error:', error);
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.redis.hdel(key, field);
      return result > 0;
    } catch (error) {
      logger.error('Cache hdel error:', error);
      return false;
    }
  }

  // List Operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serialized = values.map((v: any) => JSON.stringify(v));
      return await this.redis.lpush(key, ...serialized);
    } catch (error) {
      logger.error('Cache lpush error:', error);
      return 0;
    }
  }

  async rpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serialized = values.map((v: any) => JSON.stringify(v));
      return await this.redis.rpush(key, ...serialized);
    } catch (error) {
      logger.error('Cache rpush error:', error);
      return 0;
    }
  }

  async lpop<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.lpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache lpop error:', error);
      return null;
    }
  }

  async rpop<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache rpop error:', error);
      return null;
    }
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    try {
      const values = await this.redis.lrange(key, start, stop);
      return values.map(v => JSON.parse(v));
    } catch (error) {
      logger.error('Cache lrange error:', error);
      return [];
    }
  }

  // Set Operations
  async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      const serialized = members.map((m: any) => JSON.stringify(m));
      return await this.redis.sadd(key, ...serialized);
    } catch (error) {
      logger.error('Cache sadd error:', error);
      return 0;
    }
  }

  async smembers<T>(key: string): Promise<T[]> {
    try {
      const members = await this.redis.smembers(key);
      return members.map((m: string) => JSON.parse(m));
    } catch (error) {
      logger.error('Cache smembers error:', error);
      return [];
    }
  }

  async srem(key: string, ...members: any[]): Promise<number> {
    try {
      const serialized = members.map((m: any) => JSON.stringify(m));
      return await this.redis.srem(key, ...serialized);
    } catch (error) {
      logger.error('Cache srem error:', error);
      return 0;
    }
  }

  // TTL Operations
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Cache ttl error:', error);
      return -1;
    }
  }

  // Cache Statistics
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const keys = await this.redis.dbsize();
      
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys,
        memory: info,
      };
    } catch (error) {
      logger.error('Cache getStats error:', error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: 0,
        memory: 'unknown',
      };
    }
  }

  // Cache Invalidation
  async invalidateUser(userId: string): Promise<void> {
    try {
      const patterns = [
        `user:${userId}:*`,
        `users:*:${userId}`,
        `profile:${userId}:*`,
        `preferences:${userId}:*`,
        `settings:${userId}:*`,
      ];

      for (const pattern of patterns) {
        await this.deletePattern(pattern);
      }

      logger.info(`Invalidated cache for user ${userId}`);
    } catch (error) {
      logger.error('Cache invalidateUser error:', error);
    }
  }

  async invalidateCompany(companyId: string): Promise<void> {
    try {
      const patterns = [
        `company:${companyId}:*`,
        `companies:*:${companyId}`,
        `team:*:${companyId}:*`,
        `department:*:${companyId}:*`,
        `users:*:${companyId}:*`,
      ];

      for (const pattern of patterns) {
        await this.deletePattern(pattern);
      }

      logger.info(`Invalidated cache for company ${companyId}`);
    } catch (error) {
      logger.error('Cache invalidateCompany error:', error);
    }
  }

  async invalidateTeam(teamId: string): Promise<void> {
    try {
      const patterns = [
        `team:${teamId}:*`,
        `teams:*:${teamId}`,
        `members:${teamId}:*`,
      ];

      for (const pattern of patterns) {
        await this.deletePattern(pattern);
      }

      logger.info(`Invalidated cache for team ${teamId}`);
    } catch (error) {
      logger.error('Cache invalidateTeam error:', error);
    }
  }

  async invalidateDepartment(departmentId: string): Promise<void> {
    try {
      const patterns = [
        `department:${departmentId}:*`,
        `departments:*:${departmentId}`,
        `users:*:${departmentId}:*`,
      ];

      for (const pattern of patterns) {
        await this.deletePattern(pattern);
      }

      logger.info(`Invalidated cache for department ${departmentId}`);
    } catch (error) {
      logger.error('Cache invalidateDepartment error:', error);
    }
  }

  // Cache Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }

  // Close Connection
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();
