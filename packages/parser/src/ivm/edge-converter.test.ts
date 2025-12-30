import { describe, it, expect } from 'vitest'
import type { DependencyEdge } from '../graph/dependency-graph'
import { convertEdge, convertEdges } from './edge-converter'

describe('edge-converter', () => {
  describe('convertEdge', () => {
    it('should convert an imports edge to EdgeInput', () => {
      const depEdge: DependencyEdge = {
        source: 'file:src/a.ts',
        target: 'file:src/b.ts',
        type: 'imports',
        metadata: {
          importType: 'named',
          specifiers: ['foo', 'bar'],
        },
      }

      const edgeInput = convertEdge(depEdge)

      expect(edgeInput.source).toBe('file:src/a.ts')
      expect(edgeInput.target).toBe('file:src/b.ts')
      expect(edgeInput.type).toBe('imports')
      expect(edgeInput.metadata?.properties).toEqual({
        importType: 'named',
        specifiers: ['foo', 'bar'],
      })
    })

    it('should convert an exports edge to EdgeInput', () => {
      const depEdge: DependencyEdge = {
        source: 'file:src/a.ts',
        target: 'file:src/b.ts',
        type: 'exports',
        metadata: {
          exportType: 'default',
        },
      }

      const edgeInput = convertEdge(depEdge)

      expect(edgeInput.source).toBe('file:src/a.ts')
      expect(edgeInput.target).toBe('file:src/b.ts')
      expect(edgeInput.type).toBe('exports')
      expect(edgeInput.metadata?.properties).toEqual({
        exportType: 'default',
      })
    })

    it('should convert an extends edge to EdgeInput', () => {
      const depEdge: DependencyEdge = {
        source: 'class:src/child.ts:Child',
        target: 'class:src/parent.ts:Parent',
        type: 'extends',
        metadata: {},
      }

      const edgeInput = convertEdge(depEdge)

      expect(edgeInput.source).toBe('class:src/child.ts:Child')
      expect(edgeInput.target).toBe('class:src/parent.ts:Parent')
      expect(edgeInput.type).toBe('extends')
    })

    it('should convert an implements edge to EdgeInput', () => {
      const depEdge: DependencyEdge = {
        source: 'class:src/impl.ts:Impl',
        target: 'interface:src/iface.ts:IFace',
        type: 'implements',
        metadata: {},
      }

      const edgeInput = convertEdge(depEdge)

      expect(edgeInput.source).toBe('class:src/impl.ts:Impl')
      expect(edgeInput.target).toBe('interface:src/iface.ts:IFace')
      expect(edgeInput.type).toBe('implements')
    })

    it('should convert a calls edge to EdgeInput', () => {
      const depEdge: DependencyEdge = {
        source: 'func:src/a.ts:foo',
        target: 'func:src/b.ts:bar',
        type: 'calls',
        metadata: {
          line: 10,
          column: 5,
        },
      }

      const edgeInput = convertEdge(depEdge)

      expect(edgeInput.source).toBe('func:src/a.ts:foo')
      expect(edgeInput.target).toBe('func:src/b.ts:bar')
      expect(edgeInput.type).toBe('calls')
      expect(edgeInput.metadata?.properties).toEqual({
        line: 10,
        column: 5,
      })
    })

    it('should handle edges with empty metadata', () => {
      const depEdge: DependencyEdge = {
        source: 'file:src/a.ts',
        target: 'file:src/b.ts',
        type: 'imports',
        metadata: {},
      }

      const edgeInput = convertEdge(depEdge)

      expect(edgeInput.source).toBe('file:src/a.ts')
      expect(edgeInput.target).toBe('file:src/b.ts')
      expect(edgeInput.type).toBe('imports')
      expect(edgeInput.metadata).toBeUndefined()
    })

    it('should preserve reference metadata when present', () => {
      const depEdge: DependencyEdge = {
        source: 'file:src/a.ts',
        target: 'file:src/b.ts',
        type: 'imports',
        metadata: {
          reference: './b',
        },
      }

      const edgeInput = convertEdge(depEdge)

      expect(edgeInput.metadata?.reference).toBe('./b')
    })

    it('should preserve label metadata when present', () => {
      const depEdge: DependencyEdge = {
        source: 'file:src/a.ts',
        target: 'file:src/b.ts',
        type: 'imports',
        metadata: {
          label: 'imports from',
        },
      }

      const edgeInput = convertEdge(depEdge)

      expect(edgeInput.metadata?.label).toBe('imports from')
    })

    it('should preserve weight metadata when present', () => {
      const depEdge: DependencyEdge = {
        source: 'file:src/a.ts',
        target: 'file:src/b.ts',
        type: 'imports',
        metadata: {
          weight: 5,
        },
      }

      const edgeInput = convertEdge(depEdge)

      expect(edgeInput.metadata?.weight).toBe(5)
    })
  })

  describe('convertEdges', () => {
    it('should convert multiple dependency edges', () => {
      const depEdges: DependencyEdge[] = [
        {
          source: 'file:src/a.ts',
          target: 'file:src/b.ts',
          type: 'imports',
          metadata: {},
        },
        {
          source: 'file:src/b.ts',
          target: 'file:src/c.ts',
          type: 'imports',
          metadata: {},
        },
      ]

      const edgeInputs = convertEdges(depEdges)

      expect(edgeInputs).toHaveLength(2)
      expect(edgeInputs[0].source).toBe('file:src/a.ts')
      expect(edgeInputs[0].target).toBe('file:src/b.ts')
      expect(edgeInputs[1].source).toBe('file:src/b.ts')
      expect(edgeInputs[1].target).toBe('file:src/c.ts')
    })

    it('should return empty array for empty input', () => {
      const edgeInputs = convertEdges([])
      expect(edgeInputs).toEqual([])
    })
  })
})
