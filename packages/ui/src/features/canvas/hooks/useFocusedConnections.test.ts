import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusedConnections } from './useFocusedConnections';
import { useCanvasStore } from '../store';
import type { Graph, GraphNode, GraphEdge } from '../../../shared/types';

function node(id: string): GraphNode {
  return { id, type: 'file', label: id, metadata: {}, lod: 1, depth: 1, isExternal: false };
}
function edge(source: string, target: string, type: GraphEdge['type'] = 'imports'): GraphEdge {
  return { id: `${source}-${type}-${target}`, source, target, type, metadata: {} };
}

const graph: Graph = {
  nodes: [node('A'), node('B'), node('C'), node('D')],
  edges: [
    edge('A', 'B', 'imports'),
    edge('A', 'C', 'calls'),
    edge('B', 'D', 'depends_on'),
  ],
  metadata: { repositoryId: 'test', name: 'test', totalNodes: 4, totalEdges: 3 },
};

beforeEach(() => {
  useCanvasStore.getState().reset();
});

describe('useFocusedConnections', () => {
  it('returns empty sets when no node is selected', () => {
    const { result } = renderHook(() => useFocusedConnections(graph));
    expect(result.current.directNodeIds.size).toBe(0);
    expect(result.current.secondHopNodeIds.size).toBe(0);
    expect(result.current.directEdges).toHaveLength(0);
    expect(result.current.secondHopEdges).toHaveLength(0);
  });

  it('returns direct connections for selected node', () => {
    useCanvasStore.getState().selectNode('A');
    const { result } = renderHook(() => useFocusedConnections(graph));
    expect(result.current.directNodeIds.has('B')).toBe(true);
    expect(result.current.directNodeIds.has('C')).toBe(true);
    expect(result.current.directNodeIds.size).toBe(2);
    expect(result.current.directEdges).toHaveLength(2);
  });

  it('returns second-hop connections', () => {
    useCanvasStore.getState().selectNode('A');
    const { result } = renderHook(() => useFocusedConnections(graph));
    expect(result.current.secondHopNodeIds.has('D')).toBe(true);
    expect(result.current.secondHopNodeIds.size).toBe(1);
    expect(result.current.secondHopEdges).toHaveLength(1);
  });

  it('does not include the focused node itself in direct or second-hop sets', () => {
    useCanvasStore.getState().selectNode('A');
    const { result } = renderHook(() => useFocusedConnections(graph));
    expect(result.current.directNodeIds.has('A')).toBe(false);
    expect(result.current.secondHopNodeIds.has('A')).toBe(false);
  });

  it('handles edges where focused node is the target', () => {
    useCanvasStore.getState().selectNode('B');
    const { result } = renderHook(() => useFocusedConnections(graph));
    // B is target of A->B (imports) and source of B->D (depends_on)
    expect(result.current.directNodeIds.has('A')).toBe(true);
    expect(result.current.directNodeIds.has('D')).toBe(true);
    expect(result.current.directNodeIds.size).toBe(2);
  });
});
