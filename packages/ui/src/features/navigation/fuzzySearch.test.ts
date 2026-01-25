/**
 * Fuzzy Search Tests
 *
 * Tests for fuzzy search functionality using Fuse.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeSearchIndex,
  searchNodes,
  clearSearchIndex,
} from './fuzzySearch';
import type { GraphNode } from '../../shared/types';

describe('fuzzySearch', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'node-1',
      type: 'file',
      label: 'AuthService.ts',
      metadata: { path: 'src/services/AuthService.ts' },
      lod: 1,
    },
    {
      id: 'node-2',
      type: 'class',
      label: 'AuthController',
      metadata: { path: 'src/controllers/AuthController.ts' },
      lod: 1,
    },
    {
      id: 'node-3',
      type: 'function',
      label: 'authenticate',
      metadata: { path: 'src/utils/auth.ts' },
      lod: 2,
    },
    {
      id: 'node-4',
      type: 'method',
      label: 'authMiddleware',
      metadata: { path: 'src/middleware/auth.ts' },
      lod: 2,
    },
    {
      id: 'node-5',
      type: 'file',
      label: 'UserService.ts',
      metadata: { path: 'src/services/UserService.ts' },
      lod: 1,
    },
    {
      id: 'node-6',
      type: 'class',
      label: 'PaymentProcessor',
      metadata: { path: 'src/services/PaymentProcessor.ts' },
      lod: 1,
    },
    {
      id: 'node-7',
      type: 'variable',
      label: 'config',
      metadata: { path: 'src/config.ts' },
      lod: 3,
    },
    {
      id: 'node-8',
      type: 'function',
      label: 'validateUser',
      metadata: { path: 'src/utils/validation.ts' },
      lod: 2,
    },
    {
      id: 'node-9',
      type: 'file',
      label: 'index.ts',
      metadata: { path: 'src/index.ts' },
      lod: 1,
    },
    {
      id: 'node-10',
      type: 'class',
      label: 'DatabaseConnection',
      metadata: { path: 'src/db/DatabaseConnection.ts' },
      lod: 1,
    },
  ];

  beforeEach(() => {
    clearSearchIndex();
    initializeSearchIndex(mockNodes);
  });

  describe('fuzzy matching', () => {
    it('finds matches with "auth" prefix', () => {
      const results = searchNodes('auth');

      expect(results.length).toBeGreaterThan(0);

      // Should find AuthService, AuthController, authenticate, authMiddleware
      const labels = results.map((r) => r.label);
      expect(labels.some((l) => l.includes('Auth'))).toBe(true);
    });

    it('finds AuthService, AuthController, authenticate with "auth"', () => {
      const results = searchNodes('auth');
      const labels = results.map((r) => r.label);

      expect(labels).toContain('AuthService.ts');
      expect(labels).toContain('AuthController');
      expect(labels).toContain('authenticate');
    });

    it('performs case-insensitive matching', () => {
      const resultsLower = searchNodes('auth');
      const resultsUpper = searchNodes('AUTH');
      const resultsMixed = searchNodes('Auth');

      // All should return results (fuzzy matching is case-insensitive)
      expect(resultsLower.length).toBeGreaterThan(0);
      expect(resultsUpper.length).toBeGreaterThan(0);
      expect(resultsMixed.length).toBeGreaterThan(0);
    });

    it('finds matches by ID', () => {
      const results = searchNodes('node-5');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('node-5');
    });

    it('finds matches by type', () => {
      const results = searchNodes('function');

      expect(results.length).toBeGreaterThan(0);
      const types = results.map((r) => r.type);
      expect(types).toContain('function');
    });
  });

  describe('result ranking', () => {
    it('returns best matches first', () => {
      const results = searchNodes('AuthService');

      // First result should be the exact match
      expect(results[0].label).toBe('AuthService.ts');
    });

    it('ranks exact label matches higher than partial matches', () => {
      const results = searchNodes('config');

      // 'config' should rank higher than labels that just contain 'config' as substring
      expect(results[0].label).toBe('config');
    });
  });

  describe('result limits', () => {
    it('returns maximum 10 results', () => {
      // Create many nodes
      const manyNodes: GraphNode[] = Array.from({ length: 50 }, (_, i) => ({
        id: `test-node-${i}`,
        type: 'file' as const,
        label: `TestFile${i}.ts`,
        metadata: {},
        lod: 1,
      }));

      clearSearchIndex();
      initializeSearchIndex(manyNodes);

      const results = searchNodes('Test');

      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty query', () => {
      const results = searchNodes('');

      expect(results).toEqual([]);
    });

    it('returns empty array for whitespace-only query', () => {
      const results = searchNodes('   ');

      expect(results).toEqual([]);
    });

    it('returns empty array when no matches found', () => {
      const results = searchNodes('xyznonexistent');

      expect(results).toEqual([]);
    });

    it('returns empty array when index not initialized', () => {
      clearSearchIndex();

      const results = searchNodes('auth');

      expect(results).toEqual([]);
    });
  });

  describe('performance', () => {
    it('completes search in less than 100ms for 1000 nodes', () => {
      // Create 1000 nodes
      const largeNodeSet: GraphNode[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `perf-node-${i}`,
        type: ['file', 'class', 'function', 'method', 'variable'][
          i % 5
        ] as GraphNode['type'],
        label: `TestNode${i}_${['Service', 'Controller', 'Utils', 'Helper', 'Module'][i % 5]}.ts`,
        metadata: { path: `src/path/to/TestNode${i}.ts` },
        lod: (i % 4) + 1,
      }));

      clearSearchIndex();
      initializeSearchIndex(largeNodeSet);

      const startTime = performance.now();
      searchNodes('Test');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
    });
  });
});
