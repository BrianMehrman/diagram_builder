/**
 * InfrastructureFactory
 *
 * Provides a factory function that maps an external IVMNode's
 * `metadata.infrastructureType` to the appropriate infrastructure landmark
 * component. Returns null for 'general' or missing types, signaling
 * the caller to fall back to ExternalBuilding.
 *
 * Extracted from CityBlocks as part of the visualization renderer
 * abstraction plan (Task 9).
 */

import React from 'react'
import {
  PowerStation,
  WaterTower,
  MunicipalBuilding,
  Harbor,
  Airport,
  CityGate,
} from '../components/infrastructure'
import type { IVMNode, Position3D } from '../../../shared/types'

/**
 * Renders the appropriate infrastructure landmark for an external node
 * based on its `metadata.infrastructureType`. Returns null for 'general'
 * or missing type, signaling fallback to ExternalBuilding.
 *
 * Mirrors the logic of renderInfrastructureLandmark from CityBlocks.tsx.
 */
export function createInfrastructureElement(
  node: IVMNode,
  position: Position3D
): React.JSX.Element | null {
  const infraType = node.metadata?.properties?.infrastructureType as string | undefined
  if (!infraType || infraType === 'general') return null

  const props = { key: node.id, node, position }
  switch (infraType) {
    case 'database':
      return <Harbor {...props} />
    case 'api':
      return <Airport {...props} />
    case 'queue':
      return <PowerStation {...props} />
    case 'cache':
      return <WaterTower {...props} />
    case 'auth':
      return <CityGate {...props} />
    case 'logging':
    case 'filesystem':
      return <MunicipalBuilding {...props} />
    default:
      return null
  }
}
