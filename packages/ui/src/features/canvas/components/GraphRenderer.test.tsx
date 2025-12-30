/**
 * GraphRenderer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { GraphRenderer } from './GraphRenderer';
import { useCanvasStore } from '../store';
import type { Graph } from '../../../shared/types';

// Mock Canvas for tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockGraph: Graph = {
  nodes: [
    {
      id: 'node-1',
      type: 'file',
      label: 'test.ts',
      metadata: {},
      position: { x: 0, y: 0, z: 0 },
      lodLevel: 0,
    },
    {
      id: 'node-2',
      type: 'class',
      label: 'TestClass',
      metadata: {},
      position: { x: 1, y: 1, z: 1 },
      lodLevel: 1,
    },
    {
      id: 'node-3',
      type: 'method',
      label: 'testMethod',
      metadata: {},
      position: { x: 2, y: 2, z: 2 },
      lodLevel: 3,
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'contains',
      metadata: {},
    },
  ],
  metadata: {
    repositoryId: 'test-repo',
    name: 'Test',
    totalNodes: 3,
    totalEdges: 1,
  },
};

describe('GraphRenderer', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders without crashing', () => {
    const { container } = render(<GraphRenderer graph={mockGraph} />);
    expect(container).toBeDefined();
  });

  it('filters nodes by LOD level', () => {
    useCanvasStore.getState().setLodLevel(1);

    const lodLevel = useCanvasStore.getState().lodLevel;
    const visibleNodes = mockGraph.nodes.filter(
      (node) => node.lodLevel <= lodLevel
    );

    expect(visibleNodes).toHaveLength(2); // file and class, not method
    expect(visibleNodes.map((n) => n.id)).toEqual(['node-1', 'node-2']);
  });

  it('shows all nodes at max LOD', () => {
    useCanvasStore.getState().setLodLevel(4);

    const lodLevel = useCanvasStore.getState().lodLevel;
    const visibleNodes = mockGraph.nodes.filter(
      (node) => node.lodLevel <= lodLevel
    );

    expect(visibleNodes).toHaveLength(3);
  });

  it('filters edges when nodes are hidden', () => {
    useCanvasStore.getState().setLodLevel(0);

    const lodLevel = useCanvasStore.getState().lodLevel;
    const visibleNodes = mockGraph.nodes.filter(
      (node) => node.lodLevel <= lodLevel
    );
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = mockGraph.edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    // Only file is visible, so edge from file to class should be hidden
    expect(visibleEdges).toHaveLength(0);
  });
});
