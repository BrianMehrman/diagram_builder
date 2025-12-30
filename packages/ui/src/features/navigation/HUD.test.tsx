/**
 * HUD Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { HUD } from './HUD';
import { useCanvasStore } from '../canvas/store';
import type { GraphNode } from '../../shared/types';

const mockNodes: GraphNode[] = [
  {
    id: 'file-1',
    type: 'file',
    label: 'app.ts',
    metadata: {},
    position: { x: 0, y: 0, z: 0 },
    lodLevel: 0,
  },
  {
    id: 'class-1',
    type: 'class',
    label: 'Application',
    metadata: { file: 'file-1' },
    position: { x: 1, y: 1, z: 1 },
    lodLevel: 1,
  },
  {
    id: 'method-1',
    type: 'method',
    label: 'initialize',
    metadata: { class: 'class-1', file: 'file-1' },
    position: { x: 1.5, y: 1.5, z: 1.5 },
    lodLevel: 2,
  },
  {
    id: 'method-2',
    type: 'method',
    label: 'process',
    metadata: { class: 'class-1', file: 'file-1' },
    position: { x: 2, y: 2, z: 2 },
    lodLevel: 3,
  },
];

describe('HUD', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders FPS counter', async () => {
    render(<HUD nodes={mockNodes} />);

    expect(screen.getByText('FPS:')).toBeDefined();

    // FPS value should update
    await waitFor(
      () => {
        const fpsText = screen.getByText(/FPS:/);
        const fpsValue = fpsText.nextElementSibling?.textContent;
        expect(fpsValue).toBeDefined();
      },
      { timeout: 2000 }
    );
  });

  it('displays camera position', () => {
    render(<HUD nodes={mockNodes} />);

    expect(screen.getByText('Camera:')).toBeDefined();
    // Camera position is (0.0, 5.0, 10.0) by default
    expect(screen.getByText(/\(0\.0, 5\.0, 10\.0\)/)).toBeDefined();
  });

  it('displays camera target', () => {
    render(<HUD nodes={mockNodes} />);

    expect(screen.getByText('Target:')).toBeDefined();
  });

  it('displays LOD level', () => {
    render(<HUD nodes={mockNodes} />);

    expect(screen.getByText('LOD:')).toBeDefined();
    expect(screen.getByText('Level 2')).toBeDefined(); // Default LOD is 2
  });

  it('displays total node count', () => {
    render(<HUD nodes={mockNodes} />);

    expect(screen.getByText('Nodes:')).toBeDefined();
    expect(screen.getByText(/\/ 4/)).toBeDefined(); // Total is 4
  });

  it('displays visible node count based on LOD', () => {
    render(<HUD nodes={mockNodes} />);

    // Default LOD is 2, so nodes with lodLevel <= 2 should be visible (3 nodes)
    expect(screen.getByText(/3 \/ 4/)).toBeDefined();
  });

  it('updates visible count when LOD changes', () => {
    render(<HUD nodes={mockNodes} />);

    // Initially LOD 2: 3 visible nodes
    expect(screen.getByText(/3 \/ 4/)).toBeDefined();

    // Change LOD to 3
    act(() => {
      useCanvasStore.getState().setLodLevel(3);
    });

    // Now all 4 nodes should be visible
    expect(screen.getByText(/4 \/ 4/)).toBeDefined();
  });

  it('does not show selected node info when nothing is selected', () => {
    render(<HUD nodes={mockNodes} />);

    expect(screen.queryByText('Selected:')).toBeNull();
  });

  it('shows selected node info when node is selected', () => {
    act(() => {
      useCanvasStore.getState().selectNode('class-1');
    });

    render(<HUD nodes={mockNodes} />);

    expect(screen.getByText('Selected:')).toBeDefined();
    expect(screen.getByText('Application')).toBeDefined();
    expect(screen.getByText('Type:')).toBeDefined();
    expect(screen.getByText('class')).toBeDefined();
  });

  it('shows selected node position', () => {
    act(() => {
      useCanvasStore.getState().selectNode('class-1');
    });

    render(<HUD nodes={mockNodes} />);

    expect(screen.getByText('Position:')).toBeDefined();
    expect(screen.getByText(/\(1\.0, 1\.0, 1\.0\)/)).toBeDefined();
  });

  it('updates camera position display when camera moves', () => {
    render(<HUD nodes={mockNodes} />);

    act(() => {
      useCanvasStore.getState().setCameraPosition({ x: 10, y: 20, z: 30 });
    });

    expect(screen.getByText(/\(10\.0, 20\.0, 30\.0\)/)).toBeDefined();
  });

  it('updates when different node is selected', () => {
    act(() => {
      useCanvasStore.getState().selectNode('class-1');
    });

    render(<HUD nodes={mockNodes} />);

    expect(screen.getByText('Application')).toBeDefined();

    act(() => {
      useCanvasStore.getState().selectNode('method-1');
    });

    expect(screen.getByText('initialize')).toBeDefined();
    expect(screen.queryByText('Application')).toBeNull();
  });

  it('has monospace font styling', () => {
    const { container } = render(<HUD nodes={mockNodes} />);

    const hudElement = container.firstChild as HTMLElement;
    expect(hudElement.className).toContain('font-mono');
  });

  it('has backdrop blur styling', () => {
    const { container } = render(<HUD nodes={mockNodes} />);

    const hudElement = container.firstChild as HTMLElement;
    expect(hudElement.className).toContain('backdrop-blur-sm');
  });

  it('positions in top-left corner', () => {
    const { container } = render(<HUD nodes={mockNodes} />);

    const hudElement = container.firstChild as HTMLElement;
    expect(hudElement.className).toContain('absolute');
    expect(hudElement.className).toContain('top-4');
    expect(hudElement.className).toContain('left-4');
  });
});
