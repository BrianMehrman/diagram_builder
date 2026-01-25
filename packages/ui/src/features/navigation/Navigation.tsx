import { SearchBar } from './SearchBar'
import { Breadcrumbs } from './Breadcrumbs'
import type { GraphNode, Position3D } from '../../shared/types'

interface NavigationProps {
  nodes?: GraphNode[]
  onNodeSelect?: (nodeId: string, position?: Position3D) => void
}

/**
 * Navigation Component
 *
 * Combines search and breadcrumbs into a unified navigation interface.
 * HUD is rendered separately in WorkspacePage to avoid duplication.
 */
export function Navigation({ nodes = [], onNodeSelect }: NavigationProps) {
  return (
    <div className="flex flex-col gap-2">
      <SearchBar nodes={nodes} onNodeSelect={onNodeSelect} />
      <Breadcrumbs />
    </div>
  )
}
