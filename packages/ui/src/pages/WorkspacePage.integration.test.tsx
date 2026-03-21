import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, act, renderHook } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { WorkspacePage } from './WorkspacePage'
import { useCanvasStore } from '../features/canvas/store'
import { useLayout } from '../features/canvas/layouts'
import * as endpoints from '../shared/api/endpoints'
import { SemanticTier } from '@diagram-builder/core'

// ---------------------------------------------------------------------------
// Mock heavy/WebGL dependencies that WorkspacePage imports transitively
// ---------------------------------------------------------------------------

vi.mock('../shared/api/endpoints')

vi.mock('../features/canvas', () => ({
  Canvas3D: () => <div data-testid="canvas-3d">Canvas3D</div>,
  EmptyState: ({ onImportClick }: { onImportClick: () => void }) => (
    <div data-testid="empty-state" onClick={onImportClick}>
      EmptyState
    </div>
  ),
  CodebaseStatusIndicator: () => <div>Processing</div>,
  ErrorNotification: () => <div>Error</div>,
  SuccessNotification: () => <div>Success</div>,
  NodeDetails: () => <div data-testid="node-details">NodeDetails</div>,
}))

vi.mock('../features/minimap', () => ({
  MiniMap: () => <div data-testid="minimap">MiniMap</div>,
}))

vi.mock('../features/navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
  SearchBarModal: () => <div data-testid="search-modal">SearchBarModal</div>,
  useCameraFlight: () => ({ flyToNode: vi.fn(), cancelFlight: vi.fn(), isFlying: false }),
}))

vi.mock('../features/panels', () => ({
  LeftPanel: () => (
    <aside data-testid="left-panel" aria-label="Navigation menu">
      LeftPanel
    </aside>
  ),
  RightPanel: () => (
    <aside data-testid="right-panel" aria-label="Tools panel">
      RightPanel
    </aside>
  ),
}))

vi.mock('../features/navigation/HUD', () => ({
  HUD: () => <div data-testid="hud">HUD</div>,
}))

vi.mock('../shared/hooks', () => ({
  useGlobalSearchShortcut: vi.fn(),
  useGlobalKeyboardShortcuts: vi.fn(),
}))

vi.mock('../shared/stores/uiStore', () => ({
  useUIStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      isLeftPanelOpen: false,
      isRightPanelOpen: false,
      toggleLeftPanel: vi.fn(),
      toggleRightPanel: vi.fn(),
      openLeftPanel: vi.fn(),
      closeAllPanels: vi.fn(),
    }
    return selector(state)
  }),
}))

vi.mock('../features/export/store', () => ({
  useExportStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      setRepositoryId: vi.fn(),
    }
    return selector(state)
  }),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const minimalGraph = {
  nodes: [
    {
      id: 'file:a',
      type: 'file',
      lod: 3,
      position: { x: 0, y: 0, z: 0 },
      metadata: {
        label: 'a.ts',
        path: 'a.ts',
        properties: {},
      },
    },
  ],
  edges: [],
  metadata: {
    name: 'test',
    schemaVersion: '1.0.0',
    generatedAt: '',
    rootPath: '',
    languages: [],
    stats: {
      totalNodes: 1,
      totalEdges: 0,
      nodesByType: {} as Record<string, number>,
      edgesByType: {} as Record<string, number>,
    },
  },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
}

const mockParseResult = {
  graph: minimalGraph,
  hierarchy: {
    root: { id: 'root', label: 'root', tier: 0, nodeIds: [], children: [] },
    tierCount: {} as Record<string, number>,
    edgesByTier: {} as Record<string, unknown[]>,
  },
  tiers: {
    0: minimalGraph,
    1: minimalGraph,
    2: minimalGraph,
    3: minimalGraph,
    4: minimalGraph,
    5: minimalGraph,
  } as Record<number, typeof minimalGraph>,
}

// ---------------------------------------------------------------------------
// WorkspacePage integration tests
// ---------------------------------------------------------------------------

describe('WorkspacePage integration', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(endpoints.workspaces.get).mockResolvedValue({ id: 'ws-1', name: 'Test WS' } as any)

    vi.mocked(endpoints.codebases.list).mockResolvedValue({
      codebases: [{ codebaseId: 'cb-1', repositoryId: 'repo-1', status: 'completed' }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(endpoints.graph.getParseResult).mockResolvedValue(mockParseResult as any)

    // Reset canvas store between tests
    useCanvasStore.setState({ parseResult: null, resolver: null })
  })

  it('sets parseResult in store after successful fetch', async () => {
    render(
      <MemoryRouter initialEntries={['/workspace/ws-1']}>
        <Routes>
          <Route path="/workspace/:id" element={<WorkspacePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const { parseResult, resolver } = useCanvasStore.getState()
      expect(parseResult).not.toBeNull()
      expect(resolver).not.toBeNull()
      expect(parseResult?.graph.nodes.length).toBeGreaterThan(0)
      expect(parseResult?.graph.nodes[0].metadata.label).toBeDefined()
    })
  })

  it('resolver can produce a tier graph after fetch', async () => {
    render(
      <MemoryRouter initialEntries={['/workspace/ws-1']}>
        <Routes>
          <Route path="/workspace/:id" element={<WorkspacePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const { resolver } = useCanvasStore.getState()
      if (!resolver) return
      const tierGraph = resolver.getTier(SemanticTier.File)
      expect(tierGraph.nodes).toBeDefined()
    })
  })

  it('parseResult.graph.nodes are accessible at IVMNode paths for all former graphData consumers', async () => {
    render(
      <MemoryRouter initialEntries={['/workspace/ws-1']}>
        <Routes>
          <Route path="/workspace/:id" element={<WorkspacePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const { parseResult } = useCanvasStore.getState()
      if (!parseResult) return

      const nodes = parseResult.graph.nodes
      expect(nodes[0].metadata.label).toBeDefined()
      expect(nodes[0].id).toBeDefined()
      expect(nodes[0].type).toBeDefined()
      expect(nodes[0].position).toBeDefined()
      // Confirm old flat .label shape is NOT present (IVMNode shape only)
      expect((nodes[0] as unknown as Record<string, unknown>).label).toBeUndefined()
    })
  })
})

// ---------------------------------------------------------------------------
// Layout switcher tests
// ---------------------------------------------------------------------------

describe('layout switcher', () => {
  it('setActiveLayout("basic3d") causes useLayout to return the basic3d engine', () => {
    act(() => useCanvasStore.getState().setActiveLayout('basic3d'))
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.id).toBe('basic3d')
    expect(result.current.engine.component).toBeDefined()
  })

  it('setActiveLayout("city") causes useLayout to return the city engine', () => {
    act(() => useCanvasStore.getState().setActiveLayout('city'))
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.id).toBe('city')
    expect(result.current.engine.component).toBeDefined()
  })
})
