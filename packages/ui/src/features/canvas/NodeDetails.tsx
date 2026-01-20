/**
 * NodeDetails Component
 *
 * Displays details of the selected node
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

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return null;
  }

  const handleClose = () => {
    selectNode(null);
  };

  return (
    <div
      className={`absolute top-20 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getNodeIcon(selectedNode.type)}</span>
          <h3 className="text-lg font-bold text-gray-900">
            {selectedNode.label}
          </h3>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
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
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Type
          </div>
          <div className="text-sm text-gray-900 capitalize mt-1">
            {selectedNode.type}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            ID
          </div>
          <div className="text-sm text-gray-900 font-mono mt-1 break-all">
            {selectedNode.id}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            LOD Level
          </div>
          <div className="text-sm text-gray-900 mt-1">
            {selectedNode.lod}
          </div>
        </div>

        {selectedNode.position && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Position
            </div>
            <div className="text-sm text-gray-900 font-mono mt-1">
              x: {selectedNode.position.x.toFixed(2)}, y:{' '}
              {selectedNode.position.y.toFixed(2)}, z:{' '}
              {selectedNode.position.z.toFixed(2)}
            </div>
          </div>
        )}

        {Object.keys(selectedNode.metadata).length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Metadata
            </div>
            <div className="text-sm text-gray-900 mt-1 space-y-1">
              {Object.entries(selectedNode.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
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

      <div className="mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={handleClose}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Deselect Node
        </button>
      </div>
    </div>
  );
}
