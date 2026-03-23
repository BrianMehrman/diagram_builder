import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Basic3DNode } from './Basic3DNode'
import * as basicShapes from './basic3dShapes'
import { useCanvasStore } from '../../store'
import type { IVMNode } from '@diagram-builder/core'

// ---------------------------------------------------------------------------
// Mock R3F — render JSX children as plain elements so JSDOM can inspect them
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: { position: { x: 0, y: 5, z: 10 } },
    gl: {},
  })),
}))

vi.mock('three', () => ({
  default: {},
}))

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

// In JSDOM, R3F <group name="basic3d-node"> renders as an unknown HTML element.
// Query by the name attribute (valid Three.js Group property, no hyphens so
// R3F won't attempt nested property traversal in the real renderer).
function getGroupEl(container: HTMLElement): HTMLElement {
  const el = container.querySelector('[name="basic3d-node"]')
  if (!el) throw new Error('Could not find group[name="basic3d-node"] element')
  return el as HTMLElement
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Basic3DNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
  })

  it('renders a group element for the node', () => {
    const node = createNode('node-1', 'class')
    const { container } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
    )
    const el = getGroupEl(container)
    expect(el).toBeDefined()
    expect(el.getAttribute('name')).toBe('basic3d-node')
  })

  it('calls selectNode with node id on click', () => {
    const node = createNode('node-2', 'function')
    const { container } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
    )
    fireEvent.click(getGroupEl(container))
    expect(useCanvasStore.getState().selectedNodeId).toBe('node-2')
  })

  it('calls setHoveredNode(node.id) on pointer over', () => {
    const node = createNode('node-3', 'interface')
    const { container } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
    )
    fireEvent.pointerOver(getGroupEl(container))
    expect(useCanvasStore.getState().hoveredNodeId).toBe('node-3')
  })

  it('calls setHoveredNode(null) on pointer out', () => {
    const node = createNode('node-4', 'file')
    const { container } = render(
      <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
    )
    fireEvent.pointerOver(getGroupEl(container))
    expect(useCanvasStore.getState().hoveredNodeId).toBe('node-4')
    fireEvent.pointerOut(getGroupEl(container))
    expect(useCanvasStore.getState().hoveredNodeId).toBeNull()
  })

  it('calls isAbstractNode to determine wireframe for abstract class nodes', () => {
    const spy = vi.spyOn(basicShapes, 'isAbstractNode').mockReturnValue(true)
    const node = createNode('node-5', 'class', { isAbstract: true })
    render(<Basic3DNode node={node} position={defaultPosition} isSelected={false} />)
    expect(spy).toHaveBeenCalledWith(node)
  })

  it('renders without error when isSelected=true', () => {
    const node = createNode('node-6', 'class')
    expect(() =>
      render(<Basic3DNode node={node} position={defaultPosition} isSelected={true} />)
    ).not.toThrow()
  })
})
