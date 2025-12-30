/**
 * Breadcrumbs Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs } from './Breadcrumbs';
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
];

describe('Breadcrumbs', () => {
  it('renders null when no node is selected', () => {
    const { container } = render(
      <Breadcrumbs
        selectedNode={null}
        nodes={mockNodes}
        onNodeClick={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders home icon', () => {
    const file = mockNodes[0];
    render(
      <Breadcrumbs
        selectedNode={file}
        nodes={mockNodes}
        onNodeClick={vi.fn()}
      />
    );

    const homeIcon = screen.getByRole('button').parentElement?.querySelector('svg');
    expect(homeIcon).toBeDefined();
  });

  it('shows single breadcrumb for file node', () => {
    const file = mockNodes[0];
    render(
      <Breadcrumbs
        selectedNode={file}
        nodes={mockNodes}
        onNodeClick={vi.fn()}
      />
    );

    expect(screen.getByText('app.ts')).toBeDefined();
  });

  it('shows file > class path for class node', () => {
    const classNode = mockNodes[1];
    render(
      <Breadcrumbs
        selectedNode={classNode}
        nodes={mockNodes}
        onNodeClick={vi.fn()}
      />
    );

    expect(screen.getByText('app.ts')).toBeDefined();
    expect(screen.getByText('Application')).toBeDefined();
  });

  it('shows file > class > method path for method node', () => {
    const method = mockNodes[2];
    render(
      <Breadcrumbs
        selectedNode={method}
        nodes={mockNodes}
        onNodeClick={vi.fn()}
      />
    );

    expect(screen.getByText('app.ts')).toBeDefined();
    expect(screen.getByText('Application')).toBeDefined();
    expect(screen.getByText('initialize')).toBeDefined();
  });

  it('shows separators between breadcrumb items', () => {
    const method = mockNodes[2];
    const { container } = render(
      <Breadcrumbs
        selectedNode={method}
        nodes={mockNodes}
        onNodeClick={vi.fn()}
      />
    );

    // Count arrow SVG separators
    const arrows = container.querySelectorAll('svg path[d*="M9 5l7 7-7 7"]');
    expect(arrows.length).toBe(2); // Two separators for file > class > method
  });

  it('calls onNodeClick when breadcrumb is clicked', async () => {
    const user = userEvent.setup();
    const onNodeClick = vi.fn();
    const method = mockNodes[2];

    render(
      <Breadcrumbs
        selectedNode={method}
        nodes={mockNodes}
        onNodeClick={onNodeClick}
      />
    );

    const fileButton = screen.getByText('app.ts');
    await user.click(fileButton);

    expect(onNodeClick).toHaveBeenCalledWith('file-1');
  });

  it('last breadcrumb item has different styling', () => {
    const method = mockNodes[2];
    render(
      <Breadcrumbs
        selectedNode={method}
        nodes={mockNodes}
        onNodeClick={vi.fn()}
      />
    );

    const lastButton = screen.getByText('initialize');
    expect(lastButton.className).toContain('text-gray-900');
    expect(lastButton.className).toContain('cursor-default');
  });

  it('non-last breadcrumb items are clickable', () => {
    const method = mockNodes[2];
    render(
      <Breadcrumbs
        selectedNode={method}
        nodes={mockNodes}
        onNodeClick={vi.fn()}
      />
    );

    const fileButton = screen.getByText('app.ts');
    expect(fileButton.className).toContain('text-primary-600');
    expect(fileButton.className).toContain('hover:text-primary-700');
  });

  it('handles method without class gracefully', () => {
    const orphanMethod: GraphNode = {
      id: 'method-orphan',
      type: 'method',
      label: 'orphan',
      metadata: { file: 'file-1' },
      position: { x: 2, y: 2, z: 2 },
      lodLevel: 2,
    };

    render(
      <Breadcrumbs
        selectedNode={orphanMethod}
        nodes={[...mockNodes, orphanMethod]}
        onNodeClick={vi.fn()}
      />
    );

    // Should show file > method (no class)
    expect(screen.getByText('app.ts')).toBeDefined();
    expect(screen.getByText('orphan')).toBeDefined();
    expect(screen.queryByText('Application')).toBeNull();
  });

  it('handles class without file gracefully', () => {
    const orphanClass: GraphNode = {
      id: 'class-orphan',
      type: 'class',
      label: 'OrphanClass',
      metadata: {},
      position: { x: 3, y: 3, z: 3 },
      lodLevel: 1,
    };

    render(
      <Breadcrumbs
        selectedNode={orphanClass}
        nodes={[...mockNodes, orphanClass]}
        onNodeClick={vi.fn()}
      />
    );

    // Should show only class
    expect(screen.getByText('OrphanClass')).toBeDefined();
    expect(screen.queryByText('app.ts')).toBeNull();
  });
});
