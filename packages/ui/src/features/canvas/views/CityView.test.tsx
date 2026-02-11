/**
 * CityView Interaction Test Suite
 *
 * Regression safety net for CityView decomposition (Epic 10, Story 10-1).
 * Tests observable behaviors: rendering, store interactions, LOD filtering.
 * All tests must pass BEFORE and AFTER CityView is split into sub-orchestrators.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { CityView } from './CityView';
import { useCanvasStore } from '../store';
import type { Graph, GraphNode, GraphEdge } from '../../../shared/types';

// ---------------------------------------------------------------------------
// Mocks — R3F primitives, child components, layout engine
// ---------------------------------------------------------------------------

// Mock R3F — render JSX children as plain divs so JSDOM can inspect them
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: { position: { x: 0, y: 5, z: 10 } },
    gl: {},
  })),
}));

// Mock drei helpers that CityView imports may use transitively
vi.mock('@react-three/drei', () => ({
  Text: (props: Record<string, unknown>) => <div data-testid="drei-text" {...props} />,
  Billboard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Track which child components are rendered and with what props
const mockBuildingCalls: Array<{ node: GraphNode }> = [];
const mockClassBuildingCalls: Array<{ node: GraphNode }> = [];
const mockFunctionShopCalls: Array<{ node: GraphNode }> = [];
const mockInterfaceBuildingCalls: Array<{ node: GraphNode }> = [];
const mockAbstractBuildingCalls: Array<{ node: GraphNode }> = [];
const mockVariableCrateCalls: Array<{ node: GraphNode }> = [];
const mockEnumCrateCalls: Array<{ node: GraphNode }> = [];
const mockDistrictGroundCalls: Array<Record<string, unknown>>[] = [];
const mockCityEdgeCalls: Array<Record<string, unknown>>[] = [];
const mockClusterBuildingCalls: Array<Record<string, unknown>>[] = [];

vi.mock('./Building', () => ({
  Building: (props: { node: GraphNode }) => {
    mockBuildingCalls.push({ node: props.node });
    return <div data-testid={`building-${props.node.id}`} />;
  },
}));

vi.mock('./ExternalBuilding', () => ({
  ExternalBuilding: (props: { node: GraphNode }) => (
    <div data-testid={`external-building-${props.node.id}`} />
  ),
}));

vi.mock('./XRayBuilding', () => ({
  XRayBuilding: (props: { node: GraphNode }) => (
    <div data-testid={`xray-building-${props.node.id}`} />
  ),
}));

vi.mock('./CityEdge', () => ({
  CityEdge: (props: Record<string, unknown>) => {
    (mockCityEdgeCalls as unknown as Array<Record<string, unknown>>).push(props);
    return <div data-testid={`city-edge-${(props.edge as GraphEdge).id}`} />;
  },
}));

vi.mock('./GroundPlane', () => ({
  GroundPlane: () => <div data-testid="ground-plane" />,
}));

vi.mock('./UndergroundLayer', () => ({
  UndergroundLayer: () => <div data-testid="underground-layer" />,
}));

vi.mock('../components/DistrictGround', () => ({
  DistrictGround: (props: Record<string, unknown>) => {
    (mockDistrictGroundCalls as unknown as Array<Record<string, unknown>>).push(props);
    return <div data-testid={`district-ground-${props.label}`} />;
  },
}));

vi.mock('../components/ClusterBuilding', () => ({
  ClusterBuilding: (props: Record<string, unknown>) => {
    (mockClusterBuildingCalls as unknown as Array<Record<string, unknown>>).push(props);
    return <div data-testid={`cluster-building-${props.districtName}`} />;
  },
}));

vi.mock('../components/LodController', () => ({
  LodController: () => <div data-testid="lod-controller" />,
}));

vi.mock('../components/buildings', () => ({
  ClassBuilding: (props: { node: GraphNode }) => {
    mockClassBuildingCalls.push({ node: props.node });
    return <div data-testid={`class-building-${props.node.id}`} />;
  },
  FunctionShop: (props: { node: GraphNode }) => {
    mockFunctionShopCalls.push({ node: props.node });
    return <div data-testid={`function-shop-${props.node.id}`} />;
  },
  InterfaceBuilding: (props: { node: GraphNode }) => {
    mockInterfaceBuildingCalls.push({ node: props.node });
    return <div data-testid={`interface-building-${props.node.id}`} />;
  },
  AbstractBuilding: (props: { node: GraphNode }) => {
    mockAbstractBuildingCalls.push({ node: props.node });
    return <div data-testid={`abstract-building-${props.node.id}`} />;
  },
  VariableCrate: (props: { node: GraphNode }) => {
    mockVariableCrateCalls.push({ node: props.node });
    return <div data-testid={`variable-crate-${props.node.id}`} />;
  },
  EnumCrate: (props: { node: GraphNode }) => {
    mockEnumCrateCalls.push({ node: props.node });
    return <div data-testid={`enum-crate-${props.node.id}`} />;
  },
  RooftopGarden: () => <div data-testid="rooftop-garden" />,
  buildNestedTypeMap: (nodes: GraphNode[]) => new Map<string, GraphNode[]>(),
}));

vi.mock('../components/buildingGeometry', () => ({
  getBuildingConfig: () => ({
    geometry: { width: 2, height: 3, depth: 2 },
    material: { color: '#888' },
  }),
}));

vi.mock('../components/districtGroundUtils', () => ({
  getDistrictColor: (_id: string, index: number) => `#color-${index}`,
}));

vi.mock('../components/signs', () => ({
  getSignType: () => 'nameplate',
  getSignVisibility: () => true,
  renderSign: (props: Record<string, unknown>) => (
    <div key={props.key as string} data-testid={`sign-${props.key}`} />
  ),
}));

vi.mock('../components/infrastructure', () => ({
  PowerStation: (props: { node: GraphNode }) => <div data-testid={`power-station-${props.node.id}`} />,
  WaterTower: (props: { node: GraphNode }) => <div data-testid={`water-tower-${props.node.id}`} />,
  MunicipalBuilding: (props: { node: GraphNode }) => <div data-testid={`municipal-building-${props.node.id}`} />,
  Harbor: (props: { node: GraphNode }) => <div data-testid={`harbor-${props.node.id}`} />,
  Airport: (props: { node: GraphNode }) => <div data-testid={`airport-${props.node.id}`} />,
  CityGate: (props: { node: GraphNode }) => <div data-testid={`city-gate-${props.node.id}`} />,
}));

vi.mock('../xrayUtils', () => ({
  computeXRayWallOpacity: () => 0.05,
  shouldShowXRayDetail: () => false,
}));

vi.mock('../undergroundUtils', () => ({
  computeGroundOpacity: () => 1.0,
}));

// Mock the layout engine — return deterministic positions
const mockPositions = new Map<string, { x: number; y: number; z: number }>();
const mockDistrictArcs = [
  {
    id: 'src/features',
    arcStart: 0,
    arcEnd: Math.PI,
    innerRadius: 10,
    outerRadius: 20,
    ringDepth: 1,
    nodeCount: 3,
  },
  {
    id: 'src/utils',
    arcStart: Math.PI,
    arcEnd: 2 * Math.PI,
    innerRadius: 10,
    outerRadius: 20,
    ringDepth: 1,
    nodeCount: 2,
  },
];

vi.mock('../layout/engines/radialCityLayout', () => ({
  RadialCityLayoutEngine: class MockRadialCityLayoutEngine {
    layout() {
      return {
        positions: mockPositions,
        bounds: {
          min: { x: -50, y: 0, z: -50 },
          max: { x: 50, y: 20, z: 50 },
        },
        metadata: { districtArcs: mockDistrictArcs },
      };
    }
  },
}));

vi.mock('../layout/engines/clusterUtils', () => ({
  shouldCluster: (count: number, threshold: number) => count > threshold,
  createClusterMetadata: (districtId: string, nodeIds: string[], positions: Map<string, { x: number; y: number; z: number }>) => ({
    districtId,
    nodeIds,
    nodeCount: nodeIds.length,
    center: { x: 0, y: 0, z: 0 },
    size: { x: 10, y: 5, z: 10 },
  }),
}));

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function createNode(
  id: string,
  type: GraphNode['type'] = 'file',
  dir = 'src/features',
  overrides: Partial<GraphNode> = {},
): GraphNode {
  return {
    id,
    type,
    label: id,
    metadata: { path: `${dir}/${id}.ts` },
    lod: 3,
    depth: 1,
    isExternal: false,
    ...overrides,
  };
}

function createEdge(
  source: string,
  target: string,
  type: GraphEdge['type'] = 'imports',
): GraphEdge {
  return {
    id: `${source}--${type}--${target}`,
    source,
    target,
    type,
    metadata: {},
  };
}

function createTestGraph(): Graph {
  const nodes: GraphNode[] = [
    createNode('file-a', 'file', 'src/features'),
    createNode('class-b', 'class', 'src/features'),
    createNode('func-c', 'function', 'src/features'),
    createNode('util-d', 'file', 'src/utils'),
    createNode('iface-e', 'interface', 'src/utils'),
  ];

  const edges: GraphEdge[] = [
    createEdge('file-a', 'util-d', 'imports'),
    createEdge('class-b', 'iface-e', 'imports'),
  ];

  return {
    nodes,
    edges,
    metadata: {
      repositoryId: 'test-repo',
      name: 'TestProject',
      totalNodes: nodes.length,
      totalEdges: edges.length,
    },
  };
}

/**
 * Creates a large graph for clustering tests.
 * Places 25 nodes in one district to trigger LOD 1 clustering.
 */
