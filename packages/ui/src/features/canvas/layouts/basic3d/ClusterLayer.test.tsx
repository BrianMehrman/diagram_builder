/**
 * ClusterLayer Test Suite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ClusterLayer } from './ClusterLayer'
import { useCanvasStore } from '../../store'
import type { ClusterData } from './clusterBuilder'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ camera: { position: { x: 0, y: 5, z: 10 } } })),
}))

vi.mock('@react-three/drei', () => ({
  Text: (props: Record<string, unknown>) => <div data-testid="cluster-label" {...props} />,
  Billboard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Sphere: (props: Record<string, unknown>) => <div data-testid="cluster-sphere" {...props} />,
}))

vi.mock('three', () => ({
  default: {},
}))

function makeCluster(id: string, nodeCount: number): ClusterData {
  return {
    id,
    label: `${id.replace('cluster:', '')} (${nodeCount})`,
    nodeIds: Array.from({ length: nodeCount }, (_, i) => `${id}-node-${i}`),
    centroid: { x: 0, y: 0, z: 0 },
    radius: 10,
    dominantType: 'file',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useCanvasStore.getState().reset()
})

describe('ClusterLayer', () => {
  it('renders nothing when clusters map is empty', () => {
    useCanvasStore.setState({ clusters: new Map() })
    const { queryAllByTestId } = render(<ClusterLayer />)
    expect(queryAllByTestId('cluster-sphere')).toHaveLength(0)
  })

  it('renders one sphere per cluster', () => {
    const clusters = new Map([
      ['cluster:auth', makeCluster('cluster:auth', 5)],
      ['cluster:payments', makeCluster('cluster:payments', 3)],
    ])
    useCanvasStore.setState({ clusters })

    const { getAllByTestId } = render(<ClusterLayer />)
    expect(getAllByTestId('cluster-sphere')).toHaveLength(2)
  })

  it('renders one label per cluster', () => {
    const clusters = new Map([['cluster:auth', makeCluster('cluster:auth', 5)]])
    useCanvasStore.setState({ clusters })

    const { getAllByTestId } = render(<ClusterLayer />)
    expect(getAllByTestId('cluster-label')).toHaveLength(1)
  })
})
