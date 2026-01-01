/**
 * SearchBar Component
 *
 * Search interface for finding nodes in the graph
 */

import { useState, useMemo } from 'react'
import { useDebounce } from '../../shared/hooks'
import type { GraphNode } from '../../shared/types'

interface SearchBarProps {
  nodes?: GraphNode[]
  onNodeSelect?: (nodeId: string) => void
  className?: string
}

/**
 * SearchBar component
 */
export function SearchBar({ nodes = [], onNodeSelect = () => {}, className = '' }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Filter nodes based on search term
  const filteredNodes = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return []
    }

    const term = debouncedSearch.toLowerCase()
    return nodes
      .filter((node) => {
        // Search by label
        if (node.label.toLowerCase().includes(term)) {
          return true
        }
        // Search by ID
        if (node.id.toLowerCase().includes(term)) {
          return true
        }
        // Search by type
        if (node.type.toLowerCase().includes(term)) {
          return true
        }
        return false
      })
      .slice(0, 10) // Limit to 10 results
  }, [nodes, debouncedSearch])

  const handleNodeClick = (nodeId: string) => {
    onNodeSelect(nodeId)
    setSearchTerm('')
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setIsOpen(true)
  }

  const handleInputFocus = () => {
    if (searchTerm.trim()) {
      setIsOpen(true)
    }
  }

  const handleInputBlur = () => {
    // Delay to allow click events on results
    setTimeout(() => setIsOpen(false), 200)
  }

  const getNodeIcon = (type: GraphNode['type']): string => {
    switch (type) {
      case 'file':
        return '📄'
      case 'class':
        return '🏛️'
      case 'function':
        return '⚡'
      case 'method':
        return '🔧'
      case 'variable':
        return '📦'
      default:
        return '•'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Search nodes... (name, type, id)"
          className="w-full px-4 py-2 pl-10 pr-4 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Search results dropdown */}
      {isOpen && filteredNodes.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
          {filteredNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getNodeIcon(node.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{node.label}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="capitalize">{node.type}</span>
                    <span>•</span>
                    <span className="truncate">{node.id}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchTerm.trim() && filteredNodes.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
          <div className="text-center text-gray-500 text-sm">
            No nodes found matching "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  )
}
