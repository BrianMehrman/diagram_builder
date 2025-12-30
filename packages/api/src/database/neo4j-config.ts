/**
 * Neo4j Database Configuration
 *
 * Configures Neo4j driver with connection pooling for optimal performance
 * Connection pool supports up to 100k+ nodes and 500k+ relationships
 */

import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;

/**
 * Get or create Neo4j driver instance
 * Singleton pattern ensures single driver instance per application
 *
 * @returns Neo4j driver instance
 */
export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME || process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
      throw new Error('Neo4j configuration is missing. Ensure NEO4J_URI, NEO4J_USERNAME (or NEO4J_USER), and NEO4J_PASSWORD are set.');
    }

    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000, // 60 seconds
        maxTransactionRetryTime: 30000, // 30 seconds
        disableLosslessIntegers: true // Use native JavaScript numbers
      }
    );
  }

  return driver;
}

/**
 * Close the Neo4j driver connection
 * Should be called on application shutdown
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

// Export the driver getter as default for convenience
export default { getDriver, closeDriver };
