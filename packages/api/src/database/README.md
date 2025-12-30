# Neo4j Database Documentation

This directory contains Neo4j database configuration, query utilities, and initialization scripts for the Diagram Builder API.

## Table of Contents

- [Naming Conventions](#naming-conventions)
- [Query Patterns](#query-patterns)
- [Database Schema](#database-schema)
- [Modules](#modules)

## Naming Conventions

**CRITICAL**: Neo4j naming conventions MUST be followed consistently across all code. Agents and developers often get this wrong, so pay close attention.

### Node Labels: PascalCase

Node labels represent entity types and use PascalCase (also called UpperCamelCase).

```cypher
// ✅ CORRECT
(:Repository)
(:File)
(:Class)
(:Function)
(:Method)
(:Variable)

// ❌ WRONG - inconsistent casing
(:repository)
(:file_node)
(:class-name)
(:FUNCTION)
```

### Properties: camelCase

All node and relationship properties use camelCase (also called lowerCamelCase).

```cypher
// ✅ CORRECT
{id: "abc123"}
{fileName: "index.ts"}
{lineCount: 42}
{createdAt: timestamp()}
{isPublic: true}

// ❌ WRONG - inconsistent casing
{FileName: "index.ts"}
{line_count: 42}
{created-at: timestamp()}
{IsPublic: true}
```

### Relationships: UPPER_SNAKE_CASE

All relationship types use UPPER_SNAKE_CASE (all caps with underscores).

```cypher
// ✅ CORRECT
-[:CONTAINS]->
-[:DEPENDS_ON]->
-[:CALLS]->
-[:DEFINES]->
-[:IMPORTS]->
-[:EXPORTS]->

// ❌ WRONG - inconsistent casing
-[:contains]->
-[:DependsOn]->
-[:calls]->
-[:Defines]->
```

## Query Patterns

### Basic Node Creation

```cypher
// Create a Repository node
CREATE (r:Repository {
  id: $repositoryId,
  name: $name,
  url: $url,
  createdAt: timestamp()
})
RETURN r
```

### Relationship Creation

```cypher
// Create File CONTAINS Class relationship
MATCH (f:File {id: $fileId})
MATCH (c:Class {id: $classId})
CREATE (f)-[:CONTAINS]->(c)
```

### Traversal Queries

```cypher
// Find all files in a repository
MATCH (r:Repository {id: $repoId})-[:CONTAINS]->(f:File)
RETURN f.fileName, f.language, f.lineCount
ORDER BY f.fileName
```

```cypher
// Find dependencies of a file
MATCH (f:File {id: $fileId})-[:DEPENDS_ON]->(dep:File)
RETURN dep.fileName, dep.language
```

### Function Call Graph

```cypher
// Find all functions that a function calls
MATCH (fn:Function {id: $functionId})-[:CALLS]->(called:Function)
RETURN called.name, called.id
```

### Deep Traversal

```cypher
// Find all classes and functions in a repository
MATCH (r:Repository {id: $repoId})-[:CONTAINS*]->(node)
WHERE node:Class OR node:Function
RETURN labels(node) as type, node.name, node.id
```

## Database Schema

### Node Types

#### Repository
```cypher
(:Repository {
  id: string,          // Unique identifier
  name: string,        // Repository name
  url: string,         // Git repository URL
  createdAt: number,   // Unix timestamp
  updatedAt: number    // Unix timestamp
})
```

#### File
```cypher
(:File {
  id: string,          // Unique identifier
  fileName: string,    // File name with extension
  filePath: string,    // Relative path from repo root
  language: string,    // Programming language
  lineCount: number,   // Number of lines
  createdAt: number    // Unix timestamp
})
```

#### Class
```cypher
(:Class {
  id: string,          // Unique identifier
  name: string,        // Class name
  isAbstract: boolean, // Abstract class flag
  isExported: boolean  // Export flag
})
```

#### Function
```cypher
(:Function {
  id: string,          // Unique identifier
  name: string,        // Function name
  isAsync: boolean,    // Async function flag
  isExported: boolean, // Export flag
  lineNumber: number   // Starting line number
})
```

### Relationship Types

- `(:Repository)-[:CONTAINS]->(:File)` - Repository contains files
- `(:File)-[:CONTAINS]->(:Class)` - File defines classes
- `(:File)-[:CONTAINS]->(:Function)` - File defines functions
- `(:Class)-[:CONTAINS]->(:Method)` - Class defines methods
- `(:File)-[:DEPENDS_ON]->(:File)` - File imports another file
- `(:Function)-[:CALLS]->(:Function)` - Function calls another function

## Modules

### neo4j-config.ts

Driver configuration and connection pooling.

```typescript
import { getDriver, closeDriver } from './database/neo4j-config';

const driver = getDriver();
// Use driver...
await closeDriver(); // On shutdown
```

### neo4j-client.ts

Connection lifecycle management.

```typescript
import { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './database/neo4j-client';

// On server startup
await connectDatabase();

// Check health
const isHealthy = await checkDatabaseHealth();

// On server shutdown
await disconnectDatabase();
```

### query-utils.ts

Reusable query utilities.

```typescript
import { runQuery, runSingleQuery, runTransaction } from './database/query-utils';

// Run a query
const files = await runQuery<File>('MATCH (f:File) RETURN f');

// Run query with single result
const count = await runSingleQuery('MATCH (n) RETURN count(n) as result');

// Run transaction
await runTransaction([
  { cypher: 'CREATE (r:Repository {id: $id})', params: { id: 'repo1' } },
  { cypher: 'CREATE (f:File {id: $id})', params: { id: 'file1' } }
]);
```

### init-db.ts

Database initialization (constraints and indexes).

```typescript
import { initializeDatabase } from './database/init-db';

// On server startup
await initializeDatabase();
```

## Performance Considerations

1. **Use Constraints**: Unique constraints on `id` properties provide index-backed lookups
2. **Use Indexes**: Indexes on `name` properties speed up name-based searches
3. **Limit Traversal Depth**: Use relationship type filters to avoid deep scans
4. **Use Parameters**: Always use parameterized queries to enable query plan caching
5. **Close Sessions**: Always close sessions in finally blocks to prevent connection leaks

## References

- [Neo4j Cypher Manual](https://neo4j.com/docs/cypher-manual/current/)
- [Neo4j JavaScript Driver Documentation](https://neo4j.com/docs/javascript-manual/current/)
- Project Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
