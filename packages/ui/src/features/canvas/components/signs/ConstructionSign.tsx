/**
 * ConstructionSign Component
 *
 * Yellow diamond warning sign for deprecated nodes.
 * Rotated 45 degrees to form a diamond shape.
 */

import { Text } from '@react-three/drei';
import type { SignProps } from './types';

const SIGN_COLOR = '#eab308';
const TEXT_COLOR = '#000000';
const POST_COLOR = '#78716c';

export function ConstructionSign({ text, position, visible, color }: SignProps) {
  if (!visible) return null;

  const signColor = color ?? SIGN_COLOR;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Post */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[0.06, 0.8, 0.06]} />
        <meshStandardMaterial color={POST_COLOR} roughness={0.8} />
      </mesh>
      {/* Diamond sign (rotated 45 degrees) */}
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshStandardMaterial
          color={signColor}
          roughness={0.5}
          side={2} /* DoubleSide */
        />
      </mesh>
      {/* Warning text below diamond */}
      <Text
        position={[0, -0.05, 0.02]}
        fontSize={0.15}
        color={TEXT_COLOR}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.5}
        frustumCulled
      >
        {text}
      </Text>
    </group>
  );
}
