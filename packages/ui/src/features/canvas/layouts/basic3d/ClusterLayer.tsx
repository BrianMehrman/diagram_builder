/**
 * ClusterLayer.tsx
 *
 * Renders cluster proxies at LOD 1–2. Each cluster is a translucent sphere
 * at the group centroid with a text label showing the cluster name and count.
 *
 * Clicking a cluster flies the camera to its centroid (into LOD 3 range).
 */

import { useRef } from 'react'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useCanvasStore } from '../../store'
import type { ClusterData } from './clusterBuilder'

// Colour per dominant node type — mirrors basic3dShapes.ts palette
const TYPE_COLORS: Record<string, string> = {
  file: '#27AE60',
  directory: '#27AE60',
  class: '#E67E22',
  interface: '#95A5A6',
  type: '#95A5A6',
  function: '#4A90D9',
  method: '#4A90D9',
  variable: '#9B59B6',
  enum: '#F39C12',
  namespace: '#ECEFF1',
  package: '#ECEFF1',
  repository: '#ECEFF1',
}

function clusterColor(dominantType: string): string {
  return TYPE_COLORS[dominantType] ?? '#4A90D9'
}

interface ClusterProxyProps {
  cluster: ClusterData
}

function ClusterProxy({ cluster }: ClusterProxyProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const setCameraPosition = useCanvasStore((s) => s.setCameraPosition)
  const setCameraTarget = useCanvasStore((s) => s.setCameraTarget)
  const color = clusterColor(cluster.dominantType)
  const radius = Math.max(cluster.radius, 5) // minimum visible size
  const { centroid } = cluster

  function handleClick() {
    // Fly to cluster: position camera so we cross into LOD 3 range (<60 units from centroid)
    setCameraTarget(centroid)
    setCameraPosition({
      x: centroid.x,
      y: centroid.y + 50,
      z: centroid.z + 50,
    })
  }

  return (
    <group position={[centroid.x, centroid.y, centroid.z]}>
      {/* Translucent bounding sphere */}
      <mesh ref={meshRef} onClick={handleClick} data-testid="cluster-sphere">
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.25} depthWrite={false} />
      </mesh>

      {/* Label */}
      <Billboard>
        <Text
          position={[0, radius + 2, 0]}
          fontSize={3}
          color="#FFFFFF"
          anchorX="center"
          anchorY="bottom"
          data-testid="cluster-label"
        >
          {cluster.label}
        </Text>
      </Billboard>
    </group>
  )
}

export function ClusterLayer() {
  const clusters = useCanvasStore((s) => s.clusters)

  return (
    <group name="cluster-layer" data-testid="cluster-layer">
      {Array.from(clusters.values()).map((cluster) => (
        <ClusterProxy key={cluster.id} cluster={cluster} />
      ))}
    </group>
  )
}
