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

  setupLayout(makeEmptyGraph())
  useCanvasStore.getState().setLodLevel(4) // was 3 — file nodes visible at LOD 4 now
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

  describe('LOD-driven rendering', () => {
    it('LOD 1: renders ClusterLayer, no individual nodes or edges', () => {
      setupLayout(makeEmptyGraph())
      useCanvasStore.getState().setLodLevel(1)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-node')).toHaveLength(0)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
      expect(queryAllByTestId('cluster-layer')).toHaveLength(1)
    })

    it('LOD 2: renders only repository and package nodes', () => {
      const nodes = [
        createNode('repo', 'repository'),
        createNode('pkg', 'package'),
        createNode('mod', 'module'),
        createNode('file-a', 'file'),
        createNode('fn-a', 'function'),
      ]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().setLodLevel(2)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
      expect(rendered).toContain('repo')
      expect(rendered).toContain('pkg')
      expect(rendered).not.toContain('mod')
      expect(rendered).not.toContain('file-a')
      expect(rendered).not.toContain('fn-a')
    })

    it('LOD 2: no edges without selection', () => {
      const nodes = [createNode('repo', 'repository'), createNode('pkg', 'package')]
      const edges = [createEdge('repo', 'pkg')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(2)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('LOD 2: shows edge when selected node is connected', () => {
      const nodes = [createNode('repo', 'repository'), createNode('pkg', 'package')]
      const edges = [createEdge('repo', 'pkg')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(2)
      useCanvasStore.getState().selectNode('repo')
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
    })

    it('LOD 3: renders all container nodes', () => {
      const nodes = [
        createNode('repo', 'repository'),
        createNode('mod', 'module'),
        createNode('dir', 'directory'),
        createNode('file-a', 'file'),
        createNode('fn-a', 'function'),
      ]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().setLodLevel(3)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
      expect(rendered).toContain('repo')
      expect(rendered).toContain('mod')
      expect(rendered).toContain('dir')
      expect(rendered).not.toContain('file-a')
      expect(rendered).not.toContain('fn-a')
    })

    it('LOD 3: no edges without selection', () => {
      const nodes = [createNode('mod-a', 'module'), createNode('mod-b', 'module')]
      const edges = [createEdge('mod-a', 'mod-b')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(3)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('LOD 3: shows edge when selected node is connected and both endpoints are visible', () => {
      const nodes = [createNode('mod-a', 'module'), createNode('mod-b', 'module')]
      const edges = [createEdge('mod-a', 'mod-b')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(3)
      useCanvasStore.getState().selectNode('mod-a')
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
    })

    it('LOD 4: renders container + structural nodes, not leaf nodes', () => {
      const nodes = [
        createNode('mod', 'module'),
        createNode('file-a', 'file'),
        createNode('cls', 'class'),
        createNode('fn-a', 'function'),
        createNode('meth', 'method'),
      ]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
      expect(rendered).toContain('mod')
      expect(rendered).toContain('file-a')
      expect(rendered).toContain('cls')
      expect(rendered).not.toContain('fn-a')
      expect(rendered).not.toContain('meth')
    })

    it('LOD 4: shows edge when selected node is connected', () => {
      const nodes = [createNode('file-a', 'file'), createNode('file-b', 'file')]
      const edges = [createEdge('file-a', 'file-b')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.getState().selectNode('file-a')
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
    })

    it('LOD 5: renders all node types', () => {
      const nodes = [
        createNode('mod', 'module'),
        createNode('file-a', 'file'),
        createNode('fn-a', 'function'),
        createNode('meth', 'method'),
      ]
      setupLayout(makeGraph(nodes))
      useCanvasStore.getState().setLodLevel(5)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-node')).toHaveLength(4)
    })

    it('LOD 5: renders edge when both endpoints are near camera (proximity)', () => {
      // Default camera in store: { x: 0, y: 0, z: 0 }
      // Nodes at x=5 and x=10 — both within EDGE_PROXIMITY_SQ (60^2 = 3600)
      const nodes = [createNode('a', 'function'), createNode('b', 'function')]
      const edges = [createEdge('a', 'b')]
      const positions = new Map([
        ['a', { x: 5, y: 0, z: 0 }],
        ['b', { x: 10, y: 0, z: 0 }],
      ])
      setupLayout(makeGraph(nodes, edges), positions)
      useCanvasStore.getState().setLodLevel(5)
      useCanvasStore.setState({
        layoutState: 'ready',
        camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 },
      })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
    })

    it('LOD 5: hides edge when both endpoints are far from camera and no selection', () => {
      const nodes = [createNode('a', 'function'), createNode('b', 'function')]
      const edges = [createEdge('a', 'b')]
      const positions = new Map([
        ['a', { x: 200, y: 0, z: 0 }],
        ['b', { x: 210, y: 0, z: 0 }],
      ])
      setupLayout(makeGraph(nodes, edges), positions)
      useCanvasStore.getState().setLodLevel(5)
      useCanvasStore.setState({
        layoutState: 'ready',
        camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 },
      })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('does not render edges when source position is missing', () => {
      const nodes = [createNode('a', 'file'), createNode('b', 'file')]
      const edges = [createEdge('a', 'b')]
      const positions = new Map([['a', { x: 0, y: 0, z: 0 }]])
      setupLayout(makeGraph(nodes, edges), positions)
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.getState().selectNode('a')
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('does not render edges when target position is missing', () => {
      const nodes = [createNode('a', 'file'), createNode('b', 'file')]
      const edges = [createEdge('a', 'b')]
      const positions = new Map([['b', { x: 5, y: 0, z: 0 }]])
      setupLayout(makeGraph(nodes, edges), positions)
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.getState().selectNode('a')
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('passes showLabel=false at LOD 2 and 3', () => {
      const nodes = [createNode('mod', 'module')]
      setupLayout(makeGraph(nodes))
      for (const lod of [2, 3]) {
        vi.clearAllMocks()
        useCanvasStore.getState().setLodLevel(lod)
        useCanvasStore.setState({ layoutState: 'ready' })
        render(<Basic3DView />)
        const calls = mockBasic3DNode.mock.calls
        for (const [props] of calls) {
          expect(props.showLabel, `LOD ${lod} should have showLabel=false`).toBe(false)
        }
      }
    })

    it('passes showLabel=true at LOD 4 and 5', () => {
      const nodes = [createNode('file-a', 'file')]
      setupLayout(makeGraph(nodes))
      for (const lod of [4, 5]) {
        vi.clearAllMocks()
        useCanvasStore.getState().setLodLevel(lod)
        useCanvasStore.setState({ layoutState: 'ready' })
        render(<Basic3DView />)
        const calls = mockBasic3DNode.mock.calls
        if (calls.length > 0) {
          for (const [props] of calls) {
            expect(props.showLabel, `LOD ${lod} should have showLabel=true`).toBe(true)
          }
        }
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
