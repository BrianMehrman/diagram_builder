/**
 * Redis Cache Configuration
 *
 * Configures Redis client for high-performance caching
 * Provides <100ms response times for cached queries
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Get or create Redis client instance
 * Singleton pattern ensures single client instance per application
 *
 * @returns Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redis) {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD;
    const db = parseInt(process.env.REDIS_DB || '0', 10);

    redis = new Redis({
      host,
      port,
      ...(password && { password }),
      db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.warn(`Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false
    });

    // Event listeners for monitoring
    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redis.on('connect', () => {
      console.warn('Redis client connected');
    });

    redis.on('ready', () => {
      console.warn('Redis client ready');
    });

    redis.on('close', () => {
      console.warn('Redis connection closed');
    });
  }

  return redis;
}

/**
 * Close the Redis client connection
 * Should be called on application shutdown
 */
export async function closeRedisClient(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export default getRedisClient();
