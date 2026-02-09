/**
 * View Mode State Tests
 *
 * Tests for view mode state management added to the canvas store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './store';

describe('view mode state', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  describe('initial state', () => {
    it('should default to city view mode', () => {
      expect(useCanvasStore.getState().viewMode).toBe('city');
    });

    it('should have no focused node', () => {
      expect(useCanvasStore.getState().focusedNodeId).toBeNull();
    });

    it('should have empty focus history', () => {
      expect(useCanvasStore.getState().focusHistory).toEqual([]);
    });
  });

  describe('setViewMode', () => {
    it('should set view mode', () => {
      useCanvasStore.getState().setViewMode('building');
      expect(useCanvasStore.getState().viewMode).toBe('building');
    });

    it('should set view mode with focused node', () => {
      useCanvasStore.getState().setViewMode('building', 'file-1');
      expect(useCanvasStore.getState().viewMode).toBe('building');
      expect(useCanvasStore.getState().focusedNodeId).toBe('file-1');
    });

    it('should clear focused node when not provided', () => {
      useCanvasStore.getState().setViewMode('building', 'file-1');
      useCanvasStore.getState().setViewMode('city');
      expect(useCanvasStore.getState().focusedNodeId).toBeNull();
    });
  });

  describe('enterNode', () => {
    it('should enter building mode for file nodes', () => {
      useCanvasStore.getState().enterNode('file-1', 'file');
      expect(useCanvasStore.getState().viewMode).toBe('building');
      expect(useCanvasStore.getState().focusedNodeId).toBe('file-1');
    });

    it('should enter cell mode for class nodes', () => {
      useCanvasStore.getState().enterNode('class-1', 'class');
      expect(useCanvasStore.getState().viewMode).toBe('cell');
      expect(useCanvasStore.getState().focusedNodeId).toBe('class-1');
    });

    it('should ignore non-enterable node types', () => {
      useCanvasStore.getState().enterNode('method-1', 'method');
      expect(useCanvasStore.getState().viewMode).toBe('city');
      expect(useCanvasStore.getState().focusedNodeId).toBeNull();
    });

    it('should ignore function node types', () => {
      useCanvasStore.getState().enterNode('fn-1', 'function');
      expect(useCanvasStore.getState().viewMode).toBe('city');
    });

    it('should ignore variable node types', () => {
      useCanvasStore.getState().enterNode('var-1', 'variable');
      expect(useCanvasStore.getState().viewMode).toBe('city');
    });

    it('should push current focus to history when entering from building', () => {
      // Enter a file first
      useCanvasStore.getState().enterNode('file-1', 'file');
      expect(useCanvasStore.getState().focusHistory).toEqual([]);

      // Enter a class inside the file
      useCanvasStore.getState().enterNode('class-1', 'class');
      expect(useCanvasStore.getState().focusHistory).toEqual(['file-1']);
      expect(useCanvasStore.getState().focusedNodeId).toBe('class-1');
    });

    it('should not push null to history from city mode', () => {
      useCanvasStore.getState().enterNode('file-1', 'file');
      expect(useCanvasStore.getState().focusHistory).toEqual([]);
    });

    it('should build multi-level history', () => {
      // City → Building
      useCanvasStore.getState().enterNode('file-1', 'file');
      // Building → Cell
      useCanvasStore.getState().enterNode('class-1', 'class');

      expect(useCanvasStore.getState().focusHistory).toEqual(['file-1']);
      expect(useCanvasStore.getState().focusedNodeId).toBe('class-1');
      expect(useCanvasStore.getState().viewMode).toBe('cell');
    });
  });

  describe('exitToParent', () => {
    it('should return to city from building mode', () => {
      useCanvasStore.getState().enterNode('file-1', 'file');
      useCanvasStore.getState().exitToParent();

      expect(useCanvasStore.getState().viewMode).toBe('city');
      expect(useCanvasStore.getState().focusedNodeId).toBeNull();
      expect(useCanvasStore.getState().focusHistory).toEqual([]);
    });

    it('should return to building from cell mode', () => {
      useCanvasStore.getState().enterNode('file-1', 'file');
      useCanvasStore.getState().enterNode('class-1', 'class');
      useCanvasStore.getState().exitToParent();

      expect(useCanvasStore.getState().viewMode).toBe('building');
      expect(useCanvasStore.getState().focusedNodeId).toBe('file-1');
      expect(useCanvasStore.getState().focusHistory).toEqual([]);
    });

    it('should do nothing when already in city mode with no history', () => {
      useCanvasStore.getState().exitToParent();

      expect(useCanvasStore.getState().viewMode).toBe('city');
      expect(useCanvasStore.getState().focusedNodeId).toBeNull();
    });

    it('should pop history stack correctly across multiple exits', () => {
      useCanvasStore.getState().enterNode('file-1', 'file');
      useCanvasStore.getState().enterNode('class-1', 'class');

      // Cell → Building
      useCanvasStore.getState().exitToParent();
      expect(useCanvasStore.getState().viewMode).toBe('building');
      expect(useCanvasStore.getState().focusedNodeId).toBe('file-1');

      // Building → City
      useCanvasStore.getState().exitToParent();
      expect(useCanvasStore.getState().viewMode).toBe('city');
      expect(useCanvasStore.getState().focusedNodeId).toBeNull();
    });
  });

  describe('resetToCity', () => {
    it('should reset to city from building mode', () => {
      useCanvasStore.getState().enterNode('file-1', 'file');
      useCanvasStore.getState().resetToCity();

      expect(useCanvasStore.getState().viewMode).toBe('city');
      expect(useCanvasStore.getState().focusedNodeId).toBeNull();
      expect(useCanvasStore.getState().focusHistory).toEqual([]);
    });

    it('should reset to city from cell mode', () => {
      useCanvasStore.getState().enterNode('file-1', 'file');
      useCanvasStore.getState().enterNode('class-1', 'class');
      useCanvasStore.getState().resetToCity();

      expect(useCanvasStore.getState().viewMode).toBe('city');
      expect(useCanvasStore.getState().focusedNodeId).toBeNull();
      expect(useCanvasStore.getState().focusHistory).toEqual([]);
    });

    it('should be safe to call when already in city mode', () => {
      useCanvasStore.getState().resetToCity();
      expect(useCanvasStore.getState().viewMode).toBe('city');
    });
  });

  describe('reset (full store)', () => {
    it('should reset view mode state on full store reset', () => {
      useCanvasStore.getState().enterNode('file-1', 'file');
      useCanvasStore.getState().enterNode('class-1', 'class');
      useCanvasStore.getState().reset();

      expect(useCanvasStore.getState().viewMode).toBe('city');
      expect(useCanvasStore.getState().focusedNodeId).toBeNull();
      expect(useCanvasStore.getState().focusHistory).toEqual([]);
    });
  });
});
