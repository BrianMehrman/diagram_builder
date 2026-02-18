/**
 * AtmosphereTogglePanel Component
 *
 * Checkbox group for toggling individual atmospheric indicators on/off.
 * Each checkbox maps to a key in `citySettings.atmosphereOverlays`.
 * Only rendered in city view mode.
 */

import { useCanvasStore } from '../store';
import type { AtmosphereOverlayKey } from '../store';

interface OverlayOption {
  key: AtmosphereOverlayKey;
  label: string;
  description: string;
}

const OVERLAY_OPTIONS: OverlayOption[] = [
  { key: 'cranes', label: 'Cranes', description: 'Construction cranes on high-churn buildings' },
  { key: 'lighting', label: 'Lighting', description: 'Test coverage lighting (bright = tested)' },
  { key: 'smog', label: 'Smog', description: 'Complexity smog over high-complexity districts' },
  { key: 'deprecated', label: 'Deprecated', description: 'Striped overlay on deprecated code' },
];

export function AtmosphereTogglePanel() {
  const overlays = useCanvasStore((s) => s.citySettings.atmosphereOverlays);
  const toggle = useCanvasStore((s) => s.toggleAtmosphereOverlay);
  const viewMode = useCanvasStore((s) => s.viewMode);

  // Only show in city view
  if (viewMode !== 'city') return null;

  return (
    <div className="space-y-1.5" data-testid="atmosphere-toggle-panel">
      <span className="text-gray-400 text-xs">Atmosphere Indicators</span>
      {OVERLAY_OPTIONS.map((opt) => (
        <label
          key={opt.key}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 cursor-pointer"
          title={opt.description}
        >
          <input
            type="checkbox"
            checked={overlays[opt.key]}
            onChange={() => toggle(opt.key)}
            className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
            data-testid={`atmosphere-toggle-${opt.key}`}
            aria-label={`Toggle ${opt.label.toLowerCase()} indicator`}
          />
          <span className="text-xs text-gray-200">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
