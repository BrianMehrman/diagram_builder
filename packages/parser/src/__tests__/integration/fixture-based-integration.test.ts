/**
 * Integration Tests - Parser with Real Test Fixtures
 *
 * Story: 6-4-end-to-end-integration-testing
 * Purpose: Validate parser works with real file systems and produces quality graphs
 * Coverage: loadRepository() → buildDependencyGraph() → convertToIVM()
 *
 * NO MOCKING - Uses real test fixtures in tests/fixtures/repositories/
 */

import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { readFileSync } from 'fs';
import { loadRepository } from '../../repository/repository-loader';
import { buildDependencyGraph } from '../../graph/graph-builder';
import { convertToIVM } from '../../ivm/ivm-converter';

// Fixture paths (navigate up from packages/parser to repo root)
const REPO_ROOT = join(process.cwd(), '..', '..');
const FIXTURES_ROOT = join(REPO_ROOT, 'tests', 'fixtures', 'repositories');
const SMALL_TS_REPO = join(FIXTURES_ROOT, 'small-ts-repo');
const SMALL_JS_REPO = join(FIXTURES_ROOT, 'small-js-repo');
const MULTI_LANG_REPO = join(FIXTURES_ROOT, 'multi-language-repo');
const EMPTY_REPO = join(FIXTURES_ROOT, 'empty-repo');

/**
 * Helper function to validate graph quality
 * AC-3: Graph quality validation
 */
function validateGraphQuality(graph: any, expectedMinNodes: number, expectedMinEdges: number) {
  // Basic structure
  expect(graph.nodes).toBeDefined();
  expect(graph.edges).toBeDefined();
  expect(graph.metadata).toBeDefined();

  // Node count validation
  expect(graph.nodes.length).toBeGreaterThanOrEqual(expectedMinNodes);

  // Node validation
  graph.nodes.forEach((node: any) => {
    expect(node.id).toBeDefined();
    expect(node.type).toBeDefined();
    expect(node.position).toBeDefined();
    expect(node.position.x).toBeDefined();
    expect(node.position.y).toBeDefined();
    expect(node.position.z).toBeDefined();
    expect(['file', 'class', 'function', 'variable', 'interface', 'type', 'method']).toContain(node.type);

    // LOD level validation
    expect(node.lod).toBeGreaterThanOrEqual(0);
    expect(node.lod).toBeLessThanOrEqual(5);

    // Metadata validation
    expect(node.metadata).toBeDefined();
    expect(node.metadata.label).toBeDefined();
  });

  // Edge validation (if graph has relationships)
  if (expectedMinEdges > 0) {
    expect(graph.edges.length).toBeGreaterThanOrEqual(expectedMinEdges);

    graph.edges.forEach((edge: any) => {
      expect(edge.id).toBeDefined();
      expect(edge.source).toBeDefined();
      expect(edge.target).toBeDefined();
      expect(edge.type).toBeDefined();
      expect(['imports', 'exports', 'depends_on', 'contains', 'calls', 'inherits']).toContain(edge.type);

      // LOD level validation
      expect(edge.lod).toBeGreaterThanOrEqual(0);
      expect(edge.lod).toBeLessThanOrEqual(5);
    });

    // Validate relationships reference real nodes
    const nodeIds = new Set(graph.nodes.map((n: any) => n.id));
    graph.edges.forEach((edge: any) => {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    });
  }

  // Bounding box validation
  expect(graph.bounds).toBeDefined();
  expect(graph.bounds.min).toBeDefined();
  expect(graph.bounds.max).toBeDefined();

  // Statistics validation
  expect(graph.metadata.stats).toBeDefined();
  expect(graph.metadata.stats.totalNodes).toBe(graph.nodes.length);
  expect(graph.metadata.stats.totalEdges).toBe(graph.edges.length);
  expect(graph.metadata.stats.nodesByType).toBeDefined();
  expect(graph.metadata.stats.edgesByType).toBeDefined();
}

