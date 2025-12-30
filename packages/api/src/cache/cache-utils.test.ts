/**
 * Tests for Redis cache utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get, set, invalidate, invalidatePattern, DEFAULT_CACHE_TTL } from './cache-utils';
import { getRedisClient } from './redis-config';

describe('Cache Utilities', () => {
  const redis = getRedisClient();

  beforeEach(async () => {
    // Clear all test keys before each test
    await redis.flushdb();
  });

  describe('get', () => {
    it('should retrieve and parse cached JSON value', async () => {
      const key = 'test:get:simple';
      const value = { id: '123', name: 'Test' };

      await redis.set(key, JSON.stringify(value));

      const result = await get<typeof value>(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await get('test:get:nonexistent');

      expect(result).toBeNull();
    });

    it('should return null and log error for invalid JSON', async () => {
      const key = 'test:get:invalid';

      await redis.set(key, 'not valid json{');

      const result = await get(key);

      expect(result).toBeNull();
    });

    it('should handle complex nested objects', async () => {
      const key = 'test:get:complex';
      const value = {
        id: '123',
        metadata: {
          tags: ['tag1', 'tag2'],
          count: 42
        },
        items: [
          { id: '1', value: 100 },
          { id: '2', value: 200 }
        ]
      };

      await redis.set(key, JSON.stringify(value));

      const result = await get<typeof value>(key);

      expect(result).toEqual(value);
    });
  });

  describe('set', () => {
    it('should serialize and cache value with default TTL', async () => {
      const key = 'test:set:default-ttl';
      const value = { id: '456', status: 'active' };

      await set(key, value);

      const cached = await redis.get(key);
      const ttl = await redis.ttl(key);

      expect(JSON.parse(cached as string)).toEqual(value);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(DEFAULT_CACHE_TTL);
    });

    it('should cache value with custom TTL', async () => {
      const key = 'test:set:custom-ttl';
      const value = { id: '789', status: 'pending' };
      const customTTL = 60;

      await set(key, value, customTTL);

      const cached = await redis.get(key);
      const ttl = await redis.ttl(key);

      expect(JSON.parse(cached as string)).toEqual(value);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(customTTL);
    });

    it('should handle arrays', async () => {
      const key = 'test:set:array';
      const value = [1, 2, 3, 4, 5];

      await set(key, value);

      const cached = await redis.get(key);

      expect(JSON.parse(cached as string)).toEqual(value);
    });

    it('should handle strings', async () => {
      const key = 'test:set:string';
      const value = 'simple string value';

      await set(key, value);

      const cached = await redis.get(key);

      expect(JSON.parse(cached as string)).toEqual(value);
    });
  });

  describe('invalidate', () => {
    it('should delete a single key', async () => {
      const key = 'test:invalidate:single';
      const value = { id: 'test' };

      await redis.set(key, JSON.stringify(value));

      let exists = await redis.exists(key);
      expect(exists).toBe(1);

      await invalidate(key);

      exists = await redis.exists(key);
      expect(exists).toBe(0);
    });

    it('should not throw error for non-existent key', async () => {
      await expect(invalidate('test:invalidate:nonexistent')).resolves.not.toThrow();
    });
  });

  describe('invalidatePattern', () => {
    it('should delete all keys matching pattern', async () => {
      const keys = [
        'test:pattern:user:1',
        'test:pattern:user:2',
        'test:pattern:user:3'
      ];

      for (const key of keys) {
        await redis.set(key, JSON.stringify({ id: key }));
      }

      await invalidatePattern('test:pattern:user:*');

      for (const key of keys) {
        const exists = await redis.exists(key);
        expect(exists).toBe(0);
      }
    });

    it('should not delete keys that do not match pattern', async () => {
      const matchingKeys = [
        'test:pattern:match:1',
        'test:pattern:match:2'
      ];

      const nonMatchingKeys = [
        'test:pattern:other:1',
        'test:different:match:1'
      ];

      for (const key of [...matchingKeys, ...nonMatchingKeys]) {
        await redis.set(key, JSON.stringify({ id: key }));
      }

      await invalidatePattern('test:pattern:match:*');

      for (const key of matchingKeys) {
        const exists = await redis.exists(key);
        expect(exists).toBe(0);
      }

      for (const key of nonMatchingKeys) {
        const exists = await redis.exists(key);
        expect(exists).toBe(1);
      }
    });

    it('should handle pattern with no matching keys', async () => {
      await expect(invalidatePattern('test:pattern:nomatch:*')).resolves.not.toThrow();
    });

    it('should handle large number of keys efficiently', async () => {
      const baseKey = 'test:pattern:bulk:';
      const count = 150;

      for (let i = 0; i < count; i++) {
        await redis.set(`${baseKey}${i}`, JSON.stringify({ id: i }));
      }

      await invalidatePattern(`${baseKey}*`);

      for (let i = 0; i < count; i++) {
        const exists = await redis.exists(`${baseKey}${i}`);
        expect(exists).toBe(0);
      }
    });
  });

  describe('integration', () => {
    it('should support full cache lifecycle', async () => {
      const key = 'test:integration:lifecycle';
      const value = { id: 'test', data: [1, 2, 3] };

      // Set
      await set(key, value, 60);

      // Get
      const retrieved = await get<typeof value>(key);
      expect(retrieved).toEqual(value);

      // Invalidate
      await invalidate(key);

      // Verify deleted
      const afterDelete = await get(key);
      expect(afterDelete).toBeNull();
    });

    it('should handle concurrent operations', async () => {
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(set(`test:integration:concurrent:${i}`, { id: i }));
      }

      await Promise.all(operations);

      const getOperations = [];
      for (let i = 0; i < 10; i++) {
        getOperations.push(get(`test:integration:concurrent:${i}`));
      }

      const results = await Promise.all(getOperations);

      results.forEach((result, index) => {
        expect(result).toEqual({ id: index });
      });
    });
  });
});
