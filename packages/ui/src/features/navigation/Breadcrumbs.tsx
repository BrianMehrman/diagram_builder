/**
 * Breadcrumbs Component
 *
 * Navigation breadcrumbs showing current location in the graph hierarchy
 */

import type { GraphNode } from '../../shared/types'

interface BreadcrumbsProps {
  selectedNode?: GraphNode | null
  nodes?: GraphNode[]
  onNodeClick?: (nodeId: string) => void
  className?: string
}

/**
 * Build breadcrumb path from selected node
 */
function buildBreadcrumbPath(selectedNode: GraphNode, nodes: GraphNode[]): GraphNode[] {
  const path: GraphNode[] = [selectedNode]

  // Simple hierarchy: method -> class -> file
  let current = selectedNode

  // If it's a method, find its class
  if (current.type === 'method' && current.metadata.class) {
    const classNode = nodes.find((n) => n.id === current.metadata.class)
    if (classNode) {
      path.unshift(classNode)
      current = classNode
    }
  }

  // If it's a class or we found a class, find its file
  if ((current.type === 'class' || current.type === 'method') && current.metadata.file) {
    const fileNode = nodes.find((n) => n.id === current.metadata.file)
    if (fileNode) {
      path.unshift(fileNode)
    }
  }

  return path
}

/**
 * Breadcrumbs component
 */
export function Breadcrumbs({
  selectedNode = null,
  nodes = [],
  onNodeClick = () => {},
  className = '',
}: BreadcrumbsProps) {
  if (!selectedNode) {
    return null
  }

  const path = buildBreadcrumbPath(selectedNode, nodes)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>

      {path.map((node, index) => (
        <div key={node.id} className="flex items-center gap-2">
          {index > 0 && (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <button
            onClick={() => onNodeClick(node.id)}
            className={`text-sm font-medium transition-colors ${
              index === path.length - 1
                ? 'text-gray-900 cursor-default'
                : 'text-primary-600 hover:text-primary-700'
            }`}
          >
            {node.label}
          </button>
        </div>
      ))}
    </div>
  )
}
