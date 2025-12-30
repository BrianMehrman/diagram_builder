/**
 * Viewpoint Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useViewpointStore } from './store';

describe('useViewpointStore', () => {
  beforeEach(() => {
    useViewpointStore.getState().reset();
  });

  it('initializes with empty viewpoints', () => {
    const { viewpoints, activeViewpointId } = useViewpointStore.getState();

    expect(viewpoints).toEqual([]);
    expect(activeViewpointId).toBeNull();
  });

  it('creates a new viewpoint', () => {
    const data = {
      name: 'Test Viewpoint',
      description: 'Test description',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    };

    const viewpoint = useViewpointStore.getState().createViewpoint(data);

    expect(viewpoint.id).toBeDefined();
    expect(viewpoint.name).toBe('Test Viewpoint');
    expect(viewpoint.description).toBe('Test description');
    expect(viewpoint.cameraPosition).toEqual({ x: 1, y: 2, z: 3 });
    expect(viewpoint.createdAt).toBeDefined();
    expect(viewpoint.updatedAt).toBeDefined();
  });

  it('adds viewpoint to store on creation', () => {
    const data = {
      name: 'Test Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    };

    useViewpointStore.getState().createViewpoint(data);

    const { viewpoints } = useViewpointStore.getState();
    expect(viewpoints).toHaveLength(1);
    expect(viewpoints[0].name).toBe('Test Viewpoint');
  });

  it('deletes a viewpoint', () => {
    const data = {
      name: 'Test Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    };

    const viewpoint = useViewpointStore.getState().createViewpoint(data);
    useViewpointStore.getState().deleteViewpoint(viewpoint.id);

    const { viewpoints } = useViewpointStore.getState();
    expect(viewpoints).toHaveLength(0);
  });

  it('updates a viewpoint', () => {
    const data = {
      name: 'Test Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    };

    const viewpoint = useViewpointStore.getState().createViewpoint(data);
    useViewpointStore.getState().updateViewpoint(viewpoint.id, {
      name: 'Updated Viewpoint',
    });

    const { viewpoints } = useViewpointStore.getState();
    expect(viewpoints[0].name).toBe('Updated Viewpoint');
  });

  it('sets active viewpoint', () => {
    const data = {
      name: 'Test Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    };

    const viewpoint = useViewpointStore.getState().createViewpoint(data);
    useViewpointStore.getState().setActiveViewpoint(viewpoint.id);

    const { activeViewpointId } = useViewpointStore.getState();
    expect(activeViewpointId).toBe(viewpoint.id);
  });

  it('clears active viewpoint when deleted', () => {
    const data = {
      name: 'Test Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    };

    const viewpoint = useViewpointStore.getState().createViewpoint(data);
    useViewpointStore.getState().setActiveViewpoint(viewpoint.id);
    useViewpointStore.getState().deleteViewpoint(viewpoint.id);

    const { activeViewpointId } = useViewpointStore.getState();
    expect(activeViewpointId).toBeNull();
  });

  it('loads viewpoints', () => {
    const viewpoints = [
      {
        id: 'vp-1',
        name: 'Viewpoint 1',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'vp-2',
        name: 'Viewpoint 2',
        cameraPosition: { x: 4, y: 5, z: 6 },
        cameraTarget: { x: 0, y: 0, z: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    useViewpointStore.getState().loadViewpoints(viewpoints);

    const state = useViewpointStore.getState();
    expect(state.viewpoints).toHaveLength(2);
    expect(state.viewpoints[0].name).toBe('Viewpoint 1');
    expect(state.viewpoints[1].name).toBe('Viewpoint 2');
  });

  it('creates viewpoint with filters', () => {
    const data = {
      name: 'Filtered Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
      filters: {
        lodLevel: 2,
        nodeTypes: ['file', 'class'],
      },
    };

    const viewpoint = useViewpointStore.getState().createViewpoint(data);

    expect(viewpoint.filters?.lodLevel).toBe(2);
    expect(viewpoint.filters?.nodeTypes).toEqual(['file', 'class']);
  });

  it('creates viewpoint with annotations', () => {
    const data = {
      name: 'Annotated Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
      annotations: [
        { nodeId: 'node-1', text: 'Important node' },
        { nodeId: 'node-2', text: 'Another note' },
      ],
    };

    const viewpoint = useViewpointStore.getState().createViewpoint(data);

    expect(viewpoint.annotations).toHaveLength(2);
    expect(viewpoint.annotations?.[0].text).toBe('Important node');
  });

  it('resets store', () => {
    const data = {
      name: 'Test Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    };

    const viewpoint = useViewpointStore.getState().createViewpoint(data);
    useViewpointStore.getState().setActiveViewpoint(viewpoint.id);
    useViewpointStore.getState().reset();

    const state = useViewpointStore.getState();
    expect(state.viewpoints).toEqual([]);
    expect(state.activeViewpointId).toBeNull();
  });
});
