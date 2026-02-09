/**
 * CellView Component
 *
 * Renders the interior of a class as a biological cell.
 * Methods are organelles, variables are near the nucleus,
 * and the cell membrane defines the boundary.
 * Uses CellLayoutEngine for positioning.
 */

import { useMemo } from 'react';
import { Membrane } from './Membrane';
import { Organelle } from './Organelle';
import { OrganelleConnection } from './OrganelleConnection';
import { CellLayoutEngine } from '../layout/engines/cellLayout';
import { extractCellSubgraph } from './cellViewUtils';
import type { Graph, Position3D } from '../../../shared/types';

interface CellViewProps {
  graph: Graph;
  focusedNodeId: string;
}

export function CellView({ graph, focusedNodeId }: CellViewProps) {
  // Extract subgraph for the focused class
  const subgraph = useMemo(
    () => extractCellSubgraph(graph, focusedNodeId),
    [graph, focusedNodeId]
  );

  // Compute cell layout
  const layout = useMemo(() => {
    if (!subgraph) return null;
    const engine = new CellLayoutEngine();
    return engine.layout(
      {
        nodes: subgraph.nodes,
        edges: subgraph.edges,
        metadata: graph.metadata,
      },
      {}
    );
  }, [subgraph, graph.metadata]);

  if (!subgraph || !layout) return null;

  const cellCenter = (layout.metadata?.cellCenter as Position3D) ?? {
    x: 0,
    y: 0,
    z: 0,
  };
  const membraneRadius = (layout.metadata?.membraneRadius as number) ?? 10;
  const nucleusRadius = (layout.metadata?.nucleusRadius as number) ?? 3;

  // Organelles = non-class/non-file children
  const organelles = subgraph.nodes.filter(
    (n) => n.id !== focusedNodeId
  );

  return (
    <group name="cell-view">
      {/* Cell membrane */}
      <Membrane center={cellCenter} radius={membraneRadius} />

      {/* Nucleus indicator */}
      <Membrane center={cellCenter} radius={nucleusRadius} isNucleus />

      {/* Organelles */}
      {organelles.map((node) => {
        const pos = layout.positions.get(node.id);
        if (!pos) return null;

        return <Organelle key={node.id} node={node} position={pos} />;
      })}

      {/* Connections between organelles */}
      {subgraph.edges.map((edge) => (
        <OrganelleConnection
          key={edge.id}
          sourcePos={layout.positions.get(edge.source)}
          targetPos={layout.positions.get(edge.target)}
        />
      ))}
    </group>
  );
}
