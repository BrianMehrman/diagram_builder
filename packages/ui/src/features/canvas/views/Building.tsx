/**
 * Building Component
 *
 * Renders a file as a 3D building in the city view.
 * Height represents abstraction depth, color represents directory grouping.
 */

import { useState, useMemo } from 'react'
import { Text } from '@react-three/drei'
import { useCanvasStore } from '../store'
import { useTransitMapStyle } from '../hooks/useTransitMapStyle'
import { useFocusedConnections } from '../hooks/useFocusedConnections'
import type { GraphNode, Position3D, Graph } from '../../../shared/types'
import { getDirectoryColor, getDirectoryFromLabel } from './colorUtils'
import { BUILDING_WIDTH, BUILDING_DEPTH } from './heightUtils'
import { getNodeFocusOpacity } from './focusUtils'
import { getBuildingConfig } from '../components/buildingGeometry'
import type { EncodedHeightOptions } from './heightUtils'

interface BuildingProps {
  node: GraphNode
  position: Position3D
  encodingOptions?: EncodedHeightOptions
  graph: Graph
}

export function Building({ node, position, encodingOptions, graph }: BuildingProps) {
  const [hovered, setHovered] = useState(false)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const selectNode = useCanvasStore((s) => s.selectNode)
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode)
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode)
  const transitStyle = useTransitMapStyle()

  const isSelected = selectedNodeId === node.id
  const { directNodeIds, secondHopNodeIds } = useFocusedConnections(graph)
  const isFocusMode = selectedNodeId !== null
  const focusOpacity = getNodeFocusOpacity(node.id, selectedNodeId, directNodeIds, secondHopNodeIds)
  const config = getBuildingConfig(node, encodingOptions)
  const buildingHeight = config.geometry.height
  const directory = getDirectoryFromLabel(node.label)
  const color = getDirectoryColor(directory)
  const label = node.label ?? ''
  const fileName = label.split('/').pop() ?? label

  const emissiveColor = useMemo(() => {
    if (isSelected) return color
    return '#000000'
  }, [isSelected, color])

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    selectNode(node.id)
  }

  const handleDoubleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    requestFlyToNode(node.id)
  }

  const handlePointerOver = () => {
    setHovered(true)
    setHoveredNode(node.id)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    setHoveredNode(null)
    document.body.style.cursor = 'auto'
  }

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Building body */}
      <mesh
        position={[0, buildingHeight / 2, 0]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[BUILDING_WIDTH, buildingHeight, BUILDING_DEPTH]} />
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : color}
          emissive={emissiveColor}
          emissiveIntensity={isSelected ? 0.4 : 0}
          roughness={0.7}
          metalness={0.1}
          opacity={isFocusMode ? focusOpacity : transitStyle.opacity}
          transparent={isFocusMode || transitStyle.transparent}
        />
      </mesh>

      {/* Selection highlight ring at the base of the building */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[
              Math.max(BUILDING_WIDTH, BUILDING_DEPTH) * 0.6,
              Math.max(BUILDING_WIDTH, BUILDING_DEPTH) * 0.75,
              32,
            ]}
          />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Building label */}
      <Text
        position={[0, buildingHeight + 0.5, 0]}
        fontSize={0.35}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {fileName}
      </Text>
    </group>
  )
}
