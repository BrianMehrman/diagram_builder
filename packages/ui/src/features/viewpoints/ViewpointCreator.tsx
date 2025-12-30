/**
 * ViewpointCreator Component
 *
 * UI for creating new viewpoints from current camera state
 */

import { useState } from 'react';
import { useCanvasStore } from '../canvas/store';
import { useViewpointStore } from './store';

interface ViewpointCreatorProps {
  className?: string;
  onViewpointCreated?: (viewpointId: string) => void;
}

/**
 * ViewpointCreator component
 */
export function ViewpointCreator({
  className = '',
  onViewpointCreated,
}: ViewpointCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const camera = useCanvasStore((state) => state.camera);
  const lodLevel = useCanvasStore((state) => state.lodLevel);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const createViewpoint = useViewpointStore((state) => state.createViewpoint);

  const handleCreate = () => {
    if (!name.trim()) {
      return;
    }

    const data = {
      name: name.trim(),
      cameraPosition: camera.position,
      cameraTarget: camera.target,
      filters: {
        lodLevel,
      },
      ...(description.trim() && { description: description.trim() }),
    };

    const viewpoint = createViewpoint(data);

    if (onViewpointCreated) {
      onViewpointCreated(viewpoint.id);
    }

    // Reset form
    setName('');
    setDescription('');
    setIsOpen(false);
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors ${className}`}
        title="Save current view as viewpoint"
      >
        <span className="flex items-center gap-2">
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
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          Save Viewpoint
        </span>
      </button>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Create Viewpoint
      </h3>

      <div className="space-y-4">
        {/* Name input */}
        <div>
          <label
            htmlFor="viewpoint-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name *
          </label>
          <input
            id="viewpoint-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Viewpoint"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        </div>

        {/* Description input */}
        <div>
          <label
            htmlFor="viewpoint-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="viewpoint-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Current state info */}
        <div className="bg-gray-50 rounded-md p-3 text-sm">
          <div className="font-medium text-gray-700 mb-2">
            Captured State:
          </div>
          <div className="space-y-1 text-gray-600">
            <div>
              Camera: ({camera.position.x.toFixed(1)}, {camera.position.y.toFixed(1)},{' '}
              {camera.position.z.toFixed(1)})
            </div>
            <div>LOD Level: {lodLevel}</div>
            {selectedNodeId && <div>Selected Node: {selectedNodeId}</div>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
          >
            Create
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
