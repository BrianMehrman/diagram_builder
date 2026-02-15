/**
 * NodeDetails Component
 *
 * Displays details of the selected node with dark theme matching the HUD.
 */

import { useCanvasStore } from './store';
import type { GraphNode } from '../../shared/types';

interface NodeDetailsProps {
  nodes: GraphNode[];
  className?: string;
}

/**
 * Get node type icon
 */
function getNodeIcon(type: GraphNode['type']): string {
  switch (type) {
    case 'file':
      return '📄';
    case 'class':
      return '🏛️';
    case 'function':
      return '⚡';
    case 'method':
      return '🔧';
    case 'variable':
      return '📦';
    case 'interface':
      return '🔗';
    case 'enum':
      return '📋';
    case 'abstract_class':
      return '🏗️';
    default:
      return '❓';
  }
}

/**
 * NodeDetails component
 */
export function NodeDetails({ nodes, className = '' }: NodeDetailsProps) {
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const layoutPositions = useCanvasStore((state) => state.layoutPositions);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return null;
  }

  const handleClose = () => {
    selectNode(null);
  };

  // Prefer layout positions over graph node positions
  const layoutPos = selectedNodeId ? layoutPositions.get(selectedNodeId) : undefined;
  const displayPos = layoutPos ?? selectedNode.position;

  return (
    <div
      className={`absolute top-20 right-4 rounded-lg shadow-xl p-4 max-w-sm text-white backdrop-blur-md ${className}`}
      style={{ backgroundColor: 'rgba(26, 31, 46, 0.95)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getNodeIcon(selectedNode.type)}</span>
          <h3 className="text-lg font-bold text-white">
            {selectedNode.label}
          </h3>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Type
          </div>
          <div className="text-sm text-gray-200 capitalize mt-1">
            {selectedNode.type.replace('_', ' ')}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            ID
          </div>
          <div className="text-sm text-gray-200 font-mono mt-1 break-all">
            {selectedNode.id}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            LOD Level
          </div>
          <div className="text-sm text-gray-200 mt-1">
            {selectedNode.lod}
          </div>
        </div>

        {displayPos && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Position
            </div>
            <div className="text-sm text-gray-200 font-mono mt-1">
              x: {displayPos.x.toFixed(2)}, y:{' '}
              {displayPos.y.toFixed(2)}, z:{' '}
              {displayPos.z.toFixed(2)}
            </div>
          </div>
        )}

        {selectedNode.depth !== undefined && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Depth
            </div>
            <div className="text-sm text-gray-200 mt-1">{selectedNode.depth}</div>
          </div>
        )}

        {selectedNode.parentId && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Parent
            </div>
            <div className="text-sm text-gray-200 font-mono mt-1 break-all">
              {selectedNode.parentId}
            </div>
          </div>
        )}

        {selectedNode.visibility && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Visibility
            </div>
            <div className="text-sm text-gray-200 capitalize mt-1">{selectedNode.visibility}</div>
          </div>
        )}

        {selectedNode.methodCount !== undefined && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Methods
            </div>
            <div className="text-sm text-gray-200 mt-1">{selectedNode.methodCount}</div>
          </div>
        )}

        {/* Boolean flags */}
        {(selectedNode.isExternal || selectedNode.isDeprecated || selectedNode.isExported) && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Flags
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedNode.isExternal && (
                <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded">external</span>
              )}
              {selectedNode.isDeprecated && (
                <span className="text-[10px] bg-yellow-900/60 text-yellow-300 px-1.5 py-0.5 rounded">deprecated</span>
              )}
              {selectedNode.isExported && (
                <span className="text-[10px] bg-green-900/60 text-green-300 px-1.5 py-0.5 rounded">exported</span>
              )}
            </div>
          </div>
        )}

        {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Metadata
            </div>
            <div className="text-sm text-gray-200 mt-1 space-y-1">
              {Object.entries(selectedNode.metadata || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400">{key}:</span>
                  <span className="font-medium">
                    {typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-600">
        <button
          onClick={handleClose}
          className="w-full px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-600/60 rounded transition-colors"
        >
          Deselect Node
        </button>
      </div>
    </div>
  );
}
