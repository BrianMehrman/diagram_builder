/**
 * Cache Key Naming Conventions and Builders
 *
 * All cache keys follow the format: diagram-builder:{resource}:{identifier}
 */

/**
 * Application namespace for all cache keys
 * Prevents key collisions in shared Redis instances
 */
export const CACHE_NAMESPACE = 'diagram-builder';

/**
 * Valid resource types for cache keys
 */
export type CacheResource = 'graph' | 'query' | 'viewpoint' | 'workspace' | 'codebase';

/**
 * Build a properly formatted cache key
 *
 * @param resource - Type of resource being cached
 * @param identifier - Unique identifier for the cached item
 * @returns Formatted cache key: "diagram-builder:{resource}:{identifier}"
 *
 * @example
 * ```typescript
 * buildCacheKey('graph', 'repo-123');
 * // Returns: "diagram-builder:graph:repo-123"
 *
 * buildCacheKey('query', md5Hash);
 * // Returns: "diagram-builder:query:a1b2c3d4..."
 * ```
 */
export function buildCacheKey(resource: CacheResource, identifier: string): string {
  if (!identifier || identifier.trim() === '') {
    throw new Error('Cache key identifier cannot be empty');
  }

  return `${CACHE_NAMESPACE}:${resource}:${identifier}`;
}

/**
 * Build a cache key pattern for invalidation
 *
 * @param resource - Type of resource, or '*' for all resources
 * @param identifierPattern - Identifier pattern (supports Redis glob patterns)
 * @returns Cache key pattern for use with invalidatePattern()
 *
 * @example
 * ```typescript
 * // Match all graph caches
 * buildCachePattern('graph', '*');
 * // Returns: "diagram-builder:graph:*"
 *
 * // Match all caches for a specific repo
 * buildCachePattern('*', 'repo-123');
 * // Returns: "diagram-builder:*:repo-123"
 *
 * // Match all query caches with specific prefix
 * buildCachePattern('query', 'files-*');
 * // Returns: "diagram-builder:query:files-*"
 * ```
 */
export function buildCachePattern(
  resource: CacheResource | '*',
  identifierPattern: string = '*'
): string {
  return `${CACHE_NAMESPACE}:${resource}:${identifierPattern}`;
}
