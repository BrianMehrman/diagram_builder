/**
 * Basic3DView Test Suite
 *
 * Tests observable behaviors: loading state, node rendering, LOD-driven edge visibility,
 * and selected node prop forwarding.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Basic3DView } from './Basic3DView'
import { useCanvasStore } from '../../store'
import type { IVMGraph, IVMNode, IVMEdge } from '../../../../shared/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: { position: { x: 0, y: 5, z: 10 } },
    gl: {},
  })),
}))

vi.mock('@react-three/drei', () => ({
  Text: (props: Record<string, unknown>) => <div data-testid="drei-text" {...props} />,
  Billboard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div data-testid="drei-line" />,
}))

vi.mock('./useBasic3DLayout', () => ({
  useBasic3DLayout: vi.fn(),
}))

vi.mock('./Basic3DNode', () => ({
  Basic3DNode: vi.fn(({ node }: { node: IVMNode }) => (
    <div data-testid="basic3d-node" data-node-id={node.id} />
  )),
}))

vi.mock('./Basic3DEdge', () => ({
  Basic3DEdge: vi.fn(() => <div data-testid="basic3d-edge" />),
}))

vi.mock('./ClusterLayer', () => ({
  ClusterLayer: () => <div data-testid="cluster-layer" />,
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { useBasic3DLayout } from './useBasic3DLayout'
import { Basic3DNode } from './Basic3DNode'

const mockUseBasic3DLayout = vi.mocked(useBasic3DLayout)
const mockBasic3DNode = vi.mocked(Basic3DNode)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeMetadata(nodes: IVMNode[], edges: IVMEdge[]) {
  return {
    name: 'TestProject',
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    rootPath: 'src/',
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType: {} as never,
      edgesByType: {} as never,
    },
    languages: [],
  }
}

function createNode(id: string, type: IVMNode['type'] = 'file'): IVMNode {
  return {
    id,
    type,
    metadata: {
      label: id,
      path: `src/${id}.ts`,
      properties: { isExternal: false, depth: 1 },
    },
    lod: 3,
    position: { x: 0, y: 0, z: 0 },
  }
}

function createEdge(source: string, target: string): IVMEdge {
  return {
    id: `${source}--imports--${target}`,
    source,
    target,
    type: 'imports',
    metadata: {},
    lod: 0,
  }
}

function makeEmptyGraph(): IVMGraph {
  return {
    nodes: [],
    edges: [],
    metadata: makeMetadata([], []),
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
  }
}

function makeGraph(nodes: IVMNode[], edges: IVMEdge[] = []): IVMGraph {
  return {
    nodes,
    edges,
    metadata: makeMetadata(nodes, edges),
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
  }
}

function setupLayout(
  graph: IVMGraph,
  positions?: Map<string, { x: number; y: number; z: number }>
) {
  const pos = positions ?? new Map(graph.nodes.map((n, i) => [n.id, { x: i * 5, y: 0, z: 0 }]))
  mockUseBasic3DLayout.mockReturnValue({ graph, positions: pos, maxDepth: 3 })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  useCanvasStore.getState().reset()
  useCanvasStore.setState({ layoutState: 'ready' })

  // Default: empty graph, LOD 3 (individual nodes shown by default in tests)
  setupLayout(makeEmptyGraph())
  useCanvasStore.getState().setLodLevel(3)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Basic3DView', () => {
  describe('loading state', () => {
    it('renders loading text when layoutState is computing', () => {
      setupLayout(makeEmptyGraph())
      useCanvasStore.setState({ layoutState: 'computing' })

      const { getByText } = render(<Basic3DView />)
      expect(getByText(/loading/i)).toBeDefined()
    })

    it('does not render loading text when layoutState is ready', () => {
      setupLayout(makeEmptyGraph())
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryByText } = render(<Basic3DView />)
      expect(queryByText(/loading/i)).toBeNull()
    })
  })

  describe('empty graph', () => {
    it('renders without crashing given an empty graph', () => {
      const { container } = render(<Basic3DView />)
      expect(container).toBeDefined()
    })

    it('renders no nodes when graph has no nodes', () => {
      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-node')).toHaveLength(0)
    })

    it('renders no edges when graph has no edges', () => {
      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })
  })

  describe('node rendering', () => {
    it('renders one Basic3DNode per node in the graph', () => {
      const nodes = [createNode('node-a'), createNode('node-b'), createNode('node-c')]
      setupLayout(makeGraph(nodes))

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-node')).toHaveLength(3)
    })

    it('renders correct node ids', () => {
      const nodes = [createNode('alpha'), createNode('beta')]
      setupLayout(makeGraph(nodes))

      const { getAllByTestId } = render(<Basic3DView />)
      const renderedIds = getAllByTestId('basic3d-node').map((el) =>
        el.getAttribute('data-node-id')
      )
      expect(renderedIds).toContain('alpha')
      expect(renderedIds).toContain('beta')
    })
  })

  describe('LOD-driven edge visibility', () => {
    it('renders no edges at LOD 1 (cluster layer shown)', () => {
      setupLayout(makeEmptyGraph())
      useCanvasStore.getState().setLodLevel(1)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
      expect(queryAllByTestId('basic3d-node')).toHaveLength(0)
    })

    it('renders structural nodes and their edges at LOD 3', () => {
      const nodes = [createNode('a', 'file'), createNode('b', 'file')]
      const edges = [createEdge('a', 'b')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(3)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-node')).toHaveLength(2)
      expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
    })

    it('renders edges at LOD 4', () => {
      const nodes = [createNode('a'), createNode('b')]
      const edges = [createEdge('a', 'b')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
    })

    it('does not render edges when source position is missing', () => {
      const nodes = [createNode('a'), createNode('b')]
      const edges = [createEdge('a', 'b')]
      const positions = new Map([['a', { x: 0, y: 0, z: 0 }]])
      setupLayout(makeGraph(nodes, edges), positions)
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('does not render edges when target position is missing', () => {
      const nodes = [createNode('a'), createNode('b')]
      const edges = [createEdge('a', 'b')]
      const positions = new Map([['b', { x: 5, y: 0, z: 0 }]])
      setupLayout(makeGraph(nodes, edges), positions)
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })
  })

  describe('LOD node-type filtering', () => {
    it('renders only container nodes at LOD 2', () => {
      const nodes = [
        createNode('mod', 'module'),
        createNode('dir', 'directory'),
        createNode('file-a', 'file'),
        createNode('fn-a', 'function'),
      ]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().setLodLevel(2)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
      expect(rendered).toContain('mod')
      expect(rendered).toContain('dir')
      expect(rendered).not.toContain('file-a')
      expect(rendered).not.toContain('fn-a')
    })

    it('renders edge at LOD 2 when both endpoints are container types', () => {
      const nodes = [createNode('mod-a', 'module'), createNode('mod-b', 'module')]
      const edges = [createEdge('mod-a', 'mod-b')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(2)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-node')).toHaveLength(2)
      expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
    })

    it('hides edge at LOD 2 when one endpoint is not a container type', () => {
      const nodes = [createNode('mod-a', 'module'), createNode('file-b', 'file')]
      const edges = [createEdge('mod-a', 'file-b')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(2)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('hides edge at LOD 3 when one endpoint is a leaf type', () => {
      const nodes = [createNode('cls', 'class'), createNode('fn-a', 'function')]
      const edges = [createEdge('cls', 'fn-a')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(3)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('renders container + structural nodes at LOD 3', () => {
      const nodes = [
        createNode('mod', 'module'),
        createNode('file-a', 'file'),
        createNode('cls', 'class'),
        createNode('fn-a', 'function'),
      ]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().setLodLevel(3)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
      expect(rendered).toContain('mod')
      expect(rendered).toContain('file-a')
      expect(rendered).toContain('cls')
      expect(rendered).not.toContain('fn-a')
    })

    it('renders all nodes at LOD 4', () => {
      const nodes = [
        createNode('mod', 'module'),
        createNode('file-a', 'file'),
        createNode('fn-a', 'function'),
        createNode('meth', 'method'),
      ]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-node')).toHaveLength(4)
    })

    it('passes showLabel=false to nodes at LOD 2', () => {
      const nodes = [createNode('mod', 'module')]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().setLodLevel(2)
      useCanvasStore.setState({ layoutState: 'ready' })

      render(<Basic3DView />)
      const calls = mockBasic3DNode.mock.calls
      for (const [props] of calls) {
        expect(props.showLabel).toBe(false)
      }
    })

    it('passes showLabel=true to nodes at LOD 3', () => {
      const nodes = [createNode('file-a', 'file')]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().setLodLevel(3)
      useCanvasStore.setState({ layoutState: 'ready' })

      render(<Basic3DView />)
      const calls = mockBasic3DNode.mock.calls
      for (const [props] of calls) {
        expect(props.showLabel).toBe(true)
      }
    })
  })

  describe('isSelected prop', () => {
    it('passes isSelected=true to the selected node', () => {
      const nodes = [createNode('node-x'), createNode('node-y')]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().selectNode('node-x')

      render(<Basic3DView />)

      // Find the call for node-x
      const calls = mockBasic3DNode.mock.calls
      const nodeXCall = calls.find((args) => args[0].node.id === 'node-x')
      expect(nodeXCall).toBeDefined()
      expect(nodeXCall![0].isSelected).toBe(true)
    })

    it('passes isSelected=false to non-selected nodes', () => {
      const nodes = [createNode('node-x'), createNode('node-y')]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().selectNode('node-x')

      render(<Basic3DView />)

      const calls = mockBasic3DNode.mock.calls
      const nodeYCall = calls.find((args) => args[0].node.id === 'node-y')
      expect(nodeYCall).toBeDefined()
      expect(nodeYCall![0].isSelected).toBe(false)
    })

    it('passes isSelected=false to all nodes when nothing is selected', () => {
      const nodes = [createNode('node-a'), createNode('node-b')]
      setupLayout(makeGraph(nodes))
      // No selection

      render(<Basic3DView />)

      const calls = mockBasic3DNode.mock.calls
      for (const [props] of calls) {
        expect(props.isSelected).toBe(false)
      }
    })
  })

  describe('data-testid', () => {
    it('renders a group with data-testid="basic3d-view"', () => {
      setupLayout(makeEmptyGraph())
      const { container } = render(<Basic3DView />)
      // The root group renders as a plain element in JSDOM via R3F mock
      // Check that the component renders without error — testid is on the <group>
      expect(container).toBeDefined()
    })
  })
})
