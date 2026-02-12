/**
 * FloorLabels Component
 *
 * Renders method name labels at each floor position on a building.
 * Visible only at LOD level 3 or higher.
 */

import { Text } from '@react-three/drei';
import type { GraphNode } from '../../../../shared/types';

interface FloorLabelsProps {
  methods: GraphNode[];
  totalHeight: number;
  buildingWidth: number;
  lodLevel: number;
}

export function FloorLabels({ methods, totalHeight, buildingWidth, lodLevel }: FloorLabelsProps) {
  if (lodLevel < 3 || methods.length === 0) return null;

  const floorCount = methods.length;
  const floorHeight = totalHeight / floorCount;

  return (
    <>
      {methods.map((method, index) => {
        const y = floorHeight * (index + 0.5);
        const label = (method.label ?? method.id).split('/').pop()?.split('.').pop() ?? method.id;

        return (
          <Text
            key={method.id}
            position={[buildingWidth / 2 + 0.3, y, 0]}
            fontSize={0.2}
            color="#e2e8f0"
            anchorX="left"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {label}
          </Text>
        );
      })}
    </>
  );
}
