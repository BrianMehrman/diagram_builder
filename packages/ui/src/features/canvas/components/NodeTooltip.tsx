/**
 * NodeTooltip Component
 *
 * Shows node details as a tooltip overlay when a node is highlighted
 * (typically after camera flight arrival)
 */

import { useCanvasStore } from '../store';
import type { GraphNode } from '../../../shared/types';

interface NodeTooltipProps {
  nodes: GraphNode[];
  className?: string;
}

/**
 * Get a human-readable type label
 */
function getTypeLabel(type: GraphNode['type']): string {
  switch (type) {
    case 'file':
      return 'File';
    case 'class':
      return 'Class';
    case 'function':
      return 'Function';
    case 'method':
      return 'Method';
    case 'variable':
      return 'Variable';
    default:
      return 'Node';
  }
}

/**
 * Get icon for node type
 */
function getTypeIcon(type: GraphNode['type']): string {
  switch (type) {
    case 'file':
      return '📄';
    case 'class':
      return '📦';
    case 'function':
      return '⚡';
    case 'method':
      return '🔧';
    case 'variable':
      return '📌';
    default:
      return '•';
  }
}

/**
 * NodeTooltip component
 *
 * Displays a floating tooltip with node details when a node is highlighted
 */
export function NodeTooltip({ nodes, className = '' }: NodeTooltipProps) {
  const highlightedNodeId = useCanvasStore((state) => state.highlightedNodeId);

  // Find the highlighted node
  const highlightedNode = highlightedNodeId
    ? nodes.find((n) => n.id === highlightedNodeId)
    : null;

  if (!highlightedNode) {
    return null;
  }

  // Extract metadata for display
  const path = highlightedNode.metadata.path as string | undefined;
  const language = highlightedNode.metadata.language as string | undefined;
  const loc = highlightedNode.metadata.loc as number | undefined;
  const complexity = highlightedNode.metadata.complexity as number | undefined;

  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 ${className}`}
      role="tooltip"
      aria-live="polite"
    >
      <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-lg shadow-xl border border-gray-700 px-4 py-3 min-w-[200px] max-w-[400px] animate-fadeIn">
        {/* Header with type and name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg" aria-hidden="true">
            {getTypeIcon(highlightedNode.type)}
          </span>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">
              {getTypeLabel(highlightedNode.type)}
            </div>
            <div className="font-semibold text-white truncate">
              {highlightedNode.label}
            </div>
          </div>
        </div>

        {/* Path (if available) */}
        {path && (
          <div className="text-xs text-gray-400 truncate mb-2" title={path}>
            {path}
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-4 text-xs text-gray-300">
          {language && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Lang:</span>
              <span>{language}</span>
            </div>
          )}
          {loc !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">LOC:</span>
              <span>{loc}</span>
            </div>
          )}
          {complexity !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Complexity:</span>
              <span>{complexity}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">LOD:</span>
            <span>{highlightedNode.lod}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
