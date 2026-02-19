/**
 * FunctionShop / Function Kiosk Component (Story 11-12)
 *
 * Renders a standalone function node as a small kiosk:
 *   - Compact single-story box body (KIOSK_WIDTH × KIOSK_HEIGHT × KIOSK_DEPTH)
 *   - Thin flat awning slab extending beyond the footprint (KIOSK_AWNING_OVERHANG)
 *   - Warm amber palette — visually distinct from class buildings
 *
 * Visually distinct from class buildings:
 *   - Smaller (1.5 × 1.0 × 1.5 vs CLASS_WIDTH 2.5 multi-story)
 *   - Box shape with awning (vs flat-roofed towers)
 *   - Warm amber material (vs directory-colour steel towers)
 *
 * Overhead wires from Story 11-11 connect to kiosk rooftops (Y = KIOSK_HEIGHT).
 */

import { useState, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import { getBuildingConfig } from '../buildingGeometry';
import {
  KIOSK_AWNING_OVERHANG,
  KIOSK_AWNING_THICKNESS,
} from '../../views/cityViewUtils';
import { useTransitMapStyle } from '../../hooks/useTransitMapStyle';
import type { TypedBuildingProps } from './types';
import type { EncodedHeightOptions } from '../../views/cityViewUtils';

/** Base kiosk body colour (warm amber). */
const KIOSK_COLOR = '#f59e0b';
/** Awning colour (slightly darker amber). */
const KIOSK_AWNING_COLOR = '#b45309';
/** Hover highlight colour. */
const KIOSK_HOVER_COLOR = '#fbbf24';

interface FunctionShopProps extends TypedBuildingProps {
  encodingOptions?: EncodedHeightOptions;
}

export function FunctionShop({ node, position, encodingOptions }: FunctionShopProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);
  const transitStyle = useTransitMapStyle();

  const isSelected = selectedNodeId === node.id;
  const config = useMemo(() => getBuildingConfig(node, encodingOptions), [node, encodingOptions]);
  const { width, height, depth } = config.geometry;

  const bodyColor = hovered ? KIOSK_HOVER_COLOR : KIOSK_COLOR;
  const awningWidth = width + KIOSK_AWNING_OVERHANG * 2;
  const awningDepth = depth + KIOSK_AWNING_OVERHANG * 2;
  // Awning sits just above the kiosk body (~80% up the wall)
  const awningY = height * 0.8 + KIOSK_AWNING_THICKNESS / 2;

  const fileName = (node.label ?? node.id).split('/').pop() ?? node.id;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Kiosk body */}
      <mesh
        position={[0, height / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => {
          setHovered(true);
          setHoveredNode(node.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveredNode(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={isSelected ? KIOSK_COLOR : '#000000'}
          emissiveIntensity={isSelected ? 0.4 : 0}
          roughness={config.material.roughness}
          metalness={config.material.metalness}
          opacity={transitStyle.opacity}
          transparent={transitStyle.transparent}
        />
      </mesh>

      {/* Awning slab */}
      <mesh position={[0, awningY, 0]}>
        <boxGeometry args={[awningWidth, KIOSK_AWNING_THICKNESS, awningDepth]} />
        <meshStandardMaterial
          color={KIOSK_AWNING_COLOR}
          roughness={0.8}
          metalness={0.0}
          opacity={transitStyle.opacity}
          transparent={transitStyle.transparent}
        />
      </mesh>

      <Text
        position={[0, height + 0.4, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {fileName}
      </Text>
    </group>
  );
}
