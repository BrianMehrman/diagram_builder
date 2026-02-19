/**
 * LayerToggle Component
 *
 * Two toggle buttons for controlling above-ground and underground layer visibility.
 * Rendered inside the RightPanel alongside the DensitySlider.
 *
 * In v2 city mode, the underground toggle uses citySettings.undergroundVisible
 * and an additional "External Deps" sub-toggle appears.
 */

import { useCanvasStore } from '../store';
import { WIRE_COLORS } from '../views/cityViewUtils';

export function LayerToggle() {
  const visibleLayers = useCanvasStore((s) => s.visibleLayers);
  const toggleLayer = useCanvasStore((s) => s.toggleLayer);
  const viewMode = useCanvasStore((s) => s.viewMode);
  const cityVersion = useCanvasStore((s) => s.citySettings.cityVersion);
  const undergroundVisible = useCanvasStore((s) => s.citySettings.undergroundVisible);
  const externalPipesVisible = useCanvasStore((s) => s.citySettings.externalPipesVisible);
  const toggleUndergroundVisible = useCanvasStore((s) => s.toggleUndergroundVisible);
  const toggleExternalPipes = useCanvasStore((s) => s.toggleExternalPipes);

  // Only show in city view
  if (viewMode !== 'city') return null;

  const isV2 = cityVersion === 'v2';

  return (
    <div className="flex flex-col gap-2">
      {/* Above-ground layer toggle (both v1 and v2) */}
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

      {/* Underground toggle: v1 uses visibleLayers, v2 uses citySettings */}
      {isV2 ? (
        <div className="flex flex-col gap-1">
          <button
            onClick={toggleUndergroundVisible}
            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              undergroundVisible
                ? 'bg-amber-600 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
            aria-label="Toggle underground pipe layer"
            aria-pressed={undergroundVisible}
          >
            Underground
          </button>

          {/* External deps sub-toggle — only active when underground is on */}
          <button
            onClick={toggleExternalPipes}
            disabled={!undergroundVisible}
            className={`px-2 py-1 rounded text-xs transition-colors ml-2 ${
              !undergroundVisible
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : externalPipesVisible
                ? 'bg-amber-500 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
            aria-label="Toggle external dependency pipes"
            aria-pressed={externalPipesVisible}
            aria-disabled={!undergroundVisible}
          >
            ↳ External Deps
          </button>
        </div>
      ) : (
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
      )}
      {/* Overhead wire legend — v2 only (Story 11-13) */}
      {isV2 && (
        <div className="mt-2 border-t border-gray-700 pt-2">
          <p className="text-xs text-gray-500 mb-1">Overhead Wires</p>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span style={{ color: WIRE_COLORS['calls'] }} aria-hidden="true">—</span>
              <span>Calls</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span style={{ color: WIRE_COLORS['composes'] }} aria-hidden="true">- -</span>
              <span>Composes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
