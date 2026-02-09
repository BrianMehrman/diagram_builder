/**
 * RooftopGarden Component
 *
 * Renders nested types (inner classes, nested enums) as progressively
 * smaller structures stacked on top of a parent building. Each tier
 * shrinks: tier 1 = 60%, tier 2 = 40%, tier 3 = 25% of parent width.
 * If there are more than 3 tiers of nesting, a count badge shows
 * how many additional nested types are hidden.
 */

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { GraphNode } from '../../../../shared/types';
import { collectNestingTiers, countOverflowChildren } from './nestedTypeUtils';

/** Scale factors for each tier relative to parent width */
const TIER_SCALES = [0.6, 0.4, 0.25];

/** Height of each rooftop tier */
const TIER_HEIGHT = 0.8;

/** Color palette for tier levels */
const TIER_COLORS = ['#60a5fa', '#a78bfa', '#f472b6'];

interface RooftopGardenProps {
  /** The parent node whose children are shown */
  parentNode: GraphNode;
  /** Width of the parent building */
  parentWidth: number;
  /** Height of the parent building (rooftop starts here) */
  parentHeight: number;
  /** Nested type map from buildNestedTypeMap */
  nestedMap: Map<string, GraphNode[]>;
}

export function RooftopGarden({
  parentNode,
  parentWidth,
  parentHeight,
  nestedMap,
}: RooftopGardenProps) {
  const tiers = useMemo(
    () => collectNestingTiers(parentNode.id, nestedMap, 3),
    [parentNode.id, nestedMap],
  );

  const overflowCount = useMemo(() => {
    if (tiers.length < 3) return 0;
    const lastTier = tiers[2];
    if (!lastTier) return 0;
    return countOverflowChildren(
      lastTier.map((n) => n.id),
      nestedMap,
    );
  }, [tiers, nestedMap]);

  if (tiers.length === 0) return null;

  let cumulativeY = parentHeight;

  return (
    <group>
      {tiers.map((_tierNodes, tierIndex) => {
        const scale = TIER_SCALES[tierIndex] ?? 0.25;
        const tierWidth = parentWidth * scale;
        const color = TIER_COLORS[tierIndex] ?? '#f472b6';
        const y = cumulativeY + TIER_HEIGHT / 2;
        cumulativeY += TIER_HEIGHT;

        return (
          <mesh key={`tier-${tierIndex}`} position={[0, y, 0]}>
            <boxGeometry args={[tierWidth, TIER_HEIGHT, tierWidth]} />
            <meshStandardMaterial
              color={color}
              roughness={0.6}
              metalness={0.2}
            />
          </mesh>
        );
      })}

      {/* Overflow badge when >3 tiers exist */}
      {overflowCount > 0 && (
        <Text
          position={[0, cumulativeY + 0.3, 0]}
          fontSize={0.3}
          color="#fbbf24"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {`+${overflowCount}`}
        </Text>
      )}
    </group>
  );
}
