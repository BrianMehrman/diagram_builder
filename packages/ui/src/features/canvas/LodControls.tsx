/**
 * LOD Controls Component
 *
 * UI controls for adjusting Level of Detail
 */

import { useCanvasStore } from './store';

interface LodControlsProps {
  className?: string;
}

/**
 * LOD controls UI component
 */
export function LodControls({ className = '' }: LodControlsProps) {
  const lodLevel = useCanvasStore((state) => state.lodLevel);
  const setLodLevel = useCanvasStore((state) => state.setLodLevel);

  const lodLevels = [
    { value: 0, label: 'Files Only' },
    { value: 1, label: 'Files + Classes' },
    { value: 2, label: '+ Functions' },
    { value: 3, label: '+ Methods' },
    { value: 4, label: 'All Details' },
  ];

  return (
    <div className={`absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Level of Detail</h3>

      <div className="flex flex-col gap-2">
        {lodLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => setLodLevel(level.value)}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors text-left ${
              lodLevel === level.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {level.label}
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Current Level: {lodLevel}
        </div>
      </div>
    </div>
  );
}
