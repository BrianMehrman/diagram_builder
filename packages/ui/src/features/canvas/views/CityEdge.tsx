/**
 * CityEdge Component
 *
 * Renders a line between two buildings in the city view,
 * representing an import/dependency relationship.
 */

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { GraphEdge, Position3D } from '../../../shared/types';
import { getBuildingHeight } from './cityViewUtils';

interface CityEdgeProps {
  edge: GraphEdge;
  sourcePosition: Position3D;
  targetPosition: Position3D;
  sourceDepth: number | undefined;
  targetDepth: number | undefined;
}

/** Edge colors by type */
const EDGE_COLORS: Record<string, string> = {
  imports: '#60a5fa',
  depends_on: '#a78bfa',
  calls: '#34d399',
  inherits: '#f97316',
  contains: '#6b7280',
};

export function CityEdge({
  edge,
  sourcePosition,
  targetPosition,
  sourceDepth,
  targetDepth,
}: CityEdgeProps) {
  const color = EDGE_COLORS[edge.type] ?? '#60a5fa';

  // Connect from top of source building to top of target building
  const sourceHeight = getBuildingHeight(sourceDepth);
  const targetHeight = getBuildingHeight(targetDepth);

  const points = useMemo(
    () => [
      [sourcePosition.x, sourceHeight, sourcePosition.z] as [number, number, number],
      [targetPosition.x, targetHeight, targetPosition.z] as [number, number, number],
    ],
    [sourcePosition, targetPosition, sourceHeight, targetHeight]
  );

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.4}
    />
  );
}
