/**
 * Redis Cache Utilities
 *
 * Provides high-level caching operations with JSON serialization
 * Default TTL: 5 minutes (300 seconds)
 */

import { getRedisClient } from './redis-config';

/**
 * Default TTL for cached items (5 minutes)
 */
export const DEFAULT_CACHE_TTL = 300;

/**
 * Retrieve a value from cache and parse as JSON
 *
 * @param key - Cache key
 * @returns Parsed value or null if not found
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Cache get error for key "${key}":`, error);
    return null;
  }
}

/**
 * Store a value in cache with JSON serialization
 *
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
export async function set<T>(key: string, value: T, ttl: number = DEFAULT_CACHE_TTL): Promise<void> {
  try {
    const redis = getRedisClient();
    const serialized = JSON.stringify(value);

    await redis.setex(key, ttl, serialized);
  } catch (error) {
    console.error(`Cache set error for key "${key}":`, error);
    throw error;
  }
}

/**
 * Invalidate (delete) a single cache key
 *
 * @param key - Cache key to delete
 */
export async function invalidate(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (error) {
    console.error(`Cache invalidate error for key "${key}":`, error);
    throw error;
  }
}

/**
 * Invalidate all cache keys matching a pattern
 * Uses SCAN to avoid blocking the Redis server
 *
 * @param pattern - Redis pattern (e.g., "diagram-builder:query:*")
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys: string[] = [];

    // Use SCAN to find all matching keys without blocking
    let cursor = '0';
    do {
      const [nextCursor, matchedKeys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );

      cursor = nextCursor;
      keys.push(...matchedKeys);
    } while (cursor !== '0');

    // Delete all matched keys in a pipeline for efficiency
    if (keys.length > 0) {
      const pipeline = redis.pipeline();
      keys.forEach(key => pipeline.del(key));
      await pipeline.exec();
    }
  } catch (error) {
    console.error(`Cache invalidatePattern error for pattern "${pattern}":`, error);
    throw error;
  }
}
