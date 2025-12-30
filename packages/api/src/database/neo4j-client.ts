/**
 * Neo4j Database Client
 *
 * Handles database connection, health checks, and lifecycle management
 */

import { getDriver, closeDriver } from './neo4j-config';

/**
 * Connect to Neo4j database
 * Verifies connection by running a simple query
 *
 * @throws Error if connection fails
 */
export async function connectDatabase(): Promise<void> {
  console.warn('Connecting to Neo4j database...');

  try {
    const driver = getDriver();
    const session = driver.session();

    try {
      // Verify connection with simple query
      await session.run('RETURN 1 as result');
      console.warn('✓ Neo4j database connected successfully');
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Failed to connect to Neo4j database:', error);
    throw new Error(`Neo4j connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const driver = getDriver();
    const session = driver.session();

    try {
      const result = await session.run('RETURN 1 as health');
      const record = result.records[0];
      if (!record) {
        return false;
      }
      const healthValue: unknown = record.get('health');
      return Number(healthValue) === 1;
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Disconnect from Neo4j database
 * Should be called on application shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  console.warn('Disconnecting from Neo4j database...');
  await closeDriver();
  console.warn('✓ Neo4j database disconnected');
}
