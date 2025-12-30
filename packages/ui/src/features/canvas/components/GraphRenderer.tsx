/**
 * GraphRenderer Component
 *
 * Renders the complete graph with LOD filtering
 */

import { useMemo } from 'react';
import { NodeRenderer } from './NodeRenderer';
import { EdgeRenderer } from './EdgeRenderer';
import { useCanvasStore } from '../store';
import type { Graph } from '../../../shared/types';

interface GraphRendererProps {
  graph: Graph;
}

/**
 * GraphRenderer component
 */
export function GraphRenderer({ graph }: GraphRendererProps) {
  const lodLevel = useCanvasStore((state) => state.lodLevel);

  // Filter nodes by LOD level
  const visibleNodes = useMemo(() => {
    return graph.nodes.filter((node) => node.lodLevel <= lodLevel);
  }, [graph.nodes, lodLevel]);

  // Filter edges - only show edges where both nodes are visible
  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    return graph.edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [graph.edges, visibleNodes]);

  return (
    <group>
      {/* Render edges first (so they appear behind nodes) */}
      {visibleEdges.map((edge) => (
        <EdgeRenderer key={edge.id} edge={edge} nodes={visibleNodes} />
      ))}

      {/* Render nodes */}
      {visibleNodes.map((node) => (
        <NodeRenderer key={node.id} node={node} />
      ))}
    </group>
  );
}

// Log stats in development
if (process.env.NODE_ENV === 'development') {
  // This runs outside render to avoid React warnings
}
