/**
 * NodeDetails Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { NodeDetails } from './NodeDetails'
import { useCanvasStore } from './store'
import type { IVMNode } from '../../shared/types'

const mockNodes: IVMNode[] = [
  {
    id: 'node-1',
    type: 'file',
    metadata: { label: 'app.ts', path: 'src/app.ts' },
    position: { x: 1, y: 2, z: 3 },
    lod: 0,
  },
  {
    id: 'node-2',
    type: 'class',
    metadata: { label: 'Application', path: 'src/Application.ts' },
    position: { x: 4, y: 5, z: 6 },
    lod: 1,
  },
]

describe('NodeDetails', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
  })

  it('renders nothing when no node is selected', () => {
    const { container } = render(<NodeDetails nodes={mockNodes} />)
    expect(container.firstChild).toBeNull()
  })

  it('displays selected node details', () => {
    useCanvasStore.getState().selectNode('node-1')

    render(<NodeDetails nodes={mockNodes} />)

    expect(screen.getAllByText('app.ts').length).toBeGreaterThan(0)
    expect(screen.getByText('file')).toBeDefined()
    expect(screen.getByText('node-1')).toBeDefined()
  })

  it('displays node position', () => {
    useCanvasStore.getState().selectNode('node-1')

    render(<NodeDetails nodes={mockNodes} />)

    expect(screen.getByText(/x: 1.00, y: 2.00, z: 3.00/)).toBeDefined()
  })

  it('displays node metadata', () => {
    useCanvasStore.getState().selectNode('node-1')

    render(<NodeDetails nodes={mockNodes} />)

    expect(screen.getByText('path:')).toBeDefined()
    expect(screen.getByText('src/app.ts')).toBeDefined()
  })

  it('displays LOD level', () => {
    useCanvasStore.getState().selectNode('node-2')

    render(<NodeDetails nodes={mockNodes} />)

    expect(screen.getByText('LOD Level')).toBeDefined()
    expect(screen.getByText('1')).toBeDefined()
  })

  it('deselects node when close button is clicked', () => {
    useCanvasStore.getState().selectNode('node-1')

    render(<NodeDetails nodes={mockNodes} />)

    const closeButton = screen.getByLabelText('Close')

    act(() => {
      closeButton.click()
    })

    expect(useCanvasStore.getState().selectedNodeId).toBeNull()
  })

  it('deselects node when deselect button is clicked', () => {
    useCanvasStore.getState().selectNode('node-1')

    render(<NodeDetails nodes={mockNodes} />)

    const deselectButton = screen.getByText('Deselect Node')

    act(() => {
      deselectButton.click()
    })

    expect(useCanvasStore.getState().selectedNodeId).toBeNull()
  })

  it('updates when selection changes', () => {
    useCanvasStore.getState().selectNode('node-1')

    const { rerender } = render(<NodeDetails nodes={mockNodes} />)

    expect(screen.getAllByText('app.ts').length).toBeGreaterThan(0)

    // Change selection
    act(() => {
      useCanvasStore.getState().selectNode('node-2')
    })
    rerender(<NodeDetails nodes={mockNodes} />)

    expect(screen.getAllByText('Application').length).toBeGreaterThan(0)
  })

  it('displays correct icon for each node type', () => {
    useCanvasStore.getState().selectNode('node-1')

    render(<NodeDetails nodes={mockNodes} />)

    // File icon
    expect(screen.getByText('📄')).toBeDefined()
  })
})
