/**
 * UndergroundPipe Component
 *
 * Renders import, inheritance, and implements relationships as pipe/conduit
 * geometry below the ground plane (y < 0).
 *
 * Route: source at surface → drop to pipe depth → horizontal run → rise to surface.
 * Uses CatmullRomCurve3 for smooth bends and TubeGeometry for the conduit look.
 * Pipe color and thickness encode the relationship type.
 */

import { useMemo } from 'react'
import {
  CatmullRomCurve3,
  Vector3,
  BackSide,
  ConeGeometry,
  MeshBasicMaterial,
  Mesh,
  Quaternion,
} from 'three'
import type { Position3D } from '../../../shared/types'
import {
  calculatePipeRoute,
  getPipeDepth,
  PIPE_COLORS,
  PIPE_DEFAULT_COLOR,
  PIPE_RADIUS,
  PIPE_DEFAULT_RADIUS,
} from '../views/pipeUtils'

export interface UndergroundPipeProps {
  sourcePosition: Position3D
  targetPosition: Position3D
  /** Edge relationship type — drives color and thickness. */
  edgeType: string
  /** Override automatic depth calculation (useful for stacking). */
  pipeDepth?: number
}

/** Tube curve segments (smoothness). */
const TUBE_SEGMENTS = 24
/** Tube radial segments (roundness). */
const RADIAL_SEGMENTS = 6
/** Outer glow tube radius addend. */
const GLOW_OFFSET = 0.04
/** Pipe and arrowhead opacity in normal mode. */
const PIPE_OPACITY = 0.75
/** Arrowhead cone height (world units). */
const ARROW_HEIGHT = 0.5
/** Arrowhead cone base radius. */
const ARROW_RADIUS = 0.15

export function UndergroundPipe({
  sourcePosition,
  targetPosition,
  edgeType,
  pipeDepth,
}: UndergroundPipeProps) {
  const depth = pipeDepth ?? getPipeDepth(sourcePosition, targetPosition)
  const color = PIPE_COLORS[edgeType] ?? PIPE_DEFAULT_COLOR
  const radius = PIPE_RADIUS[edgeType] ?? PIPE_DEFAULT_RADIUS

  const curve = useMemo(() => {
    const pts = calculatePipeRoute(sourcePosition, targetPosition, depth)
    return new CatmullRomCurve3(pts.map((p) => new Vector3(p.x, p.y, p.z)))
  }, [sourcePosition, targetPosition, depth])

  const arrowhead = useMemo(() => {
    const pts = calculatePipeRoute(sourcePosition, targetPosition, depth)
    // Last two points define the exit direction at the target surface
    const lastPt = pts.at(-1)
    const prevPt = pts.at(-2)

    if (!lastPt || !prevPt) {
      return new Mesh(
        new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 6),
        new MeshBasicMaterial({ color, transparent: true, opacity: PIPE_OPACITY })
      )
    }

    const tangent = new Vector3(
      lastPt.x - prevPt.x,
      lastPt.y - prevPt.y,
      lastPt.z - prevPt.z
    ).normalize()

    const cone = new Mesh(
      new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 6),
      new MeshBasicMaterial({ color, transparent: true, opacity: PIPE_OPACITY })
    )

    // Align cone to tangent direction
    const up = new Vector3(0, 1, 0)
    cone.quaternion.copy(new Quaternion().setFromUnitVectors(up, tangent))
    cone.position.set(lastPt.x, lastPt.y, lastPt.z)

    return cone
  }, [sourcePosition, targetPosition, depth, color])

  return (
    <group>
      {/* Main conduit tube */}
      <mesh>
        <tubeGeometry args={[curve, TUBE_SEGMENTS, radius, RADIAL_SEGMENTS, false]} />
        <meshStandardMaterial
          color={color}
          roughness={0.85}
          metalness={0.3}
          transparent
          opacity={PIPE_OPACITY}
        />
      </mesh>

      {/* Subtle outer glow shell */}
      <mesh>
        <tubeGeometry args={[curve, TUBE_SEGMENTS, radius + GLOW_OFFSET, RADIAL_SEGMENTS, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} side={BackSide} />
      </mesh>

      {/* Direction arrowhead at target surface exit */}
      <primitive object={arrowhead} />
    </group>
  )
}
