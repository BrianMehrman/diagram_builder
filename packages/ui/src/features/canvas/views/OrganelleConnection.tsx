/**
 * OrganelleConnection Component
 *
 * Renders a subtle line between two organelles representing
 * a call or data flow relationship.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import type { Position3D } from '../../../shared/types'

interface OrganelleConnectionProps {
  sourcePos?: Position3D
  targetPos?: Position3D
}

export function OrganelleConnection({ sourcePos, targetPos }: OrganelleConnectionProps) {
  const line = useMemo(() => {
    if (!sourcePos || !targetPos) return null
    const points = new Float32Array([
      sourcePos.x,
      sourcePos.y,
      sourcePos.z,
      targetPos.x,
      targetPos.y,
      targetPos.z,
    ])
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#475569', transparent: true, opacity: 0.3 }))
  }, [sourcePos, targetPos])

  if (!line) return null
  return <primitive object={line} />
}
