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
import type { IVMGraph } from '../../../shared/types'

const graph: IVMGraph = {
  nodes: [
    {
      id: 'A',
      type: 'file',
      metadata: {
        label: 'src/A.ts',
        path: 'src/A.ts',
        properties: { depth: 1, isExternal: false },
      },
      lod: 1,
      position: { x: 0, y: 0, z: 0 },
    },
    {
      id: 'B',
      type: 'file',
      metadata: {
        label: 'src/B.ts',
        path: 'src/B.ts',
        properties: { depth: 1, isExternal: false },
      },
      lod: 1,
      position: { x: 0, y: 0, z: 0 },
    },
    {
      id: 'C',
      type: 'file',
      metadata: {
        label: 'src/C.ts',
        path: 'src/C.ts',
        properties: { depth: 1, isExternal: false },
      },
      lod: 1,
      position: { x: 0, y: 0, z: 0 },
    },
  ],
  edges: [
    { id: 'A-imports-B', source: 'A', target: 'B', type: 'imports', metadata: {}, lod: 0 },
    { id: 'B-calls-C', source: 'B', target: 'C', type: 'calls', metadata: {}, lod: 0 },
  ],
  metadata: {
    name: 'test',
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    rootPath: 'src/',
    stats: { totalNodes: 3, totalEdges: 2, nodesByType: {} as never, edgesByType: {} as never },
    languages: [],
  },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
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
