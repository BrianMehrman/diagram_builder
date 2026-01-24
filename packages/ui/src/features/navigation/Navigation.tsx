import { SearchBar } from './SearchBar'
import { Breadcrumbs } from './Breadcrumbs'

/**
 * Navigation Component
 *
 * Combines search and breadcrumbs into a unified navigation interface.
 * HUD is rendered separately in WorkspacePage to avoid duplication.
 */
export function Navigation() {
  return (
    <div className="flex flex-col gap-2">
      <SearchBar />
      <Breadcrumbs />
    </div>
  )
}
