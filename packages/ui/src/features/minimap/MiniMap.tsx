/**
 * MiniMap Component
 *
 * Combines file tree view and 3D spatial overview
 */

import { useState } from 'react';
import { FileTreeView } from './FileTreeView';
import { SpatialOverview } from './SpatialOverview';
import { useCanvasStore } from '../canvas/store';
import type { GraphNode } from '../../shared/types';

interface MiniMapProps {
  nodes: GraphNode[];
  className?: string;
}

type ViewMode = 'tree' | 'spatial';

/**
 * MiniMap component
 */
export function MiniMap({ nodes, className = '' }: MiniMapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const camera = useCanvasStore((state) => state.camera);

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col ${className}`}
    >
      {/* Header with toggle */}
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">MiniMap</h3>
          <div className="flex gap-1 bg-white rounded p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'tree'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('spatial')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'spatial'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              3D
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'tree' ? (
          <FileTreeView
            nodes={nodes}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />
        ) : (
          <SpatialOverview
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            cameraPosition={camera.position}
          />
        )}
      </div>

      {/* Footer stats */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          {nodes.length} nodes
          {selectedNodeId && ' • 1 selected'}
        </div>
      </div>
    </div>
  );
}
