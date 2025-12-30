# Redis Cache

This directory contains Redis caching infrastructure for the Diagram Builder API.

## Architecture

- **redis-config.ts**: Redis client configuration with singleton pattern
- **redis-client.ts**: Connection lifecycle management (connect, health check, disconnect)
- **cache-utils.ts**: High-level caching operations (get, set, invalidate)
- **cache-keys.ts**: Cache key naming conventions and builder utilities

## Cache Key Naming Convention

All cache keys follow this format:

```
diagram-builder:{resource}:{identifier}
```

### Namespace Prefix

- **Always** use `diagram-builder:` prefix to avoid key collisions in shared Redis instances
- This namespace separates our cache keys from other applications

### Resource Types

The `{resource}` segment identifies what type of data is cached:

| Resource | Description | Example Key |
|----------|-------------|-------------|
| `graph` | Complete repository graph data | `diagram-builder:graph:repo-123` |
| `query` | Cached Cypher query results | `diagram-builder:query:files-in-repo-123` |
| `viewpoint` | Rendered viewpoint data | `diagram-builder:viewpoint:arch-456` |
| `workspace` | User workspace configurations | `diagram-builder:workspace:user-789` |

### Identifiers

The `{identifier}` segment uniquely identifies the specific cached item:

- **Repository ID**: `repo-{id}`
- **User ID**: `user-{id}`
- **Query hash**: MD5 hash of query + parameters
- **Custom**: Any unique identifier appropriate for the resource

## Example Keys

```typescript
// Repository graph cache
"diagram-builder:graph:repo-abc123"

// Query result cache (hash of query + params)
"diagram-builder:query:md5-hash-of-query"

// Viewpoint cache
"diagram-builder:viewpoint:arch-xyz789"

// User workspace cache
"diagram-builder:workspace:user-456def"
```

## Cache Key Builder

Use the `buildCacheKey` helper to construct properly formatted keys:

```typescript
import { buildCacheKey } from './cache-keys';

const key = buildCacheKey('graph', 'repo-123');
// Returns: "diagram-builder:graph:repo-123"
```

## Pattern Matching

When invalidating multiple keys, use Redis glob patterns:

```typescript
import { invalidatePattern } from './cache-utils';

// Invalidate all graph caches
await invalidatePattern('diagram-builder:graph:*');

// Invalidate all caches for a specific repository
await invalidatePattern('diagram-builder:*:repo-123');

// Invalidate all query caches
await invalidatePattern('diagram-builder:query:*');
```

### Pattern Matching Rules

- `*` matches any characters (e.g., `diagram-builder:graph:*`)
- `?` matches a single character (e.g., `diagram-builder:graph:repo-?`)
- `[abc]` matches any character in brackets (e.g., `diagram-builder:graph:repo-[123]`)

## TTL (Time To Live)

Default TTL is **5 minutes (300 seconds)**. Override when needed:

```typescript
import { set, DEFAULT_CACHE_TTL } from './cache-utils';

// Use default 5 minute TTL
await set('diagram-builder:graph:repo-123', graphData);

// Custom 1 hour TTL
await set('diagram-builder:graph:repo-123', graphData, 3600);

// Custom 30 second TTL for frequently changing data
await set('diagram-builder:query:recent', queryResults, 30);
```

### Recommended TTLs

| Data Type | Recommended TTL | Reason |
|-----------|----------------|--------|
| Repository graphs | 5 minutes (default) | Changes infrequently |
| Query results | 5 minutes (default) | Balance freshness and performance |
| Viewpoints | 10 minutes (600s) | Expensive to render |
| User workspaces | 15 minutes (900s) | User-specific, less critical |
| Real-time data | 30 seconds | Needs to be fresh |

## Usage Examples

### Caching a Repository Graph

```typescript
import { buildCacheKey } from './cache/cache-keys';
import { get, set } from './cache/cache-utils';

async function getRepositoryGraph(repoId: string) {
  const cacheKey = buildCacheKey('graph', `repo-${repoId}`);

  // Try cache first
  const cached = await get<RepositoryGraph>(cacheKey);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from database
  const graph = await fetchGraphFromDatabase(repoId);

  // Cache for 5 minutes
  await set(cacheKey, graph);

  return graph;
}
```

### Invalidating After Updates

```typescript
import { buildCacheKey } from './cache/cache-keys';
import { invalidate, invalidatePattern } from './cache/cache-utils';

async function updateRepository(repoId: string, updates: Updates) {
  // Update database
  await database.update(repoId, updates);

  // Invalidate specific graph cache
  const graphKey = buildCacheKey('graph', `repo-${repoId}`);
  await invalidate(graphKey);

  // Invalidate all related query caches
  await invalidatePattern(`diagram-builder:query:*repo-${repoId}*`);
}
```

### Caching Query Results

```typescript
import crypto from 'crypto';
import { buildCacheKey } from './cache/cache-keys';
import { get, set } from './cache/cache-utils';

async function executeQuery(cypher: string, params: Record<string, unknown>) {
  // Create deterministic hash of query + params
  const hash = crypto
    .createHash('md5')
    .update(cypher + JSON.stringify(params))
    .digest('hex');

  const cacheKey = buildCacheKey('query', hash);

  // Try cache first
  const cached = await get<QueryResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Execute query
  const result = await neo4j.run(cypher, params);

  // Cache for 5 minutes
  await set(cacheKey, result);

  return result;
}
```

## Performance Considerations

### When to Cache

- **✓ Expensive database queries**: Complex Cypher queries with multiple joins
- **✓ Frequently accessed data**: Repository graphs, common viewpoints
- **✓ Computed results**: Expensive calculations or transformations
- **✓ External API responses**: Rate-limited or slow external services

### When NOT to Cache

- **✗ User authentication tokens**: Use database or in-memory sessions
- **✗ Rapidly changing data**: Real-time updates, live feeds
- **✗ Large objects (>1MB)**: Can cause memory pressure
- **✗ Personalized data**: Per-user data with low reuse

### Cache Invalidation Strategy

1. **Explicit invalidation**: Invalidate specific keys after updates
2. **Pattern-based invalidation**: Invalidate related keys by pattern
3. **TTL-based expiration**: Let Redis automatically expire old data
4. **Combined approach**: Use both explicit invalidation and TTL

## Monitoring

Monitor these Redis metrics in production:

- **Hit rate**: `(cache_hits / (cache_hits + cache_misses)) * 100`
- **Memory usage**: Keep below 80% of available memory
- **Eviction rate**: Should be near zero with proper TTLs
- **Connection pool**: Monitor active connections

## Testing

All cache operations have comprehensive test coverage:

```bash
npm test src/cache/cache-utils.test.ts
```

Tests cover:
- Get/set operations with various data types
- TTL handling (default and custom)
- Pattern-based invalidation
- Error handling and edge cases
- Concurrent operations
