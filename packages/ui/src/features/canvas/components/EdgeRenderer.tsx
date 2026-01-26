/**
 * EdgeRenderer Component
 *
 * Renders graph edges as lines/arrows between nodes
 */

import { useMemo } from 'react';
import { Vector3 } from 'three';
import type { GraphEdge, GraphNode } from '../../../shared/types';

interface EdgeRendererProps {
  edge: GraphEdge;
  nodes: GraphNode[];
}

/**
 * Get edge color based on type
 */
function getEdgeColor(type: GraphEdge['type']): string {
  switch (type) {
    case 'contains':
      return '#60a5fa'; // Blue
    case 'depends_on':
      return '#a78bfa'; // Purple
    case 'calls':
      return '#34d399'; // Green
    case 'inherits':
      return '#fbbf24'; // Amber
    case 'imports':
      return '#f87171'; // Red
    default:
      return '#9ca3af'; // Gray
  }
}

/**
 * EdgeRenderer component
 */
export function EdgeRenderer({ edge, nodes }: EdgeRendererProps) {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  // Create line geometry
  const points = useMemo(() => {
    if (!sourceNode?.position || !targetNode?.position) {
      return null;
    }

    return [
      new Vector3(
        sourceNode.position.x,
        sourceNode.position.y,
        sourceNode.position.z
      ),
      new Vector3(
        targetNode.position.x,
        targetNode.position.y,
        targetNode.position.z
      ),
    ];
  }, [sourceNode, targetNode]);

  if (!points) {
    return null;
  }

  const color = getEdgeColor(edge.type);

  const positionsArray = new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]));

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positionsArray, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.7} />
    </line>
  );
}
