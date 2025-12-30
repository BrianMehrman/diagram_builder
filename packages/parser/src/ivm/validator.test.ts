import { describe, it, expect } from 'vitest'
import type { IVMGraph } from '../../../core/src/ivm/types.js'
import { validateIVM } from './validator'

describe('validator', () => {
  describe('validateIVM', () => {
    it('should pass validation for a valid IVM graph', () => {
      const graph: IVMGraph = {
        nodes: [
          {
            id: 'file:a.ts',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'a.ts', path: 'a.ts' },
          },
          {
            id: 'file:b.ts',
            type: 'file',
            position: { x: 1, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'b.ts', path: 'b.ts' },
          },
        ],
        edges: [
          {
            id: 'file:a.ts--imports-->file:b.ts',
            source: 'file:a.ts',
            target: 'file:b.ts',
            type: 'imports',
            lod: 3,
            metadata: {},
          },
        ],
        metadata: {
          name: 'test',
          schemaVersion: '1.0.0',
          generatedAt: '2025-01-01T00:00:00Z',
          rootPath: '.',
          stats: {
            totalNodes: 2,
            totalEdges: 1,
            nodesByType: { file: 2 },
            edgesByType: { imports: 1 },
          },
          languages: [],
        },
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 1, y: 0, z: 0 },
        },
      }

      const result = validateIVM(graph)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for duplicate node IDs', () => {
      const graph: IVMGraph = {
        nodes: [
          {
            id: 'file:a.ts',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'a.ts', path: 'a.ts' },
          },
          {
            id: 'file:a.ts', // Duplicate ID
            type: 'file',
            position: { x: 1, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'a.ts', path: 'a.ts' },
          },
        ],
        edges: [],
        metadata: {
          name: 'test',
          schemaVersion: '1.0.0',
          generatedAt: '2025-01-01T00:00:00Z',
          rootPath: '.',
          stats: {
            totalNodes: 2,
            totalEdges: 0,
            nodesByType: { file: 2 },
            edgesByType: {},
          },
          languages: [],
        },
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 1, y: 0, z: 0 },
        },
      }

      const result = validateIVM(graph)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('DUPLICATE_NODE_ID')
      expect(result.errors[0].message).toContain('Duplicate node IDs found')
    })

    it('should fail validation for invalid edge source', () => {
      const graph: IVMGraph = {
        nodes: [
          {
            id: 'file:a.ts',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'a.ts', path: 'a.ts' },
          },
        ],
        edges: [
          {
            id: 'file:missing.ts--imports-->file:a.ts',
            source: 'file:missing.ts', // Invalid source
            target: 'file:a.ts',
            type: 'imports',
            lod: 3,
            metadata: {},
          },
        ],
        metadata: {
          name: 'test',
          schemaVersion: '1.0.0',
          generatedAt: '2025-01-01T00:00:00Z',
          rootPath: '.',
          stats: {
            totalNodes: 1,
            totalEdges: 1,
            nodesByType: { file: 1 },
            edgesByType: { imports: 1 },
          },
          languages: [],
        },
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 },
        },
      }

      const result = validateIVM(graph)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('INVALID_EDGE_SOURCE')
      expect(result.errors[0].message).toContain('file:missing.ts')
    })

    it('should fail validation for invalid edge target', () => {
      const graph: IVMGraph = {
        nodes: [
          {
            id: 'file:a.ts',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'a.ts', path: 'a.ts' },
          },
        ],
        edges: [
          {
            id: 'file:a.ts--imports-->file:missing.ts',
            source: 'file:a.ts',
            target: 'file:missing.ts', // Invalid target
            type: 'imports',
            lod: 3,
            metadata: {},
          },
        ],
        metadata: {
          name: 'test',
          schemaVersion: '1.0.0',
          generatedAt: '2025-01-01T00:00:00Z',
          rootPath: '.',
          stats: {
            totalNodes: 1,
            totalEdges: 1,
            nodesByType: { file: 1 },
            edgesByType: { imports: 1 },
          },
          languages: [],
        },
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 },
        },
      }

      const result = validateIVM(graph)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('INVALID_EDGE_TARGET')
      expect(result.errors[0].message).toContain('file:missing.ts')
    })

    it('should fail validation for missing required node metadata', () => {
      const graph: IVMGraph = {
        nodes: [
          {
            id: 'file:a.ts',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'a.ts', path: '' }, // Empty path
          },
        ],
        edges: [],
        metadata: {
          name: 'test',
          schemaVersion: '1.0.0',
          generatedAt: '2025-01-01T00:00:00Z',
          rootPath: '.',
          stats: {
            totalNodes: 1,
            totalEdges: 0,
            nodesByType: { file: 1 },
            edgesByType: {},
          },
          languages: [],
        },
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 },
        },
      }

      const result = validateIVM(graph)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('MISSING_METADATA')
      expect(result.errors[0].message).toContain('path')
    })

    it('should report multiple validation errors', () => {
      const graph: IVMGraph = {
        nodes: [
          {
            id: 'file:a.ts',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'a.ts', path: 'a.ts' },
          },
          {
            id: 'file:a.ts', // Duplicate ID
            type: 'file',
            position: { x: 1, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'a.ts', path: 'a.ts' },
          },
        ],
        edges: [
          {
            id: 'file:missing.ts--imports-->file:a.ts',
            source: 'file:missing.ts', // Invalid source
            target: 'file:a.ts',
            type: 'imports',
            lod: 3,
            metadata: {},
          },
        ],
        metadata: {
          name: 'test',
          schemaVersion: '1.0.0',
          generatedAt: '2025-01-01T00:00:00Z',
          rootPath: '.',
          stats: {
            totalNodes: 2,
            totalEdges: 1,
            nodesByType: { file: 2 },
            edgesByType: { imports: 1 },
          },
          languages: [],
        },
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 1, y: 0, z: 0 },
        },
      }

      const result = validateIVM(graph)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })

    it('should validate empty graph', () => {
      const graph: IVMGraph = {
        nodes: [],
        edges: [],
        metadata: {
          name: 'test',
          schemaVersion: '1.0.0',
          generatedAt: '2025-01-01T00:00:00Z',
          rootPath: '.',
          stats: {
            totalNodes: 0,
            totalEdges: 0,
            nodesByType: {},
            edgesByType: {},
          },
          languages: [],
        },
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 },
        },
      }

      const result = validateIVM(graph)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
