import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('./lib/telemetry', () => ({
  withSpan: vi.fn((_name: string, _attrs: unknown, fn: (span: unknown) => unknown) =>
    fn({ end: vi.fn(), setAttributes: vi.fn(), setStatus: vi.fn() })
  ),
  getTracer: vi.fn(),
  initTelemetry: vi.fn(),
}))

vi.mock('../../lib/telemetry', () => ({
  withSpan: vi.fn((_name: string, _attrs: unknown, fn: (span: unknown) => unknown) =>
    fn({ end: vi.fn(), setAttributes: vi.fn(), setStatus: vi.fn() })
  ),
  getTracer: vi.fn(),
  initTelemetry: vi.fn(),
}))

// Mock R3F — Canvas fires onCreated synchronously in tests via this mock
vi.mock('@react-three/fiber', () => ({
  Canvas: vi.fn(
    ({ children, onCreated }: { children: React.ReactNode; onCreated?: () => void }) => {
      if (onCreated) onCreated()
      return React.createElement('div', { 'data-testid': 'canvas' }, children)
    }
  ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ camera: {}, gl: {}, scene: {} })),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  FlyControls: () => null,
  Grid: () => null,
  PerspectiveCamera: () => null,
}))

vi.mock('./store', () => ({
  useCanvasStore: vi.fn((selector) =>
    selector({
      parseResult: { graph: { nodes: [{ id: 'n1' }, { id: 'n2' }] } },
      activeLayout: 'city',
      layoutPositions: new Map(),
      camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 },
      controlMode: 'orbit',
      lodLevel: 1,
      resolver: null,
      setCamera: vi.fn(),
      setCameraTarget: vi.fn(),
      setCameraPosition: vi.fn(),
      setNearestNodeId: vi.fn(),
    })
  ),
}))

vi.mock('./views', () => ({ ViewModeRenderer: () => null }))
vi.mock('./transitions', () => ({ TransitionOrchestrator: () => null }))
vi.mock('./components/DependencyLegend', () => ({ DependencyLegend: () => null }))
vi.mock('./components/FocusToggleButton', () => ({ FocusToggleButton: () => null }))
vi.mock('./components/RadialOverlay', () => ({ RadialOverlay: () => null }))
vi.mock('./visualization/setup', () => ({}))
vi.mock('../../shared/stores/uiStore', () => ({
  useUIStore: vi.fn((selector) => selector({ closeAllPanels: vi.fn() })),
}))

describe('Canvas3D telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits ui.canvas.render span with view and node_count on first render', async () => {
    const telemetry = await import('../../lib/telemetry')
    const { Canvas3D } = await import('./Canvas3D')

    render(React.createElement(Canvas3D))

    expect(telemetry.withSpan).toHaveBeenCalledWith(
      'ui.canvas.render',
      expect.objectContaining({
        view: expect.stringMatching(/city|basic3d/),
        node_count: expect.any(Number),
      }),
      expect.any(Function)
    )
  })
})
