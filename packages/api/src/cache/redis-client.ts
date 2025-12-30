/**
 * Redis Cache Client
 *
 * Handles Redis connection, health checks, and lifecycle management
 */

import { getRedisClient, closeRedisClient } from './redis-config';

/**
 * Connect to Redis cache
 * Verifies connection by pinging Redis server
 *
 * @throws Error if connection fails
 */
export async function connectRedis(): Promise<void> {
  console.warn('Connecting to Redis cache...');

  try {
    const redis = getRedisClient();

    // Verify connection with ping
    const pong = await redis.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis ping response invalid');
    }

    console.warn('✓ Redis cache connected successfully');
  } catch (error) {
    console.error('Failed to connect to Redis cache:', error);
    throw new Error(`Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check Redis cache health
 * Verifies cache connectivity and responsiveness
 *
 * @returns true if cache is healthy, false otherwise
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Disconnect from Redis cache
 * Should be called on application shutdown
 */
export async function disconnectRedis(): Promise<void> {
  console.warn('Disconnecting from Redis cache...');
  await closeRedisClient();
  console.warn('✓ Redis cache disconnected');
}
