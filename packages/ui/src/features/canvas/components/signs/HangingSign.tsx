/**
 * HangingSign Component
 *
 * Text suspended from a bracket for class-level nodes.
 * Medium visibility, like a swinging shop sign.
 */

import { Text } from '@react-three/drei';
import type { SignProps } from './types';

const DEFAULT_COLOR = '#ffffff';
const BRACKET_COLOR = '#6b7280';
const PANEL_COLOR = '#1e293b';

export function HangingSign({ text, position, visible, color }: SignProps) {
  if (!visible) return null;

  const textColor = color ?? DEFAULT_COLOR;
  const panelWidth = Math.min(text.length * 0.2 + 0.4, 4);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Horizontal bracket arm */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.05]} />
        <meshStandardMaterial color={BRACKET_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Sign panel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[panelWidth, 0.5, 0.05]} />
        <meshStandardMaterial color={PANEL_COLOR} roughness={0.8} />
      </mesh>
      {/* Text on panel */}
      <Text
        position={[0, 0, 0.03]}
        fontSize={0.25}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        frustumCulled
      >
        {text}
      </Text>
    </group>
  );
}
