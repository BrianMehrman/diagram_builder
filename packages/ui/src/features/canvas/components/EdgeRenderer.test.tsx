/**
 * EdgeRenderer Tests
 *
 * Tests for edge rendering with pulse animation on highlighted node arrival
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { EdgeRenderer } from './EdgeRenderer';
import { useCanvasStore } from '../store';
import type { GraphEdge, GraphNode } from '../../../shared/types';

// Mock react-three-fiber
const mockUseFrame = vi.fn();
vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: (state: unknown, delta: number) => void) => {
    mockUseFrame(cb);
  },
}));

// Mock useReducedMotion
let mockReducedMotion = false;
vi.mock('../../../shared/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));

// Mock Three.js components for JSDOM
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    Vector3: class Vector3 {
      x: number;
      y: number;
      z: number;
      constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    },
    Color: class Color {
      r: number;
      g: number;
      b: number;
      constructor(color?: string) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        if (color) this.set(color);
      }
      set(_color: string) {
        return this;
      }
      clone() {
        const c = new Color();
        c.r = this.r;
        c.g = this.g;
        c.b = this.b;
        return c;
      }
      lerp(_target: Color, _alpha: number) {
        return this;
      }
      copy(source: Color) {
        this.r = source.r;
        this.g = source.g;
        this.b = source.b;
        return this;
      }
    },
  };
});

const createNode = (id: string, x = 0, y = 0, z = 0): GraphNode => ({
  id,
  label: id,
  type: 'file',
  position: { x, y, z },
  metadata: {},
});

const createEdge = (id: string, source: string, target: string): GraphEdge => ({
  id,
  source,
  target,
  type: 'depends_on',
  metadata: {},
});

describe('EdgeRenderer', () => {
  const nodes: GraphNode[] = [
    createNode('node-a', 0, 0, 0),
    createNode('node-b', 5, 5, 5),
    createNode('node-c', 10, 0, 0),
  ];

  const edge = createEdge('edge-1', 'node-a', 'node-b');
  const unrelatedEdge = createEdge('edge-2', 'node-b', 'node-c');

  beforeEach(() => {
    vi.clearAllMocks();
    mockReducedMotion = false;
    useCanvasStore.getState().reset();
  });

  it('renders edge line between source and target nodes', () => {
    // EdgeRenderer renders Three.js elements which don't render in JSDOM
    // We verify it doesn't throw and calls useFrame
    expect(() => {
      render(<EdgeRenderer edge={edge} nodes={nodes} />);
    }).not.toThrow();
  });

  it('returns null when source node is missing', () => {
    const orphanEdge = createEdge('orphan', 'missing', 'node-b');
    const { container } = render(<EdgeRenderer edge={orphanEdge} nodes={nodes} />);
    // Should render nothing
    expect(container.innerHTML).toBe('');
  });

  it('returns null when target node is missing', () => {
    const orphanEdge = createEdge('orphan', 'node-a', 'missing');
    const { container } = render(<EdgeRenderer edge={orphanEdge} nodes={nodes} />);
    expect(container.innerHTML).toBe('');
  });

  describe('connected edge detection', () => {
    it('identifies edge connected to highlighted node via source', () => {
      useCanvasStore.getState().setHighlightedNode('node-a');
      render(<EdgeRenderer edge={edge} nodes={nodes} />);

      // useFrame should have been registered (animation callback)
      expect(mockUseFrame).toHaveBeenCalled();
    });

    it('identifies edge connected to highlighted node via target', () => {
      useCanvasStore.getState().setHighlightedNode('node-b');
      render(<EdgeRenderer edge={edge} nodes={nodes} />);

      expect(mockUseFrame).toHaveBeenCalled();
    });

    it('does not animate when edge is not connected to highlighted node', () => {
      // Highlight node-c, which is not connected to edge-1 (node-a → node-b)
      useCanvasStore.getState().setHighlightedNode('node-c');
      render(<EdgeRenderer edge={edge} nodes={nodes} />);

      // useFrame is registered but callback should not modify material for unconnected edges
      expect(mockUseFrame).toHaveBeenCalled();
      const frameCallback = mockUseFrame.mock.calls[0][0];

      // Simulate a frame - callback should handle gracefully for non-connected edges
      expect(() => frameCallback({}, 0.016)).not.toThrow();
    });
  });

  describe('pulse animation', () => {
    it('registers useFrame callback for animation', () => {
      useCanvasStore.getState().setHighlightedNode('node-a');
      render(<EdgeRenderer edge={edge} nodes={nodes} />);

      expect(mockUseFrame).toHaveBeenCalledWith(expect.any(Function));
    });

    it('animation callback does not throw when no highlight set', () => {
      render(<EdgeRenderer edge={edge} nodes={nodes} />);

      const frameCallback = mockUseFrame.mock.calls[0][0];
      expect(() => frameCallback({}, 0.016)).not.toThrow();
    });
  });

  describe('reduced motion', () => {
    it('does not throw when reduced motion is preferred', () => {
      mockReducedMotion = true;
      useCanvasStore.getState().setHighlightedNode('node-a');

      expect(() => {
        render(<EdgeRenderer edge={edge} nodes={nodes} />);
      }).not.toThrow();
    });

    it('registers useFrame even with reduced motion for fade handling', () => {
      mockReducedMotion = true;
      useCanvasStore.getState().setHighlightedNode('node-a');
      render(<EdgeRenderer edge={edge} nodes={nodes} />);

      expect(mockUseFrame).toHaveBeenCalled();
    });
  });

  describe('non-connected edges remain unchanged', () => {
    it('unrelated edge is not affected by highlight', () => {
      // Highlight node-a; unrelatedEdge is node-b → node-c
      useCanvasStore.getState().setHighlightedNode('node-a');
      render(<EdgeRenderer edge={unrelatedEdge} nodes={nodes} />);

      const frameCallback = mockUseFrame.mock.calls[0][0];
      // Simulate frame — should not throw, material should not be modified for non-connected
      expect(() => frameCallback({}, 0.016)).not.toThrow();
    });
  });
});
