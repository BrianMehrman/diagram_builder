# Story 4-3: Neo4j Integration

## Story

**ID:** 4-3
**Key:** 4-3-neo4j-integration
**Title:** Install Neo4j driver, configure connection pool, implement database initialization, and create query utilities
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Integrate Neo4j graph database into the API package to store and query codebase structure. This includes connection pooling for performance, database initialization scripts to set up constraints and indexes, and reusable query utilities for common operations.

Neo4j stores the Internal Visualization Model (IVM) as nodes and relationships, enabling efficient graph queries for dependency traversal, impact analysis, and visualization data retrieval.

This story establishes the database layer that Stories 4.5-4.9 will use for data persistence and retrieval.

---

## Acceptance Criteria

- **AC-1:** Neo4j driver installed and configured
  - neo4j-driver npm package installed
  - Connection configuration loaded from environment variables
  - Connection pool configured with appropriate settings
  - Driver instance exported for reuse across modules

- **AC-2:** Database connection and health check validated
  - Connection established on server startup
  - Health check function verifies database connectivity
  - Connection errors logged and handled gracefully
  - Graceful shutdown closes Neo4j driver connection

- **AC-3:** Database initialization scripts implemented
  - Constraint creation for unique node properties (Repository.id, File.id)
  - Index creation for frequently queried properties (File.fileName, Class.name)
  - Indexes for relationship queries (CONTAINS, DEPENDS_ON)
  - Initialization runs on server startup (idempotent)

- **AC-4:** Query utilities created
  - Utility function for running Cypher queries with parameters
  - Transaction wrapper for multi-statement operations
  - Error handling and logging for database operations
  - Query result type definitions (TypeScript)

- **AC-5:** Neo4j naming conventions enforced
  - Node labels: PascalCase (:Repository, :File, :Class, :Function)
  - Properties: camelCase (fileName, lineCount, createdAt)
  - Relationships: UPPER_SNAKE_CASE (:CONTAINS, :DEPENDS_ON, :CALLS)
  - Documented in code comments and README

- **AC-6:** Comprehensive test coverage
  - Unit tests for connection configuration
  - Integration tests for database connectivity
  - Tests for initialization scripts (constraints, indexes)
  - Tests for query utilities
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Install Neo4j driver and configure connection
- [ ] Install neo4j-driver: `npm install neo4j-driver`
- [ ] Add Neo4j environment variables to .env.example:
  - NEO4J_URI (default: bolt://localhost:7687)
  - NEO4J_USERNAME (default: neo4j)
  - NEO4J_PASSWORD (required)
- [ ] Create `src/database/neo4j-config.ts` configuration module
- [ ] Load environment variables in config/environment.ts
- [ ] Configure connection pool settings (max connections, timeout)
- [ ] Export driver instance for reuse

### Task 2: Implement database connection and health check
- [ ] Create `src/database/neo4j-client.ts` module
- [ ] Implement `connectDatabase()` function to establish connection
- [ ] Implement `checkDatabaseHealth()` function to verify connectivity
- [ ] Add connection logging (startup, success, errors)
- [ ] Call connectDatabase() on server startup
- [ ] Close driver connection on graceful shutdown (SIGTERM/SIGINT)
- [ ] Write integration tests for connection in `neo4j-client.test.ts`

### Task 3: Create database initialization scripts
- [ ] Create `src/database/init-db.ts` module
- [ ] Implement constraint creation:
  - `CREATE CONSTRAINT IF NOT EXISTS FOR (r:Repository) REQUIRE r.id IS UNIQUE`
  - `CREATE CONSTRAINT IF NOT EXISTS FOR (f:File) REQUIRE f.id IS UNIQUE`
  - `CREATE CONSTRAINT IF NOT EXISTS FOR (c:Class) REQUIRE c.id IS UNIQUE`
  - `CREATE CONSTRAINT IF NOT EXISTS FOR (fn:Function) REQUIRE fn.id IS UNIQUE`
- [ ] Implement index creation:
  - `CREATE INDEX IF NOT EXISTS FOR (f:File) ON (f.fileName)`
  - `CREATE INDEX IF NOT EXISTS FOR (c:Class) ON (c.name)`
  - `CREATE INDEX IF NOT EXISTS FOR (fn:Function) ON (fn.name)`
- [ ] Run initialization on server startup (idempotent)
- [ ] Write integration tests for initialization in `init-db.test.ts`

### Task 4: Implement query utilities
- [ ] Create `src/database/query-utils.ts` module
- [ ] Implement `runQuery<T>(cypher: string, params: object): Promise<T[]>`
- [ ] Implement `runTransaction(queries: Array<{cypher: string, params: object}>)`
- [ ] Add error handling and logging for queries
- [ ] Define TypeScript interfaces for common query results
- [ ] Write unit tests for query utilities in `query-utils.test.ts`

### Task 5: Document Neo4j naming conventions
- [ ] Create documentation in `src/database/README.md`
- [ ] Document node label conventions (PascalCase)
- [ ] Document property conventions (camelCase)
- [ ] Document relationship conventions (UPPER_SNAKE_CASE)
- [ ] Add code examples for common query patterns
- [ ] Add naming convention validation in query utilities

### Task 6: Test and validate Neo4j integration
- [ ] Run `npm test` and verify all tests pass
- [ ] Start local Neo4j container: `docker-compose up neo4j`
- [ ] Verify connection health check succeeds
- [ ] Verify constraints created in Neo4j browser
- [ ] Verify indexes created in Neo4j browser
- [ ] Test query utilities with sample data
- [ ] Run TypeScript type checking: `tsc --noEmit`

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/api/`
**Package Name:** `@diagram-builder/api`

**Dependencies:**
- Story 4.1: Express server setup (prerequisite)
- Phase 1: Docker Compose with Neo4j service

**Technology Stack:**
- neo4j-driver: Official Neo4j JavaScript driver
- Neo4j: Latest version (from Docker Compose)
- TypeScript: Type safety for database operations

### Key Architecture Decisions (from architecture.md and project-context.md)

1. **Neo4j Naming Conventions (CRITICAL - Agents Often Get This Wrong):**
   ```cypher
   // ✅ CORRECT
   MATCH (r:Repository {id: $repoId})-[:CONTAINS]->(f:File)
   WHERE f.language = 'typescript'
   RETURN f.fileName, f.lineCount

   // ❌ WRONG - inconsistent casing
   MATCH (repository:repository)-[:contains]->(File:file)
   ```
   - **Node Labels:** PascalCase (`:Repository`, `:File`, `:Class`, `:Function`)
   - **Properties:** camelCase (`fileName`, `createdAt`, `lineCount`)
   - **Relationships:** UPPER_SNAKE_CASE (`:CONTAINS`, `:DEPENDS_ON`, `:CALLS`)

2. **Performance Requirements (NFR-P3, NFR-SC1-SC4):**
   - Query response time: <1 second (95th percentile)
   - Support up to 100k+ nodes, 500k+ relationships
   - Constraints and indexes are CRITICAL for performance
   - Connection pooling prevents connection overhead

3. **IVM Storage in Neo4j:**
   - Parser (Story 3.5) produces IVM format
   - Neo4j stores IVM as nodes and relationships
   - Graph queries retrieve IVM for visualization/export
   - Stories 4.5-4.6 implement IVM persistence and retrieval

### Implementation Guidance

**Neo4j Connection Configuration:**
```typescript
// src/database/neo4j-config.ts (example)
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
  {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 60000,
    maxTransactionRetryTime: 30000
  }
);

