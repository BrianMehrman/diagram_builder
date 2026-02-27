/**
 * RadialOverlay Tests
 *
 * Tests the full-canvas SVG overlay that shows the connection map
 * when showRadialOverlay is true.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RadialOverlay } from './RadialOverlay'
import { useCanvasStore } from '../store'
import type { Graph } from '../../../shared/types'

const graph: Graph = {
  nodes: [
    { id: 'A', type: 'file', label: 'src/A.ts', metadata: {}, lod: 1, depth: 1, isExternal: false },
    { id: 'B', type: 'file', label: 'src/B.ts', metadata: {}, lod: 1, depth: 1, isExternal: false },
    { id: 'C', type: 'file', label: 'src/C.ts', metadata: {}, lod: 1, depth: 1, isExternal: false },
  ],
  edges: [
    { id: 'A-imports-B', source: 'A', target: 'B', type: 'imports', metadata: {} },
    { id: 'B-calls-C', source: 'B', target: 'C', type: 'calls', metadata: {} },
  ],
  metadata: { repositoryId: 'test', name: 'test', totalNodes: 3, totalEdges: 2 },
}

beforeEach(() => {
  useCanvasStore.getState().reset()
})

describe('RadialOverlay', () => {
  it('renders nothing when overlay is not shown', () => {
    useCanvasStore.getState().selectNode('A')
    const { container } = render(<RadialOverlay graph={graph} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when no node is selected', () => {
    useCanvasStore.getState().toggleRadialOverlay()
    const { container } = render(<RadialOverlay graph={graph} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders SVG when overlay is shown and node is selected', () => {
    useCanvasStore.getState().selectNode('A')
    useCanvasStore.getState().toggleRadialOverlay()
    render(<RadialOverlay graph={graph} />)
    expect(document.querySelector('svg')).toBeTruthy()
  })

  it('shows the selected node short label in the center', () => {
    useCanvasStore.getState().selectNode('A')
    useCanvasStore.getState().toggleRadialOverlay()
    render(<RadialOverlay graph={graph} />)
    expect(screen.getByText('A.ts')).toBeTruthy()
  })

  it('shows direct connection node label', () => {
    useCanvasStore.getState().selectNode('A')
    useCanvasStore.getState().toggleRadialOverlay()
    render(<RadialOverlay graph={graph} />)
    expect(screen.getByText('B.ts')).toBeTruthy()
  })
})
