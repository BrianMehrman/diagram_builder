/**
 * useFocusEscape Hook
 *
 * Listens for the Escape key and clears connection focus mode:
 * clears selectedNodeId and closes the radial overlay.
 */
import { useEffect } from 'react'
import { useCanvasStore } from '../store'

export function useFocusEscape(): void {
  const selectNode = useCanvasStore((s) => s.selectNode)
  const showRadialOverlay = useCanvasStore((s) => s.showRadialOverlay)
  const toggleRadialOverlay = useCanvasStore((s) => s.toggleRadialOverlay)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        selectNode(null)
        if (showRadialOverlay) toggleRadialOverlay()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectNode, showRadialOverlay, toggleRadialOverlay])
}
