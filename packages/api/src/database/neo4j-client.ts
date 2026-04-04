/**
 * Neo4j Database Client
 *
 * Handles database connection, health checks, and lifecycle management
 */

import { getDriver, closeDriver } from './neo4j-config'
import { createModuleLogger } from '../logger'

const log = createModuleLogger('neo4j')

/**
 * Connect to Neo4j database
 * Verifies connection by running a simple query
 *
 * @throws Error if connection fails
 */
export async function connectDatabase(): Promise<void> {
  log.info('connecting to Neo4j database')

  try {
    const driver = getDriver()
    const session = driver.session()

    try {
      // Verify connection with simple query
      await session.run('RETURN 1 as result')
      log.info('Neo4j database connected')
    } finally {
      await session.close()
    }
  } catch (error) {
    log.error('failed to connect to Neo4j database', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error(
      `Neo4j connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Check Neo4j database health
 * Verifies database connectivity and responsiveness
 *
 * @returns true if database is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const driver = getDriver()
    const session = driver.session()

    try {
      const result = await session.run('RETURN 1 as health')
      const record = result.records[0]
      if (!record) {
        return false
      }
      const healthValue: unknown = record.get('health')
      return Number(healthValue) === 1
    } finally {
      await session.close()
    }
  } catch (error) {
    log.error('Neo4j health check failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

/**
 * Disconnect from Neo4j database
 * Should be called on application shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  log.info('disconnecting from Neo4j database')
  await closeDriver()
  log.info('Neo4j database disconnected')
}
