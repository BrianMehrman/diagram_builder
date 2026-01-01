import { SearchBar } from './SearchBar'
import { Breadcrumbs } from './Breadcrumbs'
import { HUD } from './HUD'

/**
 * Navigation Component
 *
 * Combines search, breadcrumbs, and HUD into a unified navigation interface.
 * Typically positioned in the top-left of the canvas view.
 */
export function Navigation() {
  return (
    <div className="flex flex-col gap-2">
      <SearchBar />
      <Breadcrumbs />
      <HUD />
    </div>
  )
}
