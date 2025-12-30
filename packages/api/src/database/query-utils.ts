/**
 * Neo4j Query Utilities
 *
 * Reusable functions for running Cypher queries with proper error handling
 * Enforces Neo4j naming conventions: PascalCase nodes, camelCase properties, UPPER_SNAKE_CASE relationships
 */

import { getDriver } from './neo4j-config';
import { Session, QueryResult, ManagedTransaction } from 'neo4j-driver';

/**
 * Run a single Cypher query with parameters
 *
 * @param cypher - Cypher query string
 * @param params - Query parameters
 * @returns Array of query results
 */
export async function runQuery<T = unknown>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const driver = getDriver();
  const session: Session = driver.session();

  try {
    const result: QueryResult = await session.run(cypher, params);
    return result.records.map(record => record.toObject()) as T[];
  } catch (error) {
    console.error('Neo4j query error:', error);
    console.error('Query:', cypher);
    console.error('Params:', params);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Query result with single value
 */
interface SingleResult {
  result: number;
}

/**
 * Run a query that returns a single value
 *
 * @param cypher - Cypher query string
 * @param params - Query parameters
 * @returns Single result value
 */
export async function runSingleQuery(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<number> {
  const results = await runQuery<SingleResult>(cypher, params);
  return results[0]?.result ?? 0;
}

/**
 * Transaction query definition
 */
export interface TransactionQuery {
  cypher: string;
  params?: Record<string, unknown>;
}

/**
 * Run multiple queries in a single transaction
 * All queries succeed or all fail (atomic)
 *
 * @param queries - Array of queries to run
 */
export async function runTransaction(queries: TransactionQuery[]): Promise<void> {
  const driver = getDriver();
  const session: Session = driver.session();

  try {
    await session.executeWrite(async (tx: ManagedTransaction) => {
      for (const query of queries) {
        await tx.run(query.cypher, query.params || {});
      }
    });
  } catch (error) {
    console.error('Neo4j transaction error:', error);
    console.error('Queries:', queries);
    throw error;
  } finally {
    await session.close();
  }
}