describe('Parser Integration Tests - Real Fixtures', () => {
  describe('Small TypeScript Repository', () => {
    it('should load repository and find all TypeScript files', async () => {
      // AC-1: Integration tests with real file systems
      const context = await loadRepository(SMALL_TS_REPO, {
        extensions: ['.ts'],
      });

      // Verify file discovery
      expect(context.files.length).toBeGreaterThanOrEqual(3); // index.ts, User.ts, helpers.ts
      expect(context.files.some(f => f.includes('index.ts'))).toBe(true);
      expect(context.files.some(f => f.includes('User.ts'))).toBe(true);
      expect(context.files.some(f => f.includes('helpers.ts'))).toBe(true);
      expect(context.metadata.type).toBe('local');
      expect(context.metadata.fileCount).toBe(context.files.length);
    });

    it('should build dependency graph with correct structure', async () => {
      // AC-2: Full pipeline integration tests
      const context = await loadRepository(SMALL_TS_REPO, {
        extensions: ['.ts'],
      });

      // Read file contents
      const fileInputs = context.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }));

      // Build dependency graph
      const depGraph = buildDependencyGraph(fileInputs);

      const nodes = depGraph.getNodes();
      const edges = depGraph.getEdges();

      // Validate graph structure
      expect(nodes.length).toBeGreaterThan(0);

      // Should have file nodes for each source file
      const fileNodes = nodes.filter(n => n.type === 'file');
      expect(fileNodes.length).toBeGreaterThanOrEqual(3);

      // Should have class nodes (User class exists)
      const classNodes = nodes.filter(n => n.type === 'class');
      expect(classNodes.length).toBeGreaterThanOrEqual(1);

      // Should have function nodes
      const functionNodes = nodes.filter(n => n.type === 'function');
      expect(functionNodes.length).toBeGreaterThanOrEqual(1);

      // Should have import/dependency edges
      expect(edges.length).toBeGreaterThan(0);
    });

    it('should convert to IVM with valid 3D coordinates', async () => {
      // AC-3: Graph quality validation
      const context = await loadRepository(SMALL_TS_REPO, {
        extensions: ['.ts'],
      });

      const fileInputs = context.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }));

      const depGraph = buildDependencyGraph(fileInputs);

      // Convert to IVM
      const ivm = convertToIVM(depGraph, context, {
        name: 'small-ts-repo',
      });

      // Validate graph quality (AC-3)
      validateGraphQuality(ivm, 3, 1); // Min 3 nodes, min 1 edge

      // Verify metadata
      expect(ivm.metadata.name).toBe('small-ts-repo');
      expect(ivm.metadata.rootPath).toBe(SMALL_TS_REPO);
      expect(ivm.metadata.schemaVersion).toBe('1.0.0');
    });
  });

  describe('Small JavaScript Repository', () => {
    it('should load and parse JavaScript files correctly', async () => {
      // AC-4: Real repository test cases - Small repo
      const context = await loadRepository(SMALL_JS_REPO, {
        extensions: ['.js'],
      });

      // Verify file discovery
      expect(context.files.length).toBeGreaterThanOrEqual(3); // index.js, helpers.js, calculator.js
      expect(context.files.some(f => f.includes('index.js'))).toBe(true);
      expect(context.files.some(f => f.includes('calculator.js'))).toBe(true);

      // Build and convert
      const fileInputs = context.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }));

      const depGraph = buildDependencyGraph(fileInputs);
      const ivm = convertToIVM(depGraph, context, { name: 'small-js-repo' });

      // Validate graph quality
      validateGraphQuality(ivm, 3, 1); // Min 3 nodes, min 1 edge

      // Should detect JavaScript classes (Calculator)
      const classNodes = ivm.nodes.filter((n: any) => n.type === 'class');
      expect(classNodes.length).toBeGreaterThanOrEqual(1);

      // Should have edges (imports/contains/etc)
      // Note: CommonJS require() detection may not always produce "imports" edges
      expect(ivm.edges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Multi-Language Repository', () => {
    it('should handle mixed language repositories', async () => {
      // AC-4: Multi-language repo test
      const context = await loadRepository(MULTI_LANG_REPO, {
        extensions: ['.js', '.ts'], // Parser only supports JS/TS currently
      });

      // Should find JS and TS files (Python files excluded)
      expect(context.files.length).toBeGreaterThanOrEqual(2);
      expect(context.files.some(f => f.includes('app.js'))).toBe(true);
      expect(context.files.some(f => f.includes('types.ts'))).toBe(true);

      const fileInputs = context.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }));

      const depGraph = buildDependencyGraph(fileInputs);
      const ivm = convertToIVM(depGraph, context, { name: 'multi-lang-repo' });

      // Validate graph quality
      validateGraphQuality(ivm, 2, 0); // Min 2 files, may have 0 edges if no imports

      // Verify both JS and TS files are represented
      const fileNodes = ivm.nodes.filter((n: any) => n.type === 'file');
      expect(fileNodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Empty Repository', () => {
    it('should handle empty repository gracefully', async () => {
      // AC-5: Test coverage for failure modes - No matching files
      const context = await loadRepository(EMPTY_REPO, {
        extensions: ['.js', '.ts'],
      });

      // Should return empty file list
      expect(context.files).toHaveLength(0);
      expect(context.metadata.fileCount).toBe(0);

      // Build graph from empty input
      const depGraph = buildDependencyGraph([]);
      const ivm = convertToIVM(depGraph, context, { name: 'empty-repo' });

      // Should produce valid but empty IVM
      expect(ivm.nodes).toHaveLength(0);
      expect(ivm.edges).toHaveLength(0);
      expect(ivm.metadata.name).toBe('empty-repo');
      expect(ivm.metadata.stats.totalNodes).toBe(0);
      expect(ivm.metadata.stats.totalEdges).toBe(0);

      // Should have valid bounding box (even if empty)
      expect(ivm.bounds).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid repository path', async () => {
      // AC-5: Test coverage for failure modes - Invalid path
      const invalidPath = '/this/path/does/not/exist/at/all';

      await expect(
        loadRepository(invalidPath, { extensions: ['.ts'] })
      ).rejects.toThrow();
    });

    it('should reject non-directory paths', async () => {
      // AC-5: Test coverage for failure modes - Path is a file, not directory
      const filePath = join(SMALL_TS_REPO, 'package.json');

      await expect(
        loadRepository(filePath, { extensions: ['.ts'] })
      ).rejects.toThrow();
    });
  });

  describe('Graph Quality Assertions', () => {
    it('should produce graphs with valid node types', async () => {
      // AC-3: Validate node types
      const context = await loadRepository(SMALL_TS_REPO, {
        extensions: ['.ts'],
      });

      const fileInputs = context.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }));

      const depGraph = buildDependencyGraph(fileInputs);
      const ivm = convertToIVM(depGraph, context, { name: 'test' });

      // Every node must have a valid type
      const validTypes = ['file', 'class', 'function', 'variable', 'interface', 'type'];
      ivm.nodes.forEach((node: any) => {
        expect(validTypes).toContain(node.type);
      });

      // Should have file nodes
      const fileNodes = ivm.nodes.filter((n: any) => n.type === 'file');
      expect(fileNodes.length).toBeGreaterThan(0);
    });

    it('should produce graphs with valid edge types', async () => {
      // AC-3: Validate edge types
      const context = await loadRepository(SMALL_TS_REPO, {
        extensions: ['.ts'],
      });

      const fileInputs = context.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }));

      const depGraph = buildDependencyGraph(fileInputs);
      const ivm = convertToIVM(depGraph, context, { name: 'test' });

      // Every edge must have a valid type
      const validEdgeTypes = ['imports', 'exports', 'depends_on', 'contains', 'calls', 'inherits'];
      ivm.edges.forEach((edge: any) => {
        expect(validEdgeTypes).toContain(edge.type);
      });
    });

    it('should assign valid 3D coordinates to all nodes', async () => {
      // AC-3: Check 3D coordinates exist on all nodes
      const context = await loadRepository(SMALL_JS_REPO, {
        extensions: ['.js'],
      });

      const fileInputs = context.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }));

      const depGraph = buildDependencyGraph(fileInputs);
      const ivm = convertToIVM(depGraph, context, { name: 'test' });

      // Every node must have valid 3D coordinates
      ivm.nodes.forEach((node: any) => {
        expect(node.position).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
        expect(typeof node.position.z).toBe('number');

        // Coordinates should be finite numbers
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.position.y)).toBe(true);
        expect(Number.isFinite(node.position.z)).toBe(true);
      });
    });

    it('should maintain referential integrity between edges and nodes', async () => {
      // AC-3: Validate relationships reference real nodes
      const context = await loadRepository(SMALL_TS_REPO, {
        extensions: ['.ts'],
      });

      const fileInputs = context.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }));

      const depGraph = buildDependencyGraph(fileInputs);
      const ivm = convertToIVM(depGraph, context, { name: 'test' });

      // Build set of valid node IDs
      const nodeIds = new Set(ivm.nodes.map((n: any) => n.id));

      // Every edge must reference existing nodes
      ivm.edges.forEach((edge: any) => {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      });
    });
  });
});
