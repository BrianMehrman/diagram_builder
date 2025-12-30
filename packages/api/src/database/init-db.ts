/**
 * Database Initialization
 *
 * Creates constraints and indexes for optimal query performance
 * All operations are idempotent (safe to run multiple times)
 *
 * CRITICAL: Neo4j Naming Conventions
 * - Node labels: PascalCase (:Repository, :File, :Class, :Function)
 * - Properties: camelCase (fileName, lineCount, createdAt)
 * - Relationships: UPPER_SNAKE_CASE (:CONTAINS, :DEPENDS_ON, :CALLS)
 */

import { runQuery } from './query-utils';

/**
 * Initialize database with constraints and indexes
 * Safe to run multiple times (idempotent)
 */
export async function initializeDatabase(): Promise<void> {
  console.warn('Initializing Neo4j database...');

  try {
    // Create unique constraints for node IDs
    await createConstraints();

    // Create indexes for frequently queried properties
    await createIndexes();

    console.warn('✓ Neo4j database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Create unique constraints for node identifiers
 * Ensures data integrity and enables index-backed lookups
 */
async function createConstraints(): Promise<void> {
  const constraints = [
    'CREATE CONSTRAINT IF NOT EXISTS FOR (r:Repository) REQUIRE r.id IS UNIQUE',
    'CREATE CONSTRAINT IF NOT EXISTS FOR (f:File) REQUIRE f.id IS UNIQUE',
    'CREATE CONSTRAINT IF NOT EXISTS FOR (c:Class) REQUIRE c.id IS UNIQUE',
    'CREATE CONSTRAINT IF NOT EXISTS FOR (fn:Function) REQUIRE fn.id IS UNIQUE'
  ];

  for (const constraint of constraints) {
    await runQuery(constraint);
  }

  console.warn('  ✓ Constraints created');
}

/**
 * Create indexes for frequently queried properties
 * Improves query performance for name-based lookups
 */
async function createIndexes(): Promise<void> {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS FOR (f:File) ON (f.fileName)',
    'CREATE INDEX IF NOT EXISTS FOR (c:Class) ON (c.name)',
    'CREATE INDEX IF NOT EXISTS FOR (fn:Function) ON (fn.name)'
  ];

  for (const index of indexes) {
    await runQuery(index);
  }

  console.warn('  ✓ Indexes created');
}
