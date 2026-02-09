/**
 * MarqueeSign Component
 *
 * Large illuminated text for exported symbol nodes.
 * Bright emissive border with lit-up appearance.
 */

import { Text } from '@react-three/drei';
import type { SignProps } from './types';

const DEFAULT_COLOR = '#fbbf24';
const BORDER_COLOR = '#f59e0b';

export function MarqueeSign({ text, position, visible, color }: SignProps) {
  if (!visible) return null;

  const textColor = color ?? DEFAULT_COLOR;
  const panelWidth = Math.min(text.length * 0.22 + 0.5, 4.5);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Emissive border frame */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[panelWidth + 0.15, 0.65, 0.04]} />
        <meshStandardMaterial
          color={BORDER_COLOR}
          emissive={BORDER_COLOR}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      {/* Dark panel background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[panelWidth, 0.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* Illuminated text */}
      <Text
        fontSize={0.3}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        frustumCulled
      >
        {text}
        <meshStandardMaterial
          attach="material"
          color={textColor}
          emissive={textColor}
          emissiveIntensity={0.4}
          toneMapped={false}
        />
      </Text>
    </group>
  );
}
