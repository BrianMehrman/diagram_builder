/**
 * DeprecatedOverlay Component
 *
 * Wraps a building with a dark, striped "boarded-up" appearance when
 * the node is marked as deprecated. Renders as a semi-transparent
 * overlay mesh matching the building's dimensions.
 *
 * The caller decides whether a node qualifies (via deprecatedUtils);
 * this component simply renders the overlay when conditions are met.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useCanvasStore } from '../../store';
import type { GraphNode, Position3D } from '../../../../shared/types';
import {
  DEPRECATED_COLOR,
  DEPRECATED_STRIPE_COLOR,
  DEPRECATED_ROUGHNESS,
  DEPRECATED_METALNESS,
} from './deprecatedUtils';

export interface DeprecatedOverlayProps {
  node: GraphNode;
  position: Position3D;
  buildingWidth: number;
  buildingDepth: number;
  buildingHeight: number;
}

/** Stripe width in UV space */
const STRIPE_REPEAT = 8;

/**
 * Create a striped canvas texture for the boarded-up look.
 * Alternates between dark and slightly lighter stripes.
 */
function createStripedTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Fill with base dark color
  ctx.fillStyle = DEPRECATED_COLOR;
  ctx.fillRect(0, 0, size, size);

  // Draw diagonal stripes
  ctx.strokeStyle = DEPRECATED_STRIPE_COLOR;
  ctx.lineWidth = 4;
  for (let i = -size; i < size * 2; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(STRIPE_REPEAT, STRIPE_REPEAT);
  return texture;
}

export function DeprecatedOverlay({
  position,
  buildingWidth,
  buildingDepth,
  buildingHeight,
}: DeprecatedOverlayProps) {
  const deprecatedEnabled = useCanvasStore(
    (s) => s.citySettings.atmosphereOverlays.deprecated,
  );

  // Memoize the striped material
  const material = useMemo(() => {
    const texture = createStripedTexture();
    return new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: 0.7,
      roughness: DEPRECATED_ROUGHNESS,
      metalness: DEPRECATED_METALNESS,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  // AC-3: toggleable via atmosphereOverlays.deprecated
  if (!deprecatedEnabled) return null;

  // Slight offset to prevent z-fighting with the building underneath
  const offset = 0.02;

  return (
    <mesh
      position={[
        position.x,
        buildingHeight / 2,
        position.z,
      ]}
      material={material}
    >
      <boxGeometry
        args={[
          buildingWidth + offset,
          buildingHeight + offset,
          buildingDepth + offset,
        ]}
      />
    </mesh>
  );
}
