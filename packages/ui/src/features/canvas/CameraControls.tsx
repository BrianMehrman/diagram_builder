/**
 * Camera Controls Component
 *
 * Additional camera control UI (reset, zoom presets, etc.)
 */

import { useCamera } from './hooks/useCamera';

interface CameraControlsProps {
  className?: string;
}

/**
 * Camera controls UI component
 */
export function CameraControls({ className = '' }: CameraControlsProps) {
  const camera = useCamera();

  const handleReset = () => {
    camera.reset();
  };

  const handleZoomIn = () => {
    camera.setZoom(Math.min(camera.zoom * 1.2, 5));
  };

  const handleZoomOut = () => {
    camera.setZoom(Math.max(camera.zoom * 0.8, 0.2));
  };

  const handleTopView = () => {
    camera.moveTo(
      { x: 0, y: 20, z: 0 },
      { x: 0, y: 0, z: 0 }
    );
  };

  const handleFrontView = () => {
    camera.moveTo(
      { x: 0, y: 5, z: 15 },
      { x: 0, y: 0, z: 0 }
    );
  };

  const handleSideView = () => {
    camera.moveTo(
      { x: 15, y: 5, z: 0 },
      { x: 0, y: 0, z: 0 }
    );
  };

  return (
    <div className={`absolute top-4 right-4 flex flex-col gap-2 ${className}`}>
      {/* Camera preset buttons */}
      <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
        <button
          onClick={handleTopView}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Top View"
        >
          Top
        </button>
        <button
          onClick={handleFrontView}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Front View"
        >
          Front
        </button>
        <button
          onClick={handleSideView}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Side View"
        >
          Side
        </button>
      </div>

      {/* Zoom controls */}
      <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Reset button */}
      <button
        onClick={handleReset}
        className="px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-lg transition-colors"
        title="Reset Camera"
      >
        Reset
      </button>
    </div>
  );
}
