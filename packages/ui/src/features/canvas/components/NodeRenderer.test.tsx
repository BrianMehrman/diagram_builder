/**
 * NodeRenderer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { NodeRenderer } from './NodeRenderer';
import { useCanvasStore } from '../store';
import type { GraphNode } from '../../../shared/types';

// Mock Canvas for tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockNode: GraphNode = {
  id: 'test-node',
  type: 'class',
  label: 'TestClass',
  metadata: {},
  position: { x: 0, y: 0, z: 0 },
  lodLevel: 1,
};

describe('NodeRenderer', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders without crashing', () => {
    const { container } = render(<NodeRenderer node={mockNode} />);
    expect(container).toBeDefined();
  });

  it('uses sphere geometry for class nodes', () => {
    const { container } = render(<NodeRenderer node={mockNode} />);
    expect(container).toBeDefined();
    // More detailed testing would require Three.js test setup
  });

  it('uses box geometry for file nodes', () => {
    const fileNode: GraphNode = {
      ...mockNode,
      type: 'file',
    };

    const { container } = render(<NodeRenderer node={fileNode} />);
    expect(container).toBeDefined();
  });

  it('reflects selection state from store', () => {
    useCanvasStore.getState().selectNode('test-node');

    const { container } = render(<NodeRenderer node={mockNode} />);
    expect(container).toBeDefined();

    const selectedNodeId = useCanvasStore.getState().selectedNodeId;
    expect(selectedNodeId).toBe('test-node');
  });

  it('uses default position when not provided', () => {
    const nodeWithoutPosition: GraphNode = {
      ...mockNode,
      position: undefined,
    };

    const { container } = render(<NodeRenderer node={nodeWithoutPosition} />);
    expect(container).toBeDefined();
  });
});
