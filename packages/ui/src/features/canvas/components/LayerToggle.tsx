/**
 * LayerToggle Component
 *
 * Two toggle buttons for controlling above-ground and underground layer visibility.
 * Rendered inside the RightPanel alongside the DensitySlider.
 */

import { useCanvasStore } from '../store';

export function LayerToggle() {
  const visibleLayers = useCanvasStore((s) => s.visibleLayers);
  const toggleLayer = useCanvasStore((s) => s.toggleLayer);
  const viewMode = useCanvasStore((s) => s.viewMode);

  // Only show in city view
  if (viewMode !== 'city') return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => toggleLayer('aboveGround')}
        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
          visibleLayers.aboveGround
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-400'
        }`}
        aria-label="Toggle above ground layer"
        aria-pressed={visibleLayers.aboveGround}
      >
        Above Ground
      </button>
      <button
        onClick={() => toggleLayer('underground')}
        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
          visibleLayers.underground
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-400'
        }`}
        aria-label="Toggle underground layer"
        aria-pressed={visibleLayers.underground}
      >
        Underground
      </button>
    </div>
  );
}
