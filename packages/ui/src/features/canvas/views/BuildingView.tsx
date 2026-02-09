/**
 * BuildingView Component
 *
 * Renders the interior of a file as a multi-story building.
 * Classes appear as floors, methods/functions as rooms on each floor.
 * Uses BuildingLayoutEngine for positioning.
 */

import { useMemo } from 'react';
import { BuildingWalls } from './BuildingWalls';
import { Floor } from './Floor';
import { Room } from './Room';
import { BuildingLayoutEngine } from '../layout/engines/buildingLayout';
import { extractBuildingSubgraph } from './buildingViewUtils';
import type { Graph } from '../../../shared/types';

interface BuildingViewProps {
  graph: Graph;
  focusedNodeId: string;
}

interface FloorMeta {
  classId: string;
  floorIndex: number;
  y: number;
}

interface BuildingMeta {
  floorCount: number;
  floorHeight: number;
  buildingWidth: number;
  buildingDepth: number;
  totalHeight: number;
  floors: FloorMeta[];
}

export function BuildingView({ graph, focusedNodeId }: BuildingViewProps) {
  // Extract subgraph for the focused file
  const subgraph = useMemo(
    () => extractBuildingSubgraph(graph, focusedNodeId),
    [graph, focusedNodeId]
  );

  // Compute building layout
  const layout = useMemo(() => {
    if (!subgraph) return null;
    const engine = new BuildingLayoutEngine();
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

  const metadata = layout.metadata as BuildingMeta | undefined;
  if (!metadata) return null;

  // Rooms = non-file, non-class nodes
  const rooms = subgraph.nodes.filter(
    (n) => n.type !== 'file' && n.type !== 'class'
  );

  return (
    <group name="building-view">
      {/* Building walls */}
      <BuildingWalls
        width={metadata.buildingWidth}
        height={metadata.totalHeight}
        depth={metadata.buildingDepth}
        origin={layout.bounds.min}
      />

      {/* Floors (one per class) */}
      {metadata.floors.map((floor) => {
        const classNode = subgraph.nodes.find((n) => n.id === floor.classId);
        if (!classNode) return null;

        return (
          <Floor
            key={floor.classId}
            classNode={classNode}
            y={layout.bounds.min.y + floor.y}
            width={metadata.buildingWidth}
            depth={metadata.buildingDepth}
            origin={layout.bounds.min}
          />
        );
      })}

      {/* Rooms (methods, functions, variables) */}
      {rooms.map((node) => {
        const pos = layout.positions.get(node.id);
        if (!pos) return null;

        return <Room key={node.id} node={node} position={pos} />;
      })}
    </group>
  );
}
