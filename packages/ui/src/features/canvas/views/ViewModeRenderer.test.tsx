/**
 * ViewModeRenderer Tests
 *
 * Tests that the correct view component is selected based on viewMode.
 * Uses pure logic tests — validates component selection, not R3F rendering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';
import { selectViewProps } from './ViewModeRenderer';

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
