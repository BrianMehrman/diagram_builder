/**
 * EdgeTierControls Component
 *
 * Toggle switches for edge tier visibility (cross-district, inheritance)
 * and a prominent transit map mode button.
 * Only rendered in city view mode.
 */

import { useCanvasStore } from '../store';
import type { EdgeTierKey } from '../store';

interface EdgeTierOption {
  key: EdgeTierKey;
  label: string;
  description: string;
}

const EDGE_TIER_OPTIONS: EdgeTierOption[] = [
  { key: 'crossDistrict', label: 'Cross-District', description: 'Show import edges between districts' },
  { key: 'inheritance', label: 'Inheritance', description: 'Show inheritance and implementation edges' },
];

export function EdgeTierControls() {
  const edgeTiers = useCanvasStore((s) => s.citySettings.edgeTierVisibility);
  const toggleTier = useCanvasStore((s) => s.toggleEdgeTierVisibility);
  const transitMapMode = useCanvasStore((s) => s.citySettings.transitMapMode);
  const toggleTransit = useCanvasStore((s) => s.toggleTransitMapMode);
  const viewMode = useCanvasStore((s) => s.viewMode);

  // Only show in city view
  if (viewMode !== 'city') return null;

  return (
    <div className="space-y-2" data-testid="edge-tier-controls">
      {/* Edge tier checkboxes */}
      <div className="space-y-1.5">
        <span className="text-gray-400 text-xs">Edge Visibility</span>
        {EDGE_TIER_OPTIONS.map((opt) => (
          <label
            key={opt.key}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 cursor-pointer"
            title={opt.description}
          >
            <input
              type="checkbox"
              checked={edgeTiers[opt.key]}
              onChange={() => toggleTier(opt.key)}
              className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              data-testid={`edge-tier-toggle-${opt.key}`}
              aria-label={`Toggle ${opt.label.toLowerCase()} edges`}
            />
            <span className="text-xs text-gray-200">{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Transit map mode button */}
      <button
        onClick={toggleTransit}
        className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
          transitMapMode
            ? 'bg-blue-600 text-white ring-1 ring-blue-400'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        data-testid="transit-map-toggle"
        aria-label="Toggle transit map mode"
        aria-pressed={transitMapMode}
        title="Transit map mode: dims buildings and emphasizes connection lines"
      >
        {transitMapMode ? 'Transit Map ON' : 'Transit Map'}
      </button>
    </div>
  );
}
