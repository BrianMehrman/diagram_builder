/**
 * ViewModeRenderer Tests
 *
 * Tests that the correct view component is selected based on viewMode.
 * Uses pure logic tests — validates component selection, not R3F rendering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';
import { selectViewProps } from './ViewModeRenderer';
import type { Graph } from '../../../shared/types';

const mockGraph: Graph = {
  nodes: [
    { id: 'f1', type: 'file', label: 'index.ts', metadata: {}, lod: 1 },
    { id: 'c1', type: 'class', label: 'App', metadata: {}, lod: 2, parentId: 'f1' },
    { id: 'm1', type: 'method', label: 'render', metadata: {}, lod: 3, parentId: 'c1' },
  ],
  edges: [
    { id: 'e1', source: 'f1', target: 'c1', type: 'contains', metadata: {} },
    { id: 'e2', source: 'c1', target: 'm1', type: 'contains', metadata: {} },
  ],
  metadata: {
    repositoryId: 'repo-1',
    name: 'test-repo',
    totalNodes: 3,
    totalEdges: 2,
  },
};

describe('selectViewProps', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  describe('city mode', () => {
    it('should return view "city" when viewMode is city', () => {
      const result = selectViewProps('city', null);
      expect(result.view).toBe('city');
    });

    it('should not include focusedNodeId for city view', () => {
      const result = selectViewProps('city', null);
      expect(result.focusedNodeId).toBeNull();
    });
  });

  describe('building mode', () => {
    it('should return view "building" when viewMode is building', () => {
      const result = selectViewProps('building', 'f1');
      expect(result.view).toBe('building');
    });

    it('should include focusedNodeId for building view', () => {
      const result = selectViewProps('building', 'f1');
      expect(result.focusedNodeId).toBe('f1');
    });

    it('should fall back to city when no focusedNodeId', () => {
      const result = selectViewProps('building', null);
      expect(result.view).toBe('city');
    });
  });

  describe('cell mode', () => {
    it('should return view "cell" when viewMode is cell', () => {
      const result = selectViewProps('cell', 'c1');
      expect(result.view).toBe('cell');
    });

    it('should include focusedNodeId for cell view', () => {
      const result = selectViewProps('cell', 'c1');
      expect(result.focusedNodeId).toBe('c1');
    });

    it('should fall back to city when no focusedNodeId', () => {
      const result = selectViewProps('cell', null);
      expect(result.view).toBe('city');
    });
  });
});
