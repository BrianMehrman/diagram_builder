/**
 * FocusToggleButton
 *
 * Appears when a node is selected and toggles the radial connection overlay on/off.
 * Renders "Show Map" when the overlay is hidden, "Close Map" when it is visible.
 */

import { useCanvasStore } from '../store'

export function FocusToggleButton() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const showRadialOverlay = useCanvasStore((s) => s.showRadialOverlay)
  const toggleRadialOverlay = useCanvasStore((s) => s.toggleRadialOverlay)

  if (!selectedNodeId) return null

  return (
    <button
      onClick={toggleRadialOverlay}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 100,
        padding: '8px 16px',
        background: showRadialOverlay ? '#374151' : '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
      }}
    >
      {showRadialOverlay ? 'Close Map' : 'Show Map'}
    </button>
  )
}
