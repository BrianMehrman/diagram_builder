/**
 * DensitySlider Component
 *
 * Panel control for adjusting radial layout density.
 * Density scales ring spacing — lower values pack buildings tighter,
 * higher values spread them out. Rendered inside the RightPanel.
 */

import { useCanvasStore } from '../store';

const MIN_DENSITY = 0.2;
const MAX_DENSITY = 5.0;
const STEP = 0.1;

export function DensitySlider() {
  const layoutDensity = useCanvasStore((s) => s.layoutDensity);
  const setLayoutDensity = useCanvasStore((s) => s.setLayoutDensity);
  const viewMode = useCanvasStore((s) => s.viewMode);

  // Only show in city view
  if (viewMode !== 'city') return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs">Dense</span>
        <span className="text-gray-300 text-xs font-mono">{layoutDensity.toFixed(1)}x</span>
        <span className="text-gray-400 text-xs">Spread</span>
      </div>
      <input
        type="range"
        min={MIN_DENSITY}
        max={MAX_DENSITY}
        step={STEP}
        value={layoutDensity}
        onChange={(e) => setLayoutDensity(parseFloat(e.target.value))}
        className="w-full h-1 accent-blue-500 cursor-pointer"
        data-testid="density-slider"
        aria-label="Layout density"
      />
    </div>
  );
}
