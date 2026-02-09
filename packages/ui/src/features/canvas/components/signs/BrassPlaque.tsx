/**
 * BrassPlaque Component
 *
 * Small matte metallic text for private/internal nodes.
 * Subtle, only visible at close range.
 */

import { Text } from '@react-three/drei';
import type { SignProps } from './types';

const DEFAULT_COLOR = '#b8860b';

export function BrassPlaque({ text, position, visible, color }: SignProps) {
  if (!visible) return null;

  const signColor = color ?? DEFAULT_COLOR;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Small brass backing plate */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[Math.min(text.length * 0.15 + 0.3, 3), 0.35]} />
        <meshStandardMaterial
          color="#8B7355"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      <Text
        fontSize={0.18}
        color={signColor}
        anchorX="center"
        anchorY="middle"
        frustumCulled
      >
        {text}
      </Text>
    </group>
  );
}
