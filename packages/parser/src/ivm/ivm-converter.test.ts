import { describe, it, expect } from 'vitest'
import { DependencyGraph } from '../graph/dependency-graph'
import type { RepositoryContext } from '../repository/repository-loader'
import { convertToIVM } from './ivm-converter'

describe('ivm-converter', () => {
  describe('convertToIVM', () => {
    it('should convert a dependency graph to IVM', () => {
      const depGraph = new DependencyGraph()

      // Add nodes
      depGraph.addNode({
        id: 'file:src/a.ts',
        type: 'file',
        name: 'a.ts',
        path: 'src/a.ts',
        metadata: { loc: 50, language: 'typescript' },
      })

      depGraph.addNode({
        id: 'file:src/b.ts',
        type: 'file',
        name: 'b.ts',
        path: 'src/b.ts',
        metadata: { loc: 30, language: 'typescript' },
      })

      depGraph.addNode({
        id: 'class:src/a.ts:Foo',
        type: 'class',
        name: 'Foo',
        path: 'src/a.ts',
        metadata: { loc: 20, complexity: 5 },
      })

      // Add edges
      depGraph.addEdge({
        source: 'file:src/a.ts',
        target: 'file:src/b.ts',
        type: 'imports',
        metadata: {},
      })

      // Repository context
      const repoContext: RepositoryContext = {
        path: '/path/to/project',
        files: ['src/a.ts', 'src/b.ts'],
        metadata: {
          type: 'local',
          fileCount: 2,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      const ivm = convertToIVM(depGraph, repoContext, {
        name: 'test-project',
      })

      // Verify IVM structure
      expect(ivm.nodes).toHaveLength(3)
      expect(ivm.edges).toHaveLength(1)
      expect(ivm.metadata.name).toBe('test-project')
      expect(ivm.metadata.rootPath).toBe('/path/to/project')
      expect(ivm.metadata.schemaVersion).toBe('1.0.0')

      // Verify nodes have positions
      expect(ivm.nodes[0].position).toBeDefined()
      expect(ivm.nodes[0].position.x).toBeDefined()
      expect(ivm.nodes[0].position.y).toBeDefined()
      expect(ivm.nodes[0].position.z).toBeDefined()

      // Verify nodes have LOD levels
      expect(ivm.nodes[0].lod).toBeDefined()
      expect(ivm.nodes[0].lod).toBeGreaterThanOrEqual(0)
      expect(ivm.nodes[0].lod).toBeLessThanOrEqual(5)

      // Verify metadata enrichment
      expect(ivm.metadata.properties?.repositoryType).toBe('local')
      expect(ivm.metadata.properties?.fileCount).toBe(2)

      // Verify statistics
      expect(ivm.metadata.stats.totalNodes).toBe(3)
      expect(ivm.metadata.stats.totalEdges).toBe(1)
      expect(ivm.metadata.stats.totalLoc).toBe(100) // 50 + 30 + 20
    })

    it('should convert dependency graph with Git repository context', () => {
      const depGraph = new DependencyGraph()

      depGraph.addNode({
        id: 'file:index.ts',
        type: 'file',
        name: 'index.ts',
        path: 'index.ts',
        metadata: {},
      })

      const repoContext: RepositoryContext = {
        path: '/tmp/cloned-repo',
        files: ['index.ts'],
        metadata: {
          type: 'git',
          url: 'https://github.com/example/repo.git',
          branch: 'main',
          fileCount: 1,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      const ivm = convertToIVM(depGraph, repoContext, {
        name: 'example-repo',
      })

      expect(ivm.metadata.repositoryUrl).toBe('https://github.com/example/repo.git')
      expect(ivm.metadata.branch).toBe('main')
    })

    it('should throw error for invalid IVM graph', () => {
      const depGraph = new DependencyGraph()

      // Add edge with invalid target
      depGraph.addNode({
        id: 'file:a.ts',
        type: 'file',
        name: 'a.ts',
        path: 'a.ts',
        metadata: {},
      })

      depGraph.addEdge({
        source: 'file:a.ts',
        target: 'file:missing.ts', // Invalid target
        type: 'imports',
        metadata: {},
      })

      const repoContext: RepositoryContext = {
        path: '/path/to/project',
        files: ['a.ts'],
        metadata: {
          type: 'local',
          fileCount: 1,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      expect(() => {
        convertToIVM(depGraph, repoContext, { name: 'test' })
      }).toThrow('IVM validation failed')
    })

    it('should handle empty dependency graph', () => {
      const depGraph = new DependencyGraph()

      const repoContext: RepositoryContext = {
        path: '/path/to/project',
        files: [],
        metadata: {
          type: 'local',
          fileCount: 0,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      const ivm = convertToIVM(depGraph, repoContext, { name: 'empty' })

      expect(ivm.nodes).toHaveLength(0)
      expect(ivm.edges).toHaveLength(0)
      expect(ivm.metadata.name).toBe('empty')
    })

    it('should preserve node IDs from dependency graph', () => {
      const depGraph = new DependencyGraph()

      depGraph.addNode({
        id: 'custom:id:123',
        type: 'file',
        name: 'test.ts',
        path: 'test.ts',
        metadata: {},
      })

      const repoContext: RepositoryContext = {
        path: '/path/to/project',
        files: ['test.ts'],
        metadata: {
          type: 'local',
          fileCount: 1,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      const ivm = convertToIVM(depGraph, repoContext, { name: 'test' })

      expect(ivm.nodes[0].id).toBe('custom:id:123')
    })

    it('should calculate bounding box', () => {
      const depGraph = new DependencyGraph()

      depGraph.addNode({
        id: 'file:a.ts',
        type: 'file',
        name: 'a.ts',
        path: 'a.ts',
        metadata: {},
      })

      depGraph.addNode({
        id: 'file:b.ts',
        type: 'file',
        name: 'b.ts',
        path: 'b.ts',
        metadata: {},
      })

      const repoContext: RepositoryContext = {
        path: '/path/to/project',
        files: ['a.ts', 'b.ts'],
        metadata: {
          type: 'local',
          fileCount: 2,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      const ivm = convertToIVM(depGraph, repoContext, { name: 'test' })

      expect(ivm.bounds).toBeDefined()
      expect(ivm.bounds.min).toBeDefined()
      expect(ivm.bounds.max).toBeDefined()
      expect(ivm.bounds.min.x).toBeDefined()
      expect(ivm.bounds.max.x).toBeDefined()
    })
  })
})
