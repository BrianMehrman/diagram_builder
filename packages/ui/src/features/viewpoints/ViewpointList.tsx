/**
 * ViewpointList Component
 *
 * Display and manage saved viewpoints
 */

import { useState } from 'react';
import { useViewpointStore } from './store';
import { useCanvasStore } from '../canvas/store';
import type { Viewpoint } from '../../shared/types';

interface ViewpointListProps {
  className?: string;
  onViewpointApplied?: (viewpoint: Viewpoint) => void;
}

/**
 * Format ISO timestamp to readable date
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * ViewpointListItem component
 */
function ViewpointListItem({
  viewpoint,
  isActive,
  onApply,
  onDelete,
  onShare,
}: {
  viewpoint: Viewpoint;
  isActive: boolean;
  onApply: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  return (
    <div
      className={`border rounded-lg p-3 ${
        isActive
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      } transition-colors`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {viewpoint.name}
          </h4>
          {viewpoint.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {viewpoint.description}
            </p>
          )}
          <div className="text-xs text-gray-500 mt-2">
            {formatDate(viewpoint.createdAt)}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onApply}
            className="p-1.5 text-primary-600 hover:bg-primary-100 rounded transition-colors"
            title="Apply viewpoint"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={onShare}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Share viewpoint"
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Delete viewpoint"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Viewpoint details */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 space-y-1">
        <div>
          Camera: ({viewpoint.cameraPosition.x.toFixed(1)},{' '}
          {viewpoint.cameraPosition.y.toFixed(1)},{' '}
          {viewpoint.cameraPosition.z.toFixed(1)})
        </div>
        {viewpoint.filters?.lodLevel !== undefined && (
          <div>LOD: Level {viewpoint.filters.lodLevel}</div>
        )}
        {viewpoint.annotations && viewpoint.annotations.length > 0 && (
          <div>Annotations: {viewpoint.annotations.length}</div>
        )}
      </div>
    </div>
  );
}

/**
 * ViewpointList component
 */
export function ViewpointList({
  className = '',
  onViewpointApplied,
}: ViewpointListProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const viewpoints = useViewpointStore((state) => state.viewpoints);
  const activeViewpointId = useViewpointStore((state) => state.activeViewpointId);
  const setActiveViewpoint = useViewpointStore((state) => state.setActiveViewpoint);
  const deleteViewpoint = useViewpointStore((state) => state.deleteViewpoint);

  const setCameraPosition = useCanvasStore((state) => state.setCameraPosition);
  const setCameraTarget = useCanvasStore((state) => state.setCameraTarget);
  const setLodLevel = useCanvasStore((state) => state.setLodLevel);
  const selectNode = useCanvasStore((state) => state.selectNode);

  const handleApply = (viewpoint: Viewpoint) => {
    // Apply camera state
    setCameraPosition(viewpoint.cameraPosition);
    setCameraTarget(viewpoint.cameraTarget);

    // Apply filters
    if (viewpoint.filters) {
      if (viewpoint.filters.lodLevel !== undefined) {
        setLodLevel(viewpoint.filters.lodLevel);
      }
    }

    // Clear selection when applying viewpoint
    selectNode(null);

    setActiveViewpoint(viewpoint.id);

    if (onViewpointApplied) {
      onViewpointApplied(viewpoint);
    }
  };

  const handleDelete = (viewpointId: string) => {
    if (confirm('Are you sure you want to delete this viewpoint?')) {
      deleteViewpoint(viewpointId);
      setShareUrl(null);
    }
  };

  const handleShare = (viewpoint: Viewpoint) => {
    // Generate shareable URL with viewpoint data
    const encoded = btoa(JSON.stringify(viewpoint));
    const url = `${window.location.origin}${window.location.pathname}?viewpoint=${encoded}`;

    navigator.clipboard.writeText(url).then(() => {
      setShareUrl(url);
      setTimeout(() => setShareUrl(null), 3000);
    });
  };

  if (viewpoints.length === 0) {
    return (
      <div className={`text-center text-gray-500 text-sm py-8 ${className}`}>
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <p>No saved viewpoints yet</p>
        <p className="text-xs mt-1">
          Create a viewpoint to save your current view
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {shareUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          URL copied to clipboard!
        </div>
      )}

      {viewpoints.map((viewpoint) => (
        <ViewpointListItem
          key={viewpoint.id}
          viewpoint={viewpoint}
          isActive={viewpoint.id === activeViewpointId}
          onApply={() => handleApply(viewpoint)}
          onDelete={() => handleDelete(viewpoint.id)}
          onShare={() => handleShare(viewpoint)}
        />
      ))}
    </div>
  );
}
