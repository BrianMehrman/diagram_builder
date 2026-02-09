/**
 * DependencyLegend Component
 *
 * Shows a color-coded legend for dependency tunnel types
 * when underground mode is active. Positioned as an HTML overlay.
 */

import { useCanvasStore } from '../store';
import { LEGEND_ITEMS } from '../tunnelEnhancedUtils';

export function DependencyLegend() {
  const isUndergroundMode = useCanvasStore((s) => s.isUndergroundMode);

  if (!isUndergroundMode) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-gray-900/90 rounded-lg p-3 text-sm pointer-events-none">
      <div className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
        Dependencies
      </div>

      {LEGEND_ITEMS.map((item) => (
        <div key={item.type} className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-300">{item.label}</span>
        </div>
      ))}

      <div className="mt-2 pt-2 border-t border-gray-700 text-gray-500 text-xs">
        Thickness = import frequency
      </div>
    </div>
  );
}
