/**
 * HeightEncodingSelector Component
 *
 * Dropdown for switching what building height represents in the city view.
 * Options: Method Count, Dependencies, Lines of Code, Complexity, Change Frequency.
 * Rendered inside the RightPanel alongside other layout controls.
 */

import { useCanvasStore } from '../store';
import type { HeightEncoding } from '../store';

interface EncodingOption {
  value: HeightEncoding;
  label: string;
  tooltip: string;
}

const ENCODING_OPTIONS: EncodingOption[] = [
  { value: 'methodCount', label: 'Method Count', tooltip: 'Height based on number of methods in a class' },
  { value: 'dependencies', label: 'Dependencies', tooltip: 'Height based on how many other nodes depend on this' },
  { value: 'loc', label: 'Lines of Code', tooltip: 'Height based on source file line count' },
  { value: 'complexity', label: 'Complexity', tooltip: 'Height based on cyclomatic complexity' },
  { value: 'churn', label: 'Change Frequency', tooltip: 'Height based on git change frequency (requires git data)' },
];

export function HeightEncodingSelector() {
  const heightEncoding = useCanvasStore((s) => s.citySettings.heightEncoding);
  const setHeightEncoding = useCanvasStore((s) => s.setHeightEncoding);
  const viewMode = useCanvasStore((s) => s.viewMode);

  // Only show in city view
  if (viewMode !== 'city') return null;

  return (
    <div className="space-y-1" data-testid="height-encoding-selector">
      <label
        htmlFor="height-encoding"
        className="text-gray-400 text-xs"
      >
        Building Height
      </label>
      <select
        id="height-encoding"
        value={heightEncoding}
        onChange={(e) => setHeightEncoding(e.target.value as HeightEncoding)}
        className="w-full px-2 py-1.5 rounded text-xs font-medium bg-gray-700 text-gray-200 border border-gray-600 focus:border-blue-500 focus:outline-none cursor-pointer"
        aria-label="Building height encoding"
      >
        {ENCODING_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} title={opt.tooltip}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