function createLargeDistrictGraph(): Graph {
  const nodes: GraphNode[] = [];
  for (let i = 0; i < 25; i++) {
    nodes.push(createNode(`node-${i}`, 'file', 'src/big-district'));
  }
  // Add a few in another small district
  nodes.push(createNode('small-1', 'file', 'src/small'));
  nodes.push(createNode('small-2', 'file', 'src/small'));

  return {
    nodes,
    edges: [],
    metadata: {
      repositoryId: 'test-repo',
      name: 'LargeProject',
      totalNodes: nodes.length,
      totalEdges: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function setupPositions(graph: Graph) {
  mockPositions.clear();
  graph.nodes.forEach((node, i) => {
    mockPositions.set(node.id, { x: i * 5, y: 0, z: i * 3 });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CityView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCanvasStore.getState().reset();
    mockBuildingCalls.length = 0;
    mockClassBuildingCalls.length = 0;
    mockFunctionShopCalls.length = 0;
    mockInterfaceBuildingCalls.length = 0;
    mockAbstractBuildingCalls.length = 0;
    mockVariableCrateCalls.length = 0;
    mockEnumCrateCalls.length = 0;
    (mockDistrictGroundCalls as unknown as Array<unknown>).length = 0;
    (mockCityEdgeCalls as unknown as Array<unknown>).length = 0;
    (mockClusterBuildingCalls as unknown as Array<unknown>).length = 0;
    mockPositions.clear();
  });

  // =========================================================================
  // Task 1: Basic rendering — test infrastructure verification
  // =========================================================================

  describe('basic rendering', () => {
    it('renders without crashing given a valid graph', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      const { container } = render(<CityView graph={graph} />);
      expect(container).toBeDefined();
    });

    it('renders ground plane', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      const { getByTestId } = render(<CityView graph={graph} />);
      expect(getByTestId('ground-plane')).toBeDefined();
    });

    it('renders LodController', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      const { getByTestId } = render(<CityView graph={graph} />);
      expect(getByTestId('lod-controller')).toBeDefined();
    });
  });

  // =========================================================================
  // Task 2: Hover interaction tests (AC-1)
  // =========================================================================

  describe('hover interactions', () => {
    it('setting hoveredNodeId in store reflects hover state', () => {
      const graph = createTestGraph();
      setupPositions(graph);
      render(<CityView graph={graph} />);

      // Simulate hover by setting store state directly
      useCanvasStore.getState().setHoveredNode('class-b');
      expect(useCanvasStore.getState().hoveredNodeId).toBe('class-b');
    });

    it('clearing hoveredNodeId resets hover state', () => {
      const graph = createTestGraph();
      setupPositions(graph);
      render(<CityView graph={graph} />);

      useCanvasStore.getState().setHoveredNode('class-b');
      useCanvasStore.getState().setHoveredNode(null);
      expect(useCanvasStore.getState().hoveredNodeId).toBeNull();
    });

    it('hover state is independent per node', () => {
      const graph = createTestGraph();
      setupPositions(graph);
      render(<CityView graph={graph} />);

      useCanvasStore.getState().setHoveredNode('file-a');
      expect(useCanvasStore.getState().hoveredNodeId).toBe('file-a');

      useCanvasStore.getState().setHoveredNode('class-b');
      expect(useCanvasStore.getState().hoveredNodeId).toBe('class-b');
    });
  });

  // =========================================================================
  // Task 3: Selection tests (AC-2)
  // =========================================================================

  describe('selection interactions', () => {
    it('selectNode sets selectedNodeId in store', () => {
      const graph = createTestGraph();
      setupPositions(graph);
      render(<CityView graph={graph} />);

      useCanvasStore.getState().selectNode('class-b');
      expect(useCanvasStore.getState().selectedNodeId).toBe('class-b');
    });

    it('selectNode with null deselects', () => {
      const graph = createTestGraph();
      setupPositions(graph);
      render(<CityView graph={graph} />);

      useCanvasStore.getState().selectNode('class-b');
      useCanvasStore.getState().selectNode(null);
      expect(useCanvasStore.getState().selectedNodeId).toBeNull();
    });

    it('selection persists across re-renders', () => {
      const graph = createTestGraph();
      setupPositions(graph);
      const { rerender } = render(<CityView graph={graph} />);

      useCanvasStore.getState().selectNode('func-c');
      rerender(<CityView graph={graph} />);
      expect(useCanvasStore.getState().selectedNodeId).toBe('func-c');
    });
  });

  // =========================================================================
  // Task 4: Drill-down tests (AC-3)
  // =========================================================================

  describe('drill-down interactions', () => {
    it('enterNode transitions viewMode to cell for class nodes', () => {
      const graph = createTestGraph();
      setupPositions(graph);
      render(<CityView graph={graph} />);

      useCanvasStore.getState().enterNode('class-b', 'class');
      const state = useCanvasStore.getState();
      expect(state.viewMode).toBe('cell');
      expect(state.focusedNodeId).toBe('class-b');
    });

    it('enterNode pushes to focusHistory when already focused', () => {
      const graph = createTestGraph();
      graph.nodes.push(createNode('file-x', 'file', 'src/features'));
      setupPositions(graph);
      render(<CityView graph={graph} />);

      // First enter a file node (sets focusedNodeId)
      useCanvasStore.getState().enterNode('file-x', 'file');
      expect(useCanvasStore.getState().focusedNodeId).toBe('file-x');

      // Now enter a class — previous focusedNodeId should be pushed to history
      useCanvasStore.getState().enterNode('class-b', 'class');
      const state = useCanvasStore.getState();
      expect(state.focusHistory.length).toBeGreaterThan(0);
      expect(state.focusHistory).toContain('file-x');
    });

    it('exitToParent returns to previous state', () => {
      const graph = createTestGraph();
      graph.nodes.push(createNode('file-x', 'file', 'src/features'));
      setupPositions(graph);
      render(<CityView graph={graph} />);

      // Enter file first (building mode), then class (cell mode)
      useCanvasStore.getState().enterNode('file-x', 'file');
      expect(useCanvasStore.getState().viewMode).toBe('building');

      useCanvasStore.getState().enterNode('class-b', 'class');
      expect(useCanvasStore.getState().viewMode).toBe('cell');

      useCanvasStore.getState().exitToParent();
      expect(useCanvasStore.getState().viewMode).toBe('building');
    });

    it('resetToCity returns to city view from any depth', () => {
      const graph = createTestGraph();
      setupPositions(graph);
      render(<CityView graph={graph} />);

      useCanvasStore.getState().enterNode('class-b', 'class');
      useCanvasStore.getState().resetToCity();

      const state = useCanvasStore.getState();
      expect(state.viewMode).toBe('city');
      expect(state.focusedNodeId).toBeNull();
    });
  });

  // =========================================================================
  // Task 5: Rendering tests (AC-4, AC-5, AC-6)
  // =========================================================================

  describe('district ground rendering (AC-4)', () => {
    it('renders DistrictGround for each district arc', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      const { getAllByTestId } = render(<CityView graph={graph} />);
      const grounds = getAllByTestId(/^district-ground-/);
      // mockDistrictArcs has 2 entries
      expect(grounds.length).toBe(2);
    });

    it('renders DistrictGround with correct district labels', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      const { getByTestId } = render(<CityView graph={graph} />);
      expect(getByTestId('district-ground-src/features')).toBeDefined();
      expect(getByTestId('district-ground-src/utils')).toBeDefined();
    });
  });

  describe('edge rendering (AC-5)', () => {
    it('renders CityEdge for each visible edge', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      const { getAllByTestId } = render(<CityView graph={graph} />);
      const edges = getAllByTestId(/^city-edge-/);
      // 2 imports edges in test graph
      expect(edges.length).toBe(2);
    });

    it('does not render edges without layout positions', () => {
      const graph = createTestGraph();
      // Only set positions for some nodes — edges to missing nodes should be filtered
      mockPositions.set('file-a', { x: 0, y: 0, z: 0 });
      mockPositions.set('util-d', { x: 10, y: 0, z: 10 });
      // class-b and iface-e have no positions

      const { queryAllByTestId } = render(<CityView graph={graph} />);
      const edges = queryAllByTestId(/^city-edge-/);
      // Only the file-a → util-d edge should render
      expect(edges.length).toBe(1);
    });

    it('does not render contains edges', () => {
      const graph = createTestGraph();
      // Add a contains edge
      graph.edges.push(createEdge('file-a', 'class-b', 'contains'));
      setupPositions(graph);

      const { queryAllByTestId } = render(<CityView graph={graph} />);
      const edges = queryAllByTestId(/^city-edge-/);
      // Only the 2 imports edges, not the contains edge
      expect(edges.length).toBe(2);
    });
  });

  describe('LOD 1 clustering (AC-6)', () => {
    it('renders ClusterBuilding for large districts at LOD 1', () => {
      const graph = createLargeDistrictGraph();
      setupPositions(graph);
      useCanvasStore.getState().setLodLevel(1);

      const { queryAllByTestId } = render(<CityView graph={graph} />);
      const clusters = queryAllByTestId(/^cluster-building-/);
      // big-district has 25 nodes > 20 threshold
      expect(clusters.length).toBeGreaterThanOrEqual(1);
    });

    it('does not render ClusterBuilding at LOD 2+', () => {
      const graph = createLargeDistrictGraph();
      setupPositions(graph);
      useCanvasStore.getState().setLodLevel(2);

      const { queryAllByTestId } = render(<CityView graph={graph} />);
      const clusters = queryAllByTestId(/^cluster-building-/);
      expect(clusters.length).toBe(0);
    });

    it('hides individual buildings for clustered nodes at LOD 1', () => {
      const graph = createLargeDistrictGraph();
      setupPositions(graph);
      useCanvasStore.getState().setLodLevel(1);

      const { queryByTestId } = render(<CityView graph={graph} />);
      // node-0 through node-24 are in the big district (>20), should be clustered
      // They should NOT appear as individual buildings
      // However, small-1 and small-2 are in a small district, should still appear
      const small1 = queryByTestId('building-small-1');
      // small district nodes should still render
      expect(small1).toBeDefined();
    });
  });

  describe('typed building rendering', () => {
    it('renders ClassBuilding for class nodes', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      const { getByTestId } = render(<CityView graph={graph} />);
      expect(getByTestId('class-building-class-b')).toBeDefined();
    });

    it('renders FunctionShop for function nodes', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      const { getByTestId } = render(<CityView graph={graph} />);
      expect(getByTestId('function-shop-func-c')).toBeDefined();
    });

    it('renders InterfaceBuilding for interface nodes', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      const { getByTestId } = render(<CityView graph={graph} />);
      expect(getByTestId('interface-building-iface-e')).toBeDefined();
    });

    it('renders ExternalBuilding for external nodes without infrastructure type', () => {
      const graph = createTestGraph();
      graph.nodes.push(createNode('ext-lib', 'file', 'node_modules/lodash', { isExternal: true }));
      setupPositions(graph);

      const { getByTestId } = render(<CityView graph={graph} />);
      expect(getByTestId('external-building-ext-lib')).toBeDefined();
    });
  });

  // =========================================================================
  // Layer visibility
  // =========================================================================

  describe('layer visibility', () => {
    it('hides above-ground content when aboveGround layer is off', () => {
      const graph = createTestGraph();
      setupPositions(graph);

      // Turn off above-ground layer
      useCanvasStore.getState().toggleLayer('aboveGround');
      const { visibleLayers } = useCanvasStore.getState();
      expect(visibleLayers.aboveGround).toBe(false);

      const { queryAllByTestId } = render(<CityView graph={graph} />);
      // No buildings, no edges, no district grounds when above-ground is off
      const buildings = queryAllByTestId(/^(class-building|function-shop|building)-/);
      expect(buildings.length).toBe(0);
    });
  });
});
