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
    lod: 0,
  },
  {
    id: 'file-2',
    type: 'file',
    label: 'utils.ts',
    metadata: {},
    position: { x: 3, y: 0, z: 0 },
    lod: 0,
  },
  {
    id: 'class-1',
    type: 'class',
    label: 'Application',
    metadata: { file: 'file-1' },
    position: { x: 1, y: 1, z: 1 },
    lod: 1,
  },
  {
    id: 'method-1',
    type: 'method',
    label: 'initialize',
    metadata: { class: 'class-1', file: 'file-1' },
    position: { x: 1.5, y: 1.5, z: 1.5 },
    lod: 2,
  },
];

describe('HUD', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  // === AC-1: Real-time stats display ===

  it('displays total node count', () => {
    render(<HUD nodes={mockNodes} />);
    expect(screen.getByText('Nodes')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays file count', () => {
    render(<HUD nodes={mockNodes} />);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders FPS counter', async () => {
    render(<HUD nodes={mockNodes} />);
    expect(screen.getByText('FPS')).toBeInTheDocument();
  });

  it('displays control mode with emoji', () => {
    render(<HUD nodes={mockNodes} />);
    expect(screen.getByText('Mode')).toBeInTheDocument();
    // Default is orbit mode
    expect(screen.getByText(/Orbit/)).toBeInTheDocument();
  });

  it('updates mode when control mode changes', () => {
    render(<HUD nodes={mockNodes} />);
    expect(screen.getByText(/Orbit/)).toBeInTheDocument();

    act(() => {
      useCanvasStore.getState().setControlMode('fly');
    });

    expect(screen.getByText(/Fly/)).toBeInTheDocument();
  });

  // === AC-2: Dark glass styling ===

  it('has dark glass background styling', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const hudElement = container.firstChild as HTMLElement;
    // Uses inline style for the specific rgba color
    expect(hudElement.style.backgroundColor).toBe('rgba(26, 31, 46, 0.95)');
  });

  it('has 200px width', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const hudElement = container.firstChild as HTMLElement;
    expect(hudElement.className).toContain('w-[200px]');
  });

  it('has backdrop blur', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const hudElement = container.firstChild as HTMLElement;
    expect(hudElement.className).toContain('backdrop-blur');
  });

  it('has rounded corners', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const hudElement = container.firstChild as HTMLElement;
    expect(hudElement.className).toContain('rounded-lg');
  });

  // === AC-3: Semantic HTML ===

  it('uses dl element for stats', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();
  });

  it('uses dt elements for stat labels', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const dtElements = container.querySelectorAll('dt');
    expect(dtElements.length).toBeGreaterThanOrEqual(4);
  });

  it('uses dd elements for stat values', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const ddElements = container.querySelectorAll('dd');
    expect(ddElements.length).toBeGreaterThanOrEqual(4);
  });

  it('has aria-label on the HUD', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const hudElement = container.firstChild as HTMLElement;
    expect(hudElement.getAttribute('aria-label')).toBe('Workspace statistics');
  });

  it('has aria-live on the stats section', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const dl = container.querySelector('dl');
    expect(dl?.getAttribute('aria-live')).toBe('polite');
  });

  it('is not keyboard focusable', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const hudElement = container.firstChild as HTMLElement;
    expect(hudElement.getAttribute('tabindex')).toBe('-1');
  });

  // === AC-4: Real-time updates ===

  it('updates node count when graph changes', () => {
    const { rerender, container } = render(<HUD nodes={mockNodes} />);
    // 4 nodes total
    const nodesDd = container.querySelectorAll('dd');
    expect(nodesDd[0].textContent).toBe('4');

    // Re-render with only 1 node (1 file)
    const singleNode = mockNodes.slice(0, 1);
    rerender(<HUD nodes={singleNode} />);
    const updatedDd = container.querySelectorAll('dd');
    expect(updatedDd[0].textContent).toBe('1');
  });

  // === FPS color coding ===

  it('shows FPS value with color coding', async () => {
    render(<HUD nodes={mockNodes} />);

    // FPS starts at 0 which is <30, should be red-tinted
    await waitFor(() => {
      const fpsValue = screen.getByTestId('fps-value');
      expect(fpsValue).toBeInTheDocument();
    });
  });

  // === Selected node info (existing feature) ===

  it('does not show selected node info when nothing is selected', () => {
    render(<HUD nodes={mockNodes} />);
    expect(screen.queryByText('Selected:')).toBeNull();
  });

  it('shows selected node info when node is selected', () => {
    act(() => {
      useCanvasStore.getState().selectNode('class-1');
    });

    render(<HUD nodes={mockNodes} />);
    expect(screen.getByText('Selected:')).toBeInTheDocument();
    expect(screen.getByText('Application')).toBeInTheDocument();
  });

  it('positions in top-left corner', () => {
    const { container } = render(<HUD nodes={mockNodes} />);
    const hudElement = container.firstChild as HTMLElement;
    expect(hudElement.className).toContain('absolute');
    expect(hudElement.className).toContain('top-4');
    expect(hudElement.className).toContain('left-4');
  });
});
