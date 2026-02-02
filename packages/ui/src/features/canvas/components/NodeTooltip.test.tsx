/**
 * NodeTooltip Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeTooltip } from './NodeTooltip';
import { useCanvasStore } from '../store';
import type { GraphNode } from '../../../shared/types';

const mockNodes: GraphNode[] = [
  {
    id: 'file-1',
    type: 'file',
    label: 'index.ts',
    lod: 1,
    metadata: {
      path: 'src/index.ts',
      language: 'TypeScript',
      loc: 150,
    },
  },
  {
    id: 'class-1',
    type: 'class',
    label: 'UserService',
    lod: 2,
    metadata: {
      path: 'src/services/UserService.ts',
      complexity: 5,
    },
  },
  {
    id: 'function-1',
    type: 'function',
    label: 'calculateTotal',
    lod: 3,
    metadata: {},
  },
];

describe('NodeTooltip', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders nothing when no node is highlighted', () => {
    const { container } = render(<NodeTooltip nodes={mockNodes} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders tooltip when a node is highlighted', () => {
    useCanvasStore.getState().setHighlightedNode('file-1');

    render(<NodeTooltip nodes={mockNodes} />);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('index.ts')).toBeInTheDocument();
  });

  it('displays node type label', () => {
    useCanvasStore.getState().setHighlightedNode('file-1');

    render(<NodeTooltip nodes={mockNodes} />);

    expect(screen.getByText('File')).toBeInTheDocument();
  });

  it('displays node path when available', () => {
    useCanvasStore.getState().setHighlightedNode('file-1');

    render(<NodeTooltip nodes={mockNodes} />);

    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
  });

  it('displays language when available', () => {
    useCanvasStore.getState().setHighlightedNode('file-1');

    render(<NodeTooltip nodes={mockNodes} />);

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('displays LOC when available', () => {
    useCanvasStore.getState().setHighlightedNode('file-1');

    render(<NodeTooltip nodes={mockNodes} />);

    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('displays complexity when available', () => {
    useCanvasStore.getState().setHighlightedNode('class-1');

    render(<NodeTooltip nodes={mockNodes} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays LOD level', () => {
    useCanvasStore.getState().setHighlightedNode('function-1');

    render(<NodeTooltip nodes={mockNodes} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders nothing when highlighted node not found in nodes array', () => {
    useCanvasStore.getState().setHighlightedNode('non-existent');

    const { container } = render(<NodeTooltip nodes={mockNodes} />);

    expect(container.firstChild).toBeNull();
  });

  it('has accessible tooltip role', () => {
    useCanvasStore.getState().setHighlightedNode('file-1');

    render(<NodeTooltip nodes={mockNodes} />);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('aria-live', 'polite');
  });

  it('displays correct icon for different node types', () => {
    // Test file icon
    useCanvasStore.getState().setHighlightedNode('file-1');
    const { rerender } = render(<NodeTooltip nodes={mockNodes} />);
    expect(screen.getByText('📄')).toBeInTheDocument();

    // Test class icon
    useCanvasStore.getState().setHighlightedNode('class-1');
    rerender(<NodeTooltip nodes={mockNodes} />);
    expect(screen.getByText('📦')).toBeInTheDocument();

    // Test function icon
    useCanvasStore.getState().setHighlightedNode('function-1');
    rerender(<NodeTooltip nodes={mockNodes} />);
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });
});
