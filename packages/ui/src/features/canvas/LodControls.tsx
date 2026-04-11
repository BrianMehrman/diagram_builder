/**
 * LOD Controls Component
 *
 * Panel control for Level of Detail. Supports two modes:
 * - Auto: camera distance drives LOD automatically
 * - Manual: user pins a specific LOD level
 *
 * Rendered inside the RightPanel Layout section.
 */

import { useCanvasStore } from './store'

const LOD_LEVELS = [
  { value: 1, label: 'City (clusters)' },
  { value: 2, label: 'Region (top containers)' },
  { value: 3, label: 'District (all containers)' },
  { value: 4, label: 'Block (structural nodes)' },
  { value: 5, label: 'Street (all nodes)' },
]

export function LodControls() {
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const setLodLevel = useCanvasStore((s) => s.setLodLevel)
  const lodManualOverride = useCanvasStore((s) => s.lodManualOverride)
  const setLodManualOverride = useCanvasStore((s) => s.setLodManualOverride)

  function handleToggleManual() {
    setLodManualOverride(!lodManualOverride)
  }

  function handleSelectLevel(value: number) {
    if (!lodManualOverride) setLodManualOverride(true)
    setLodLevel(value)
  }

  return (
    <div className="space-y-2">
      {/* Auto / Manual toggle */}
      <div className="flex items-center justify-between">
        <span className="text-gray-300 text-xs">
          {lodManualOverride ? `Level ${lodLevel}` : `Auto (${lodLevel})`}
        </span>
        <button
          onClick={handleToggleManual}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            lodManualOverride
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          aria-pressed={lodManualOverride}
          aria-label="Toggle manual LOD override"
        >
          {lodManualOverride ? 'Manual' : 'Auto'}
        </button>
      </div>

      {/* Level buttons — always visible, clicking auto-enables manual mode */}
      <div className="grid grid-cols-5 gap-1">
        {LOD_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => handleSelectLevel(level.value)}
            title={level.label}
            aria-label={`LOD ${level.value}: ${level.label}`}
            className={`py-1 text-xs font-mono rounded transition-colors ${
              lodLevel === level.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {level.value}
          </button>
        ))}
      </div>

      {/* Level label */}
      <p className="text-gray-500 text-xs">
        {LOD_LEVELS.find((l) => l.value === lodLevel)?.label ?? ''}
      </p>
    </div>
  )
}
