/**
 * MiniMap Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MiniMap } from './MiniMap';
import { useCanvasStore } from '../canvas/store';
import type { GraphNode } from '../../shared/types';

// Mock useCameraFlight
const mockFlyToNode = vi.fn();
const mockCancelFlight = vi.fn();
vi.mock('../navigation/useCameraFlight', () => ({
  useCameraFlight: () => ({
    flyToNode: mockFlyToNode,
    cancelFlight: mockCancelFlight,
    isFlying: false,
  }),
}));

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
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useCanvasStore.getState().reset();
    mockFlyToNode.mockClear();
    mockCancelFlight.mockClear();
    localStorage.clear();
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

  // Task 1: Click-to-jump tests
  describe('click-to-jump', () => {
    it('triggers flyToNode when a node is clicked in tree view', () => {
      render(<MiniMap nodes={mockNodes} />);

      // Click on the file node in tree view
      const fileNode = screen.getByText('app.ts');
      fireEvent.click(fileNode);

      expect(mockFlyToNode).toHaveBeenCalledWith('file-1', { x: 0, y: 0, z: 0 });
    });

    it('does not call instant setCamera when clicking a node', () => {
      const setCameraSpy = vi.fn();
      useCanvasStore.setState({ setCamera: setCameraSpy });

      render(<MiniMap nodes={mockNodes} />);

      const fileNode = screen.getByText('app.ts');
      fireEvent.click(fileNode);

      // Should NOT call setCamera directly - flight handles it
      expect(setCameraSpy).not.toHaveBeenCalled();
    });

    it('handles nodes without position gracefully', () => {
      const nodesWithoutPos: GraphNode[] = [
        {
          id: 'no-pos',
          type: 'file',
          label: 'nopos.ts',
          metadata: {},
          lodLevel: 0,
        },
      ];

      render(<MiniMap nodes={nodesWithoutPos} />);

      const node = screen.getByText('nopos.ts');
      fireEvent.click(node);

      // Should select node but not fly (no position)
      expect(mockFlyToNode).not.toHaveBeenCalled();
      expect(useCanvasStore.getState().selectedNodeId).toBe('no-pos');
    });
  });

  // Task 3: Collapse/expand tests
  describe('collapse/expand', () => {
    it('renders collapse button', () => {
      render(<MiniMap nodes={mockNodes} />);

      const collapseBtn = screen.getByRole('button', { name: /collapse/i });
      expect(collapseBtn).toBeDefined();
    });

    it('toggles collapsed state on button click', () => {
      render(<MiniMap nodes={mockNodes} />);

      const collapseBtn = screen.getByRole('button', { name: /collapse/i });
      fireEvent.click(collapseBtn);

      // After collapsing, button should indicate expand
      const expandBtn = screen.getByRole('button', { name: /expand/i });
      expect(expandBtn).toBeDefined();
    });

    it('collapse button has aria-expanded attribute', () => {
      render(<MiniMap nodes={mockNodes} />);

      const collapseBtn = screen.getByRole('button', { name: /collapse/i });
      expect(collapseBtn.getAttribute('aria-expanded')).toBe('true');

      fireEvent.click(collapseBtn);

      const expandBtn = screen.getByRole('button', { name: /expand/i });
      expect(expandBtn.getAttribute('aria-expanded')).toBe('false');
    });

    it('persists collapsed state to localStorage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      render(<MiniMap nodes={mockNodes} />);

      const collapseBtn = screen.getByRole('button', { name: /collapse/i });
      fireEvent.click(collapseBtn);

      expect(setItemSpy).toHaveBeenCalledWith('minimap-collapsed', 'true');
      setItemSpy.mockRestore();
    });

    it('reads collapsed state from localStorage on mount', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('true');

      render(<MiniMap nodes={mockNodes} />);

      // Should render in collapsed state (expand button visible)
      const expandBtn = screen.getByRole('button', { name: /expand/i });
      expect(expandBtn).toBeDefined();

      getItemSpy.mockRestore();
    });
  });

  // Task 1: Accessibility tests (AC-4)
  describe('accessibility', () => {
    it('has role="region" with aria-label', () => {
      render(<MiniMap nodes={mockNodes} />);

      const minimap = screen.getByRole('region', { name: /minimap overview/i });
      expect(minimap).toBeDefined();
    });
  });
});