export default driver;
```

**Query Utility Example:**
```typescript
// src/database/query-utils.ts (example)
import driver from './neo4j-config';

export async function runQuery<T>(cypher: string, params: object = {}): Promise<T[]> {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => record.toObject() as T);
  } catch (error) {
    console.error('Neo4j query error:', error);
    throw error;
  } finally {
    await session.close();
  }
}
```

**Initialization Script Example:**
```typescript
// src/database/init-db.ts (example)
import { runQuery } from './query-utils';

export async function initializeDatabase() {
  // Create constraints
  await runQuery('CREATE CONSTRAINT IF NOT EXISTS FOR (r:Repository) REQUIRE r.id IS UNIQUE');
  await runQuery('CREATE CONSTRAINT IF NOT EXISTS FOR (f:File) REQUIRE f.id IS UNIQUE');

  // Create indexes
  await runQuery('CREATE INDEX IF NOT EXISTS FOR (f:File) ON (f.fileName)');
  await runQuery('CREATE INDEX IF NOT EXISTS FOR (c:Class) ON (c.name)');

  console.log('Database initialized successfully');
}
```

### Critical Constraints

- **Naming conventions:** MUST follow PascalCase/camelCase/UPPER_SNAKE_CASE
- **Connection pooling:** MUST configure max connections
- **Graceful shutdown:** MUST close driver on SIGTERM/SIGINT
- **Idempotent initialization:** Scripts MUST use IF NOT EXISTS
- **TypeScript strict mode:** NO `any` types
- **Co-located tests:** Tests next to source files

### Testing Requirements

**Test Coverage:**
- Connection configuration with valid credentials
- Connection failure handling (invalid credentials)
- Health check with running Neo4j instance
- Health check with stopped Neo4j instance
- Constraint creation (idempotent)
- Index creation (idempotent)
- Query utilities with sample data
- Transaction utilities with multiple queries

**Integration Test Setup:**
- Requires running Neo4j instance (Docker Compose)
- Tests should clean up test data after execution
- Use test database or separate test namespace

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 4.3)
- Docker Compose: `docker-compose.yml` (Neo4j service)

---

## Dev Agent Record

### Implementation Plan

_This section will be populated by the dev agent during implementation_

### Debug Log

_This section will be populated by the dev agent during implementation_

### Completion Notes

_This section will be populated by the dev agent after completion_

---

## File List

_This section will be populated by the dev agent with all new, modified, or deleted files_

---

## Change Log

_This section will be populated by the dev agent with implementation changes_

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
**Last Updated:** 2025-12-29
