/**
 * NeonSign Component
 *
 * Glowing emissive text for public API nodes.
 * Large, visible from far, with neon glow effect.
 */

import { Text } from '@react-three/drei';
import type { SignProps } from './types';

const DEFAULT_COLOR = '#00ff88';

export function NeonSign({ text, position, visible, color }: SignProps) {
  if (!visible) return null;

  const signColor = color ?? DEFAULT_COLOR;

  return (
    <group position={[position.x, position.y, position.z]}>
      <Text
        fontSize={0.5}
        color={signColor}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.03}
        outlineColor="#000000"
        frustumCulled
      >
        {text}
        <meshStandardMaterial
          attach="material"
          color={signColor}
          emissive={signColor}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </Text>
    </group>
  );
}
