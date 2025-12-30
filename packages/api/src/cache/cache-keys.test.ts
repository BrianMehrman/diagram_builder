/**
 * Tests for cache key naming conventions and builders
 */

import { describe, it, expect } from 'vitest';
import { buildCacheKey, buildCachePattern, CACHE_NAMESPACE } from './cache-keys';

describe('Cache Keys', () => {
  describe('buildCacheKey', () => {
    it('should build graph cache key', () => {
      const key = buildCacheKey('graph', 'repo-123');

      expect(key).toBe('diagram-builder:graph:repo-123');
    });

    it('should build query cache key', () => {
      const key = buildCacheKey('query', 'a1b2c3d4e5f6');

      expect(key).toBe('diagram-builder:query:a1b2c3d4e5f6');
    });

    it('should build viewpoint cache key', () => {
      const key = buildCacheKey('viewpoint', 'arch-456');

      expect(key).toBe('diagram-builder:viewpoint:arch-456');
    });

    it('should build workspace cache key', () => {
      const key = buildCacheKey('workspace', 'user-789');

      expect(key).toBe('diagram-builder:workspace:user-789');
    });

    it('should handle identifiers with special characters', () => {
      const key = buildCacheKey('graph', 'repo-abc-123_test');

      expect(key).toBe('diagram-builder:graph:repo-abc-123_test');
    });

    it('should throw error for empty identifier', () => {
      expect(() => buildCacheKey('graph', '')).toThrow('Cache key identifier cannot be empty');
    });

    it('should throw error for whitespace-only identifier', () => {
      expect(() => buildCacheKey('graph', '   ')).toThrow('Cache key identifier cannot be empty');
    });

    it('should use correct namespace', () => {
      const key = buildCacheKey('graph', 'test');

      expect(key).toContain(CACHE_NAMESPACE);
      expect(key.startsWith(`${CACHE_NAMESPACE}:`)).toBe(true);
    });
  });

  describe('buildCachePattern', () => {
    it('should build pattern for all graphs', () => {
      const pattern = buildCachePattern('graph', '*');

      expect(pattern).toBe('diagram-builder:graph:*');
    });

    it('should build pattern for all resources with specific identifier', () => {
      const pattern = buildCachePattern('*', 'repo-123');

      expect(pattern).toBe('diagram-builder:*:repo-123');
    });

    it('should build pattern for specific resource with wildcard identifier', () => {
      const pattern = buildCachePattern('query', 'files-*');

      expect(pattern).toBe('diagram-builder:query:files-*');
    });

    it('should build pattern for all keys when no parameters', () => {
      const pattern = buildCachePattern('*');

      expect(pattern).toBe('diagram-builder:*:*');
    });

    it('should support complex patterns', () => {
      const pattern = buildCachePattern('graph', 'repo-[123]*');

      expect(pattern).toBe('diagram-builder:graph:repo-[123]*');
    });

    it('should support question mark pattern', () => {
      const pattern = buildCachePattern('viewpoint', 'arch-???');

      expect(pattern).toBe('diagram-builder:viewpoint:arch-???');
    });
  });

  describe('integration with cache utilities', () => {
    it('should produce keys compatible with Redis', () => {
      const key = buildCacheKey('graph', 'repo-test-123');

      // Redis keys should not contain spaces
      expect(key).not.toMatch(/\s/);

      // Should be a valid string
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should produce patterns compatible with Redis SCAN', () => {
      const pattern = buildCachePattern('*', 'repo-*');

      // Should contain valid Redis pattern syntax
      expect(pattern).toMatch(/\*/);

      // Should not contain spaces
      expect(pattern).not.toMatch(/\s/);
    });

    it('should maintain consistent namespace across all resources', () => {
      const graphKey = buildCacheKey('graph', 'test');
      const queryKey = buildCacheKey('query', 'test');
      const viewpointKey = buildCacheKey('viewpoint', 'test');
      const workspaceKey = buildCacheKey('workspace', 'test');

      const keys = [graphKey, queryKey, viewpointKey, workspaceKey];

      keys.forEach(key => {
        expect(key.startsWith(`${CACHE_NAMESPACE}:`)).toBe(true);
      });
    });
  });
});
