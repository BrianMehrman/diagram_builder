/**
 * MiniMap Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { MiniMap } from './MiniMap';
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
];

describe('MiniMap', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders minimap with header', () => {
    render(<MiniMap nodes={mockNodes} />);

    expect(screen.getByText('MiniMap')).toBeDefined();
  });

  it('renders tree view by default', () => {
    render(<MiniMap nodes={mockNodes} />);

    expect(screen.getByText('app.ts')).toBeDefined();
  });

  it('displays node count in footer', () => {
    render(<MiniMap nodes={mockNodes} />);

    expect(screen.getByText('2 nodes')).toBeDefined();
  });

  it('shows selection count when node is selected', () => {
    useCanvasStore.getState().selectNode('file-1');

    render(<MiniMap nodes={mockNodes} />);

    expect(screen.getByText(/1 selected/)).toBeDefined();
  });

  it('renders tree and 3D toggle buttons', () => {
    render(<MiniMap nodes={mockNodes} />);

    expect(screen.getByText('Tree')).toBeDefined();
    expect(screen.getByText('3D')).toBeDefined();
  });

  it('tree view button is active by default', () => {
    render(<MiniMap nodes={mockNodes} />);

    const treeButton = screen.getByText('Tree');
    expect(treeButton.className).toContain('bg-primary-600');
  });
});
