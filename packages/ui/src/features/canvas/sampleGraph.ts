/**
 * Sample Graph Data
 *
 * Example graph data for testing and demo purposes
 */

import type { Graph } from '../../shared/types';

/**
 * Sample graph with various node types and relationships
 */
export const sampleGraph: Graph = {
  nodes: [
    // File nodes (LOD 0)
    {
      id: 'file-1',
      type: 'file',
      label: 'app.ts',
      metadata: { path: 'src/app.ts', loc: 150 },
      position: { x: 0, y: 0, z: 0 },
      lodLevel: 0,
    },
    {
      id: 'file-2',
      type: 'file',
      label: 'utils.ts',
      metadata: { path: 'src/utils.ts', loc: 80 },
      position: { x: 5, y: 0, z: 0 },
      lodLevel: 0,
    },
    {
      id: 'file-3',
      type: 'file',
      label: 'types.ts',
      metadata: { path: 'src/types.ts', loc: 50 },
      position: { x: -5, y: 0, z: 0 },
      lodLevel: 0,
    },

    // Class nodes (LOD 1)
    {
      id: 'class-1',
      type: 'class',
      label: 'Application',
      metadata: { methods: 5, properties: 3 },
      position: { x: 0, y: 1.5, z: 0 },
      lodLevel: 1,
    },
    {
      id: 'class-2',
      type: 'class',
      label: 'Logger',
      metadata: { methods: 3, properties: 1 },
      position: { x: 5, y: 1.5, z: 0 },
      lodLevel: 1,
    },

    // Function nodes (LOD 2)
    {
      id: 'func-1',
      type: 'function',
      label: 'initialize',
      metadata: { params: 2, returns: 'Promise<void>' },
      position: { x: -2, y: 1.5, z: 2 },
      lodLevel: 2,
    },
    {
      id: 'func-2',
      type: 'function',
      label: 'parseConfig',
      metadata: { params: 1, returns: 'Config' },
      position: { x: 2, y: 1.5, z: 2 },
      lodLevel: 2,
    },

    // Method nodes (LOD 3)
    {
      id: 'method-1',
      type: 'method',
      label: 'start',
      metadata: { class: 'Application' },
      position: { x: -1, y: 3, z: 0 },
      lodLevel: 3,
    },
    {
      id: 'method-2',
      type: 'method',
      label: 'stop',
      metadata: { class: 'Application' },
      position: { x: 1, y: 3, z: 0 },
      lodLevel: 3,
    },
    {
      id: 'method-3',
      type: 'method',
      label: 'log',
      metadata: { class: 'Logger' },
      position: { x: 5, y: 3, z: 0 },
      lodLevel: 3,
    },

    // Variable nodes (LOD 4)
    {
      id: 'var-1',
      type: 'variable',
      label: 'config',
      metadata: { type: 'Config' },
      position: { x: 0, y: 4, z: 0 },
      lodLevel: 4,
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
    },
    {
      id: 'edge-2',
      source: 'file-2',
      target: 'class-2',
      type: 'contains',
      metadata: {},
    },
    {
      id: 'edge-3',
      source: 'class-1',
      target: 'method-1',
      type: 'contains',
      metadata: {},
    },
    {
      id: 'edge-4',
      source: 'class-1',
      target: 'method-2',
      type: 'contains',
      metadata: {},
    },
    {
      id: 'edge-5',
      source: 'class-2',
      target: 'method-3',
      type: 'contains',
      metadata: {},
    },

    // Dependency relationships
    {
      id: 'edge-6',
      source: 'file-1',
      target: 'file-2',
      type: 'depends_on',
      metadata: {},
    },
    {
      id: 'edge-7',
      source: 'file-1',
      target: 'file-3',
      type: 'imports',
      metadata: {},
    },

    // Call relationships
    {
      id: 'edge-8',
      source: 'method-1',
      target: 'func-1',
      type: 'calls',
      metadata: {},
    },
    {
      id: 'edge-9',
      source: 'method-1',
      target: 'method-3',
      type: 'calls',
      metadata: {},
    },
    {
      id: 'edge-10',
      source: 'func-1',
      target: 'func-2',
      type: 'calls',
      metadata: {},
    },
  ],
  metadata: {
    repositoryId: 'sample-repo',
    name: 'Sample Project',
    totalNodes: 11,
    totalEdges: 10,
  },
};
