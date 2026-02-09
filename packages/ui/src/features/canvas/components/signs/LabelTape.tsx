/**
 * LabelTape Component
 *
 * Small flat text strip for variable nodes.
 * Minimal, only visible at close range.
 */

import { Text } from '@react-three/drei';
import type { SignProps } from './types';

const DEFAULT_COLOR = '#d1d5db';
const TAPE_COLOR = '#374151';

export function LabelTape({ text, position, visible, color }: SignProps) {
  if (!visible) return null;

  const textColor = color ?? DEFAULT_COLOR;
  const tapeWidth = Math.min(text.length * 0.12 + 0.2, 2.5);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Tape backing */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[tapeWidth, 0.2]} />
        <meshStandardMaterial color={TAPE_COLOR} roughness={0.9} />
      </mesh>
      <Text
        fontSize={0.12}
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
