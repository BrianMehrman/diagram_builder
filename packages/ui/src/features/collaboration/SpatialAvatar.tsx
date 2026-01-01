/**
 * SpatialAvatar Component
 *
 * 3D avatar representing another user in the collaboration session
 */

import { Text } from '@react-three/drei'
import type { User } from './store'

interface SpatialAvatarProps {
  user: User
}

/**
 * SpatialAvatar component
 */
function SpatialAvatar({ user }: SpatialAvatarProps) {
  const { position, color, username, isActive } = user

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Avatar sphere */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.5 : 0.2}
          opacity={isActive ? 1 : 0.5}
          transparent
        />
      </mesh>

      {/* Cone pointer above avatar */}
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.15, 0.3, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Username label */}
      <Text
        position={[0, 0.9, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {username}
      </Text>

      {/* Activity indicator ring */}
      {isActive && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.45, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}

export default SpatialAvatar
