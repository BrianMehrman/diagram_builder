import { describe, it, expect } from 'vitest'
import type { DependencyNode } from '../graph/dependency-graph'
import { convertNode, convertNodes } from './node-converter'

describe('node-converter', () => {
  describe('convertNode', () => {
    it('should convert a file node to NodeInput', () => {
      const depNode: DependencyNode = {
        id: 'file:src/index.ts',
        type: 'file',
        name: 'index.ts',
        path: 'src/index.ts',
        metadata: {
          loc: 150,
          complexity: 5,
          language: 'typescript',
        },
      }

      const nodeInput = convertNode(depNode)

      expect(nodeInput.id).toBe('file:src/index.ts')
      expect(nodeInput.type).toBe('file')
      expect(nodeInput.metadata.label).toBe('index.ts')
      expect(nodeInput.metadata.path).toBe('src/index.ts')
      expect(nodeInput.metadata.loc).toBe(150)
      expect(nodeInput.metadata.complexity).toBe(5)
      expect(nodeInput.metadata.language).toBe('typescript')
    })

    it('should convert a class node to NodeInput', () => {
      const depNode: DependencyNode = {
        id: 'class:src/parser.ts:Parser',
        type: 'class',
        name: 'Parser',
        path: 'src/parser.ts',
        metadata: {
          loc: 50,
          complexity: 8,
          methods: ['parse', 'analyze'],
          properties: ['config', 'cache'],
        },
      }

      const nodeInput = convertNode(depNode)

      expect(nodeInput.id).toBe('class:src/parser.ts:Parser')
      expect(nodeInput.type).toBe('class')
      expect(nodeInput.metadata.label).toBe('Parser')
      expect(nodeInput.metadata.path).toBe('src/parser.ts')
      expect(nodeInput.metadata.loc).toBe(50)
      expect(nodeInput.metadata.complexity).toBe(8)
      expect(nodeInput.metadata.properties).toEqual({
        methods: ['parse', 'analyze'],
        properties: ['config', 'cache'],
      })
    })

    it('should convert a function node to NodeInput', () => {
      const depNode: DependencyNode = {
        id: 'func:src/utils.ts:parseFile',
        type: 'function',
        name: 'parseFile',
        path: 'src/utils.ts',
        metadata: {
          loc: 20,
          complexity: 3,
          parameters: ['filePath', 'options'],
        },
      }

      const nodeInput = convertNode(depNode)

      expect(nodeInput.id).toBe('func:src/utils.ts:parseFile')
      expect(nodeInput.type).toBe('function')
      expect(nodeInput.metadata.label).toBe('parseFile')
      expect(nodeInput.metadata.path).toBe('src/utils.ts')
      expect(nodeInput.metadata.loc).toBe(20)
      expect(nodeInput.metadata.complexity).toBe(3)
      expect(nodeInput.metadata.properties).toEqual({
        parameters: ['filePath', 'options'],
      })
    })

    it('should convert an interface node to NodeInput', () => {
      const depNode: DependencyNode = {
        id: 'interface:src/types.ts:Config',
        type: 'interface',
        name: 'Config',
        path: 'src/types.ts',
        metadata: {
          properties: ['name', 'value'],
        },
      }

      const nodeInput = convertNode(depNode)

      expect(nodeInput.id).toBe('interface:src/types.ts:Config')
      expect(nodeInput.type).toBe('interface')
      expect(nodeInput.metadata.label).toBe('Config')
      expect(nodeInput.metadata.path).toBe('src/types.ts')
      expect(nodeInput.metadata.properties).toEqual({
        properties: ['name', 'value'],
      })
    })

    it('should convert a module node to NodeInput', () => {
      const depNode: DependencyNode = {
        id: 'module:src/utils',
        type: 'module',
        name: 'utils',
        path: 'src/utils',
        metadata: {
          exports: ['parseFile', 'formatOutput'],
        },
      }

      const nodeInput = convertNode(depNode)

      expect(nodeInput.id).toBe('module:src/utils')
      expect(nodeInput.type).toBe('module')
      expect(nodeInput.metadata.label).toBe('utils')
      expect(nodeInput.metadata.path).toBe('src/utils')
      expect(nodeInput.metadata.properties).toEqual({
        exports: ['parseFile', 'formatOutput'],
      })
    })

    it('should preserve location metadata when present', () => {
      const depNode: DependencyNode = {
        id: 'class:src/parser.ts:Parser',
        type: 'class',
        name: 'Parser',
        path: 'src/parser.ts',
        metadata: {
          startLine: 10,
          endLine: 60,
          startColumn: 0,
          endColumn: 1,
        },
      }

      const nodeInput = convertNode(depNode)

      expect(nodeInput.metadata.location).toEqual({
        startLine: 10,
        endLine: 60,
        startColumn: 0,
        endColumn: 1,
      })
    })

    it('should handle nodes with minimal metadata', () => {
      const depNode: DependencyNode = {
        id: 'file:src/empty.ts',
        type: 'file',
        name: 'empty.ts',
        path: 'src/empty.ts',
        metadata: {},
      }

      const nodeInput = convertNode(depNode)

      expect(nodeInput.id).toBe('file:src/empty.ts')
      expect(nodeInput.type).toBe('file')
      expect(nodeInput.metadata.label).toBe('empty.ts')
      expect(nodeInput.metadata.path).toBe('src/empty.ts')
    })
  })

  describe('convertNodes', () => {
    it('should convert multiple dependency nodes', () => {
      const depNodes: DependencyNode[] = [
        {
          id: 'file:src/a.ts',
          type: 'file',
          name: 'a.ts',
          path: 'src/a.ts',
          metadata: { loc: 10 },
        },
        {
          id: 'file:src/b.ts',
          type: 'file',
          name: 'b.ts',
          path: 'src/b.ts',
          metadata: { loc: 20 },
        },
      ]

      const nodeInputs = convertNodes(depNodes)

      expect(nodeInputs).toHaveLength(2)
      expect(nodeInputs[0].id).toBe('file:src/a.ts')
      expect(nodeInputs[1].id).toBe('file:src/b.ts')
      expect(nodeInputs[0].metadata.loc).toBe(10)
      expect(nodeInputs[1].metadata.loc).toBe(20)
    })

    it('should return empty array for empty input', () => {
      const nodeInputs = convertNodes([])
      expect(nodeInputs).toEqual([])
    })
  })
})
