/**
 * Redis Cache Client
 *
 * Handles Redis connection, health checks, and lifecycle management
 */

import { getRedisClient, closeRedisClient } from './redis-config'
import { createModuleLogger } from '../logger'

const log = createModuleLogger('redis')

/**
 * Connect to Redis cache
 * Verifies connection by pinging Redis server
 *
 * @throws Error if connection fails
 */
export async function connectRedis(): Promise<void> {
  log.info('connecting to Redis cache')

  try {
    const redis = getRedisClient()

    // Verify connection with ping
    const pong = await redis.ping()
    if (pong !== 'PONG') {
      throw new Error('Redis ping response invalid')
    }

    log.info('Redis cache connected')
  } catch (error) {
    log.error('failed to connect to Redis cache', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error(
      `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
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
    const redis = getRedisClient()
    const pong = await redis.ping()
    return pong === 'PONG'
  } catch (error) {
    log.error('Redis health check failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

/**
 * Disconnect from Redis cache
 * Should be called on application shutdown
 */
export async function disconnectRedis(): Promise<void> {
  log.info('disconnecting from Redis cache')
  await closeRedisClient()
  log.info('Redis cache disconnected')
}
