/**
 * FileTreeView Tests
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { act } from 'react'
import { FileTreeView } from './FileTreeView'
import type { IVMNode } from '../../shared/types'

const mockNodes: IVMNode[] = [
  {
    id: 'file-1',
    type: 'file',
    metadata: { label: 'app.ts', path: 'src/app.ts' },
    position: { x: 0, y: 0, z: 0 },
    lod: 0,
  },
  {
    id: 'class-1',
    type: 'class',
    metadata: { label: 'Application', path: 'src/Application.ts' },
    position: { x: 1, y: 1, z: 1 },
    lod: 1,
    parentId: 'file-1',
  },
  {
    id: 'method-1',
    type: 'method',
    metadata: { label: 'start', path: 'src/Application.ts' },
    position: { x: 2, y: 2, z: 2 },
    lod: 3,
    parentId: 'class-1',
  },
]

describe('FileTreeView', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders file nodes', () => {
    render(<FileTreeView nodes={mockNodes} />)

    expect(screen.getByText('app.ts')).toBeDefined()
  })

  it('renders class nodes', () => {
    render(<FileTreeView nodes={mockNodes} />)

    expect(screen.getByText('Application')).toBeDefined()
  })

  it('renders method nodes', () => {
    render(<FileTreeView nodes={mockNodes} />)

    expect(screen.getByText('start')).toBeDefined()
  })

  it('calls onNodeClick when node is clicked', () => {
    const onNodeClick = vi.fn()

    render(<FileTreeView nodes={mockNodes} onNodeClick={onNodeClick} />)

    const fileNode = screen.getByText('app.ts')

    act(() => {
      fileNode.click()
    })

    expect(onNodeClick).toHaveBeenCalledWith('file-1')
  })

  it('highlights selected node', () => {
    render(<FileTreeView nodes={mockNodes} selectedNodeId="class-1" />)

    const classNode = screen.getByText('Application')
    expect(classNode.parentElement?.className).toContain('bg-primary-100')
  })

  it('displays empty state when no nodes', () => {
    render(<FileTreeView nodes={[]} />)

    expect(screen.getByText('No files to display')).toBeDefined()
  })

  it('displays node icons', () => {
    render(<FileTreeView nodes={mockNodes} />)

    // File icon
    expect(screen.getByText('📄')).toBeDefined()
    // Class icon
    expect(screen.getByText('🏛️')).toBeDefined()
    // Method icon
    expect(screen.getByText('🔧')).toBeDefined()
  })
})
