/**
 * Canvas Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './store';

describe('useCanvasStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCanvasStore.getState().reset();
  });

  it('has default camera state', () => {
    const { camera } = useCanvasStore.getState();

    expect(camera.position).toEqual({ x: 0, y: 5, z: 10 });
    expect(camera.target).toEqual({ x: 0, y: 0, z: 0 });
    expect(camera.zoom).toBe(1);
  });

  it('sets camera position', () => {
    const newPosition = { x: 10, y: 10, z: 10 };

    useCanvasStore.getState().setCameraPosition(newPosition);

    expect(useCanvasStore.getState().camera.position).toEqual(newPosition);
  });

  it('sets camera target', () => {
    const newTarget = { x: 5, y: 5, z: 5 };

    useCanvasStore.getState().setCameraTarget(newTarget);

    expect(useCanvasStore.getState().camera.target).toEqual(newTarget);
  });

  it('sets zoom level', () => {
    useCanvasStore.getState().setZoom(2);

    expect(useCanvasStore.getState().camera.zoom).toBe(2);
  });

  it('sets camera state partially', () => {
    useCanvasStore.getState().setCamera({ zoom: 1.5 });

    const { camera } = useCanvasStore.getState();
    expect(camera.zoom).toBe(1.5);
    expect(camera.position).toEqual({ x: 0, y: 5, z: 10 }); // Unchanged
  });

  it('selects a node', () => {
    useCanvasStore.getState().selectNode('node-123');

    expect(useCanvasStore.getState().selectedNodeId).toBe('node-123');
  });

  it('deselects a node', () => {
    useCanvasStore.getState().selectNode('node-123');
    useCanvasStore.getState().selectNode(null);

    expect(useCanvasStore.getState().selectedNodeId).toBeNull();
  });

  it('sets hovered node', () => {
    useCanvasStore.getState().setHoveredNode('node-456');

    expect(useCanvasStore.getState().hoveredNodeId).toBe('node-456');
  });

  it('sets LOD level', () => {
    useCanvasStore.getState().setLodLevel(3);

    expect(useCanvasStore.getState().lodLevel).toBe(3);
  });

  it('resets to default state', () => {
    // Modify state
    useCanvasStore.getState().setCameraPosition({ x: 100, y: 100, z: 100 });
    useCanvasStore.getState().selectNode('node-123');
    useCanvasStore.getState().setLodLevel(5);

    // Reset
    useCanvasStore.getState().reset();

    const state = useCanvasStore.getState();
    expect(state.camera.position).toEqual({ x: 0, y: 5, z: 10 });
    expect(state.selectedNodeId).toBeNull();
    expect(state.lodLevel).toBe(4);
  });

  // Highlighted node state tests
  describe('highlighted node state', () => {
    it('has null highlighted node by default', () => {
      expect(useCanvasStore.getState().highlightedNodeId).toBeNull();
    });

    it('sets highlighted node', () => {
      useCanvasStore.getState().setHighlightedNode('node-789');
      expect(useCanvasStore.getState().highlightedNodeId).toBe('node-789');
    });

    it('clears highlighted node', () => {
      useCanvasStore.getState().setHighlightedNode('node-789');
      useCanvasStore.getState().setHighlightedNode(null);
      expect(useCanvasStore.getState().highlightedNodeId).toBeNull();
    });

    it('resets highlighted node on reset', () => {
      useCanvasStore.getState().setHighlightedNode('node-789');
      useCanvasStore.getState().reset();
      expect(useCanvasStore.getState().highlightedNodeId).toBeNull();
    });
  });

  // Flight state tests
  describe('flight state', () => {
    it('has false isFlying by default', () => {
      expect(useCanvasStore.getState().isFlying).toBe(false);
    });

    it('has null flightTargetNodeId by default', () => {
      expect(useCanvasStore.getState().flightTargetNodeId).toBeNull();
    });

    it('sets flight state', () => {
      useCanvasStore.getState().setFlightState(true, 'target-node');
      expect(useCanvasStore.getState().isFlying).toBe(true);
      expect(useCanvasStore.getState().flightTargetNodeId).toBe('target-node');
    });

    it('clears flight state', () => {
      useCanvasStore.getState().setFlightState(true, 'target-node');
      useCanvasStore.getState().setFlightState(false, null);
      expect(useCanvasStore.getState().isFlying).toBe(false);
      expect(useCanvasStore.getState().flightTargetNodeId).toBeNull();
    });

    it('resets flight state on reset', () => {
      useCanvasStore.getState().setFlightState(true, 'target-node');
      useCanvasStore.getState().reset();
      expect(useCanvasStore.getState().isFlying).toBe(false);
      expect(useCanvasStore.getState().flightTargetNodeId).toBeNull();
    });
  });
});
