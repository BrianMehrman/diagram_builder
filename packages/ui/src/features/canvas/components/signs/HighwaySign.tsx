/**
 * HighwaySign Component
 *
 * Large rectangular green panel on a post for file/module nodes.
 * Visible from the farthest distance (LOD 1).
 */

import { Text } from '@react-three/drei';
import type { SignProps } from './types';

const PANEL_COLOR = '#166534';
const TEXT_COLOR = '#ffffff';
const POST_COLOR = '#6b7280';

export function HighwaySign({ text, position, visible, color }: SignProps) {
  if (!visible) return null;

  const textColor = color ?? TEXT_COLOR;
  const panelWidth = Math.min(text.length * 0.25 + 0.6, 5);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Post */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshStandardMaterial color={POST_COLOR} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Green panel */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[panelWidth, 0.7, 0.06]} />
        <meshStandardMaterial color={PANEL_COLOR} roughness={0.6} />
      </mesh>
      {/* White text */}
      <Text
        position={[0, 0.15, 0.04]}
        fontSize={0.35}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
        frustumCulled
      >
        {text}
      </Text>
    </group>
  );
}
