import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Basic3DNode } from './Basic3DNode'
import { useCanvasStore } from '../../store'
import type { IVMNode } from '@diagram-builder/core'

// ---------------------------------------------------------------------------
// Mock R3F — render JSX children as plain divs so JSDOM can inspect them
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: { position: { x: 0, y: 5, z: 10 } },
    gl: {},
  })),
}))

// Mock Three.js geometry and material as simple HTML elements
vi.mock('three', () => ({
  default: {},
}))

// Mock individual geometry/material components that R3F exposes as JSX
// R3F maps lowercase JSX to Three.js constructors. In JSDOM, they render as unknown elements.
// We mock them here so the test environment can find data attributes on the group.
vi.mock('./Basic3DNode', async () => {
  const actual = await vi.importActual<typeof import('./Basic3DNode')>('./Basic3DNode')
  return actual
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createNode(
  id: string,
  type: IVMNode['type'] = 'class',
  opts: { isAbstract?: boolean } = {}
): IVMNode {
  return {
    id,
    type,
    metadata: {
      label: id,
      path: `src/${id}.ts`,
      properties: {
        isAbstract: opts.isAbstract ?? false,
      },
    },
    lod: 3,
    position: { x: 0, y: 0, z: 0 },
  }
}

const defaultPosition = { x: 1, y: 2, z: 3 }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Basic3DNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
  })

  it('renders with data-testid="basic3d-node" and correct data-node-id', () => {
    const node = createNode('node-1', 'class')
    const { getByTestId } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
    )
    const el = getByTestId('basic3d-node')
    expect(el).toBeDefined()
    expect(el.getAttribute('data-node-id')).toBe('node-1')
  })

  it('calls selectNode with node id on click', () => {
    const node = createNode('node-2', 'function')
    const { getByTestId } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
    )
    const el = getByTestId('basic3d-node')
    fireEvent.click(el)
    expect(useCanvasStore.getState().selectedNodeId).toBe('node-2')
  })

  it('calls setHoveredNode(node.id) on pointer over', () => {
    const node = createNode('node-3', 'interface')
    const { getByTestId } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
    )
    const el = getByTestId('basic3d-node')
    fireEvent.pointerOver(el)
    expect(useCanvasStore.getState().hoveredNodeId).toBe('node-3')
  })

  it('calls setHoveredNode(null) on pointer out', () => {
    const node = createNode('node-4', 'file')
    const { getByTestId } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
    )
    const el = getByTestId('basic3d-node')
    fireEvent.pointerOver(el)
    expect(useCanvasStore.getState().hoveredNodeId).toBe('node-4')
    fireEvent.pointerOut(el)
    expect(useCanvasStore.getState().hoveredNodeId).toBeNull()
  })

  it('applies wireframe=true for abstract class nodes', () => {
    const node = createNode('node-5', 'class', { isAbstract: true })
    const { getByTestId } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
    )
    const el = getByTestId('basic3d-node')
    // The wireframe attribute is passed to the mesh material — verify via data attribute
    expect(el.getAttribute('data-wireframe')).toBe('true')
  })

  it('applies emissive highlight when isSelected=true', () => {
    const node = createNode('node-6', 'class')
    const { getByTestId } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={true} />
    )
    const el = getByTestId('basic3d-node')
    expect(el.getAttribute('data-selected')).toBe('true')
  })
})
