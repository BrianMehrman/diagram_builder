/**
 * Sample IVMGraph Data
 *
 * Example graph data for testing and demo purposes
 */

import { SemanticTier } from '@diagram-builder/core'
import type { IVMGraph } from '../../shared/types'

/**
 * Sample graph with various node types and relationships
 */
export const sampleGraph: IVMGraph = {
  nodes: [
    // File nodes
    {
      id: 'file-1',
      type: 'file',
      metadata: { label: 'app.ts', path: 'src/app.ts', loc: 150 },
      position: { x: 0, y: 0, z: 0 },
      lod: SemanticTier.File,
    },
    {
      id: 'file-2',
      type: 'file',
      metadata: { label: 'utils.ts', path: 'src/utils.ts', loc: 80 },
      position: { x: 5, y: 0, z: 0 },
      lod: SemanticTier.File,
    },
    {
      id: 'file-3',
      type: 'file',
      metadata: { label: 'types.ts', path: 'src/types.ts', loc: 50 },
      position: { x: -5, y: 0, z: 0 },
      lod: SemanticTier.File,
    },

    // Class nodes
    {
      id: 'class-1',
      type: 'class',
      metadata: { label: 'Application', path: 'src/app.ts#Application', properties: { methodCount: 5, propertyCount: 3 } },
      position: { x: 0, y: 1.5, z: 0 },
      lod: SemanticTier.Symbol,
    },
    {
      id: 'class-2',
      type: 'class',
      metadata: { label: 'Logger', path: 'src/utils.ts#Logger', properties: { methodCount: 3, propertyCount: 1 } },
      position: { x: 5, y: 1.5, z: 0 },
      lod: SemanticTier.Symbol,
    },

    // Function nodes
    {
      id: 'func-1',
      type: 'function',
      metadata: { label: 'initialize', path: 'src/app.ts#initialize', properties: { paramCount: 2 } },
      position: { x: -2, y: 1.5, z: 2 },
      lod: SemanticTier.Symbol,
    },
    {
      id: 'func-2',
      type: 'function',
      metadata: { label: 'parseConfig', path: 'src/app.ts#parseConfig', properties: { paramCount: 1 } },
      position: { x: 2, y: 1.5, z: 2 },
      lod: SemanticTier.Symbol,
    },

    // Method nodes
    {
      id: 'method-1',
      type: 'method',
      metadata: { label: 'start', path: 'src/app.ts#Application#start' },
      position: { x: -1, y: 3, z: 0 },
      lod: SemanticTier.Detail,
      parentId: 'class-1',
    },
    {
      id: 'method-2',
      type: 'method',
      metadata: { label: 'stop', path: 'src/app.ts#Application#stop' },
      position: { x: 1, y: 3, z: 0 },
      lod: SemanticTier.Detail,
      parentId: 'class-1',
    },
    {
      id: 'method-3',
      type: 'method',
      metadata: { label: 'log', path: 'src/utils.ts#Logger#log' },
      position: { x: 5, y: 3, z: 0 },
      lod: SemanticTier.Detail,
      parentId: 'class-2',
    },

    // Variable nodes
    {
      id: 'var-1',
      type: 'variable',
      metadata: { label: 'config', path: 'src/app.ts#config', properties: { typeName: 'Config' } },
      position: { x: 0, y: 4, z: 0 },
      lod: SemanticTier.Detail,
    },
  ],
  edges: [
    // Contains relationships
    {
      id: 'edge-1',
      source: 'file-1',
      target: 'class-1',
      type: 'contains',
      metadata: {},
      lod: SemanticTier.File,
    },
    {
      id: 'edge-2',
      source: 'file-2',
      target: 'class-2',
      type: 'contains',
      metadata: {},
      lod: SemanticTier.File,
    },
    {
      id: 'edge-3',
      source: 'class-1',
      target: 'method-1',
      type: 'contains',
      metadata: {},
      lod: SemanticTier.Symbol,
    },
    {
      id: 'edge-4',
      source: 'class-1',
      target: 'method-2',
      type: 'contains',
      metadata: {},
      lod: SemanticTier.Symbol,
    },
    {
      id: 'edge-5',
      source: 'class-2',
      target: 'method-3',
      type: 'contains',
      metadata: {},
      lod: SemanticTier.Symbol,
    },

    // Dependency relationships
    {
      id: 'edge-6',
      source: 'file-1',
      target: 'file-2',
      type: 'depends_on',
      metadata: {},
      lod: SemanticTier.File,
    },
    {
      id: 'edge-7',
      source: 'file-1',
      target: 'file-3',
      type: 'imports',
      metadata: {},
      lod: SemanticTier.File,
    },

    // Call relationships
    {
      id: 'edge-8',
      source: 'method-1',
      target: 'func-1',
      type: 'calls',
      metadata: {},
      lod: SemanticTier.Detail,
    },
    {
      id: 'edge-9',
      source: 'method-1',
      target: 'method-3',
      type: 'calls',
      metadata: {},
      lod: SemanticTier.Detail,
    },
    {
      id: 'edge-10',
      source: 'func-1',
      target: 'func-2',
      type: 'calls',
      metadata: {},
      lod: SemanticTier.Detail,
    },
  ],
  metadata: {
    name: 'Sample Project',
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    rootPath: 'src/',
    stats: {
      totalNodes: 11,
      totalEdges: 10,
      nodesByType: { file: 3, class: 2, function: 2, method: 3, variable: 1, interface: 0, enum: 0, namespace: 0, module: 0, type: 0, directory: 0, repository: 0, package: 0 },
      edgesByType: { contains: 5, depends_on: 1, imports: 1, calls: 3, extends: 0, implements: 0, uses: 0, type_of: 0, returns: 0, parameter_of: 0, exports: 0 },
    },
    languages: ['typescript'],
  },
  bounds: {
    min: { x: -5, y: 0, z: 0 },
    max: { x: 5, y: 4, z: 2 },
  },
}
