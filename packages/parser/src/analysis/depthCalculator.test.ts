import { describe, it, expect } from 'vitest'
import type { DependencyNode, DependencyEdge } from '../graph/dependency-graph'
import {
  calculateAbstractionDepth,
  identifyEntryPoints,
  type DepthResult,
} from './depthCalculator'

// Helper to create a node
function makeNode(
  id: string,
  name: string,
  path: string,
  type: DependencyNode['type'] = 'file'
): DependencyNode {
  return { id, type, name, path, metadata: {} }
}

// Helper to create an import edge
function makeImportEdge(source: string, target: string): DependencyEdge {
  return { source, target, type: 'imports', metadata: {} }
}

describe('depthCalculator', () => {
  describe('identifyEntryPoints', () => {
    it('should detect index.ts as entry point by filename', () => {
      const nodes = [
        makeNode('1', 'index.ts', 'src/index.ts'),
        makeNode('2', 'utils.ts', 'src/utils.ts'),
      ]
      const edges = [makeImportEdge('1', '2')]

      const entryPoints = identifyEntryPoints(nodes, edges)
      expect(entryPoints).toContain('1')
    })

    it('should detect main.ts, app.ts, server.ts, entry.ts as entry points', () => {
      const nodes = [
        makeNode('1', 'main.ts', 'src/main.ts'),
        makeNode('2', 'app.js', 'src/app.js'),
        makeNode('3', 'server.ts', 'src/server.ts'),
        makeNode('4', 'entry.js', 'src/entry.js'),
        makeNode('5', 'utils.ts', 'src/utils.ts'),
      ]
      const edges: DependencyEdge[] = []

      const entryPoints = identifyEntryPoints(nodes, edges)
      expect(entryPoints).toContain('1')
      expect(entryPoints).toContain('2')
      expect(entryPoints).toContain('3')
      expect(entryPoints).toContain('4')
      expect(entryPoints).not.toContain('5')
    })

    it('should detect files with zero incoming import edges as entry points', () => {
      const nodes = [
        makeNode('a', 'router.ts', 'src/router.ts'),
        makeNode('b', 'handler.ts', 'src/handler.ts'),
        makeNode('c', 'db.ts', 'src/db.ts'),
      ]
      // a imports b, b imports c — a has zero incoming imports
      const edges = [makeImportEdge('a', 'b'), makeImportEdge('b', 'c')]

      const entryPoints = identifyEntryPoints(nodes, edges)
      expect(entryPoints).toContain('a')
      expect(entryPoints).not.toContain('b')
      expect(entryPoints).not.toContain('c')
    })

    it('should fallback to root-level files when no entry points found', () => {
      // All nodes import each other (circular), no filename matches
      const nodes = [
        makeNode('x', 'foo.ts', 'src/foo.ts'),
        makeNode('y', 'bar.ts', 'src/bar.ts'),
        makeNode('z', 'root.ts', 'root.ts'), // root-level file
      ]
      const edges = [
        makeImportEdge('x', 'y'),
        makeImportEdge('y', 'x'),
        makeImportEdge('z', 'x'),
        makeImportEdge('x', 'z'),
      ]

      const entryPoints = identifyEntryPoints(nodes, edges)
      // z is root-level (no directory prefix), should be used as fallback
      expect(entryPoints.length).toBeGreaterThan(0)
    })
  })

  describe('calculateAbstractionDepth', () => {
    it('should handle linear chain A → B → C', () => {
      const nodes = [
        makeNode('a', 'index.ts', 'src/index.ts'),
        makeNode('b', 'service.ts', 'src/service.ts'),
        makeNode('c', 'db.ts', 'src/db.ts'),
      ]
      const edges = [makeImportEdge('a', 'b'), makeImportEdge('b', 'c')]

      const result = calculateAbstractionDepth(nodes, edges)

      expect(result.depths.get('a')).toBe(0)
      expect(result.depths.get('b')).toBe(1)
      expect(result.depths.get('c')).toBe(2)
      expect(result.maxDepth).toBe(2)
      expect(result.entryPoints).toContain('a')
      expect(result.orphans).toHaveLength(0)
    })

    it('should handle diamond pattern (A → B, A → C, B → D, C → D)', () => {
      const nodes = [
        makeNode('a', 'index.ts', 'src/index.ts'),
        makeNode('b', 'left.ts', 'src/left.ts'),
        makeNode('c', 'right.ts', 'src/right.ts'),
        makeNode('d', 'shared.ts', 'src/shared.ts'),
      ]
      const edges = [
        makeImportEdge('a', 'b'),
        makeImportEdge('a', 'c'),
        makeImportEdge('b', 'd'),
        makeImportEdge('c', 'd'),
      ]

      const result = calculateAbstractionDepth(nodes, edges)

      expect(result.depths.get('a')).toBe(0)
      expect(result.depths.get('b')).toBe(1)
      expect(result.depths.get('c')).toBe(1)
      expect(result.depths.get('d')).toBe(2) // min of paths through b or c
      expect(result.maxDepth).toBe(2)
    })

    it('should handle circular dependency A → B → A', () => {
      const nodes = [
        makeNode('a', 'index.ts', 'src/index.ts'),
        makeNode('b', 'peer.ts', 'src/peer.ts'),
      ]
      const edges = [makeImportEdge('a', 'b'), makeImportEdge('b', 'a')]

      const result = calculateAbstractionDepth(nodes, edges)

      expect(result.depths.get('a')).toBe(0)
      expect(result.depths.get('b')).toBe(1)
      // a should NOT get overwritten to depth 2 due to cycle
      expect(result.depths.get('a')).toBe(0)
    })

    it('should handle multiple entry points', () => {
      const nodes = [
        makeNode('e1', 'index.ts', 'src/index.ts'),
        makeNode('e2', 'main.ts', 'src/main.ts'),
        makeNode('s', 'shared.ts', 'src/shared.ts'),
      ]
      const edges = [makeImportEdge('e1', 's'), makeImportEdge('e2', 's')]

      const result = calculateAbstractionDepth(nodes, edges)

      expect(result.depths.get('e1')).toBe(0)
      expect(result.depths.get('e2')).toBe(0)
      expect(result.depths.get('s')).toBe(1)
      expect(result.entryPoints).toContain('e1')
      expect(result.entryPoints).toContain('e2')
    })

    it('should assign orphan nodes maxDepth + 1', () => {
      const nodes = [
        makeNode('a', 'index.ts', 'src/index.ts'),
        makeNode('b', 'service.ts', 'src/service.ts'),
        makeNode('orphan', 'orphan.ts', 'src/orphan.ts'),
      ]
      const edges = [makeImportEdge('a', 'b')]

      const result = calculateAbstractionDepth(nodes, edges)

      expect(result.depths.get('a')).toBe(0)
      expect(result.depths.get('b')).toBe(1)
      expect(result.depths.get('orphan')).toBe(2) // maxDepth(1) + 1
      expect(result.orphans).toContain('orphan')
    })

    it('should return empty result for empty graph', () => {
      const result = calculateAbstractionDepth([], [])

      expect(result.depths.size).toBe(0)
      expect(result.entryPoints).toHaveLength(0)
      expect(result.maxDepth).toBe(0)
      expect(result.orphans).toHaveLength(0)
    })

    it('should handle single node with no edges', () => {
      const nodes = [makeNode('solo', 'index.ts', 'src/index.ts')]
      const edges: DependencyEdge[] = []

      const result = calculateAbstractionDepth(nodes, edges)

      expect(result.depths.get('solo')).toBe(0)
      expect(result.entryPoints).toContain('solo')
      expect(result.maxDepth).toBe(0)
      expect(result.orphans).toHaveLength(0)
    })

    it('should only follow import edges, not other edge types', () => {
      const nodes = [
        makeNode('a', 'index.ts', 'src/index.ts'),
        makeNode('b', 'base.ts', 'src/base.ts'),
        makeNode('c', 'child.ts', 'src/child.ts'),
      ]
      const edges: DependencyEdge[] = [
        makeImportEdge('a', 'b'),
        // c extends b but is NOT imported — should not get depth through extends
        { source: 'c', target: 'b', type: 'extends', metadata: {} },
      ]

      const result = calculateAbstractionDepth(nodes, edges)

      expect(result.depths.get('a')).toBe(0)
      expect(result.depths.get('b')).toBe(1)
      // c is unreachable via imports, so it's an orphan
      expect(result.orphans).toContain('c')
    })

    it('should handle longer circular chain A → B → C → A', () => {
      const nodes = [
        makeNode('a', 'index.ts', 'src/index.ts'),
        makeNode('b', 'mid.ts', 'src/mid.ts'),
        makeNode('c', 'end.ts', 'src/end.ts'),
      ]
      const edges = [
        makeImportEdge('a', 'b'),
        makeImportEdge('b', 'c'),
        makeImportEdge('c', 'a'),
      ]

      const result = calculateAbstractionDepth(nodes, edges)

      expect(result.depths.get('a')).toBe(0)
      expect(result.depths.get('b')).toBe(1)
      expect(result.depths.get('c')).toBe(2)
      expect(result.maxDepth).toBe(2)
    })

    it('should include all node depths in the result map', () => {
      const nodes = [
        makeNode('a', 'index.ts', 'src/index.ts'),
        makeNode('b', 'lib.ts', 'src/lib.ts'),
        makeNode('c', 'orphan.ts', 'src/orphan.ts'),
      ]
      const edges = [makeImportEdge('a', 'b')]

      const result = calculateAbstractionDepth(nodes, edges)

      // Every node should have a depth entry
      expect(result.depths.size).toBe(3)
      expect(result.depths.has('a')).toBe(true)
      expect(result.depths.has('b')).toBe(true)
      expect(result.depths.has('c')).toBe(true)
    })
  })
})
