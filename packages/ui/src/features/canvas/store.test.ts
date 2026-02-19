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
    expect(state.lodLevel).toBe(1);
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

  // City settings tests
  describe('citySettings', () => {
    describe('default values', () => {
      it('has default heightEncoding of methodCount', () => {
        expect(useCanvasStore.getState().citySettings.heightEncoding).toBe('methodCount');
      });

      it('has default transitMapMode of false', () => {
        expect(useCanvasStore.getState().citySettings.transitMapMode).toBe(false);
      });

      it('has all atmosphereOverlays defaulting to false', () => {
        const { atmosphereOverlays } = useCanvasStore.getState().citySettings;
        expect(atmosphereOverlays.cranes).toBe(false);
        expect(atmosphereOverlays.smog).toBe(false);
        expect(atmosphereOverlays.lighting).toBe(false);
        expect(atmosphereOverlays.deprecated).toBe(false);
      });

      it('has all edgeTierVisibility defaulting to true', () => {
        const { edgeTierVisibility } = useCanvasStore.getState().citySettings;
        expect(edgeTierVisibility.crossDistrict).toBe(true);
        expect(edgeTierVisibility.inheritance).toBe(true);
      });

      it('has default cityVersion of v1', () => {
        expect(useCanvasStore.getState().citySettings.cityVersion).toBe('v1');
      });
    });

    describe('setCityVersion', () => {
      it('sets city version to v2', () => {
        useCanvasStore.getState().setCityVersion('v2');
        expect(useCanvasStore.getState().citySettings.cityVersion).toBe('v2');
      });

      it('sets city version back to v1', () => {
        useCanvasStore.getState().setCityVersion('v2');
        useCanvasStore.getState().setCityVersion('v1');
        expect(useCanvasStore.getState().citySettings.cityVersion).toBe('v1');
      });
    });

    describe('setHeightEncoding', () => {
      it.each(['methodCount', 'dependencies', 'loc', 'complexity', 'churn'] as const)(
        'sets heightEncoding to %s',
        (encoding) => {
          useCanvasStore.getState().setHeightEncoding(encoding);
          expect(useCanvasStore.getState().citySettings.heightEncoding).toBe(encoding);
        }
      );
    });

    describe('toggleTransitMapMode', () => {
      it('toggles transitMapMode from false to true', () => {
        useCanvasStore.getState().toggleTransitMapMode();
        expect(useCanvasStore.getState().citySettings.transitMapMode).toBe(true);
      });

      it('toggles transitMapMode back to false', () => {
        useCanvasStore.getState().toggleTransitMapMode();
        useCanvasStore.getState().toggleTransitMapMode();
        expect(useCanvasStore.getState().citySettings.transitMapMode).toBe(false);
      });
    });

    describe('toggleAtmosphereOverlay', () => {
      it.each(['cranes', 'smog', 'lighting', 'deprecated'] as const)(
        'toggles %s overlay on',
        (key) => {
          useCanvasStore.getState().toggleAtmosphereOverlay(key);
          expect(useCanvasStore.getState().citySettings.atmosphereOverlays[key]).toBe(true);
        }
      );

      it('toggles an overlay off after toggling on', () => {
        useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
        useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
        expect(useCanvasStore.getState().citySettings.atmosphereOverlays.cranes).toBe(false);
      });

      it('does not affect other overlays', () => {
        useCanvasStore.getState().toggleAtmosphereOverlay('smog');
        const { atmosphereOverlays } = useCanvasStore.getState().citySettings;
        expect(atmosphereOverlays.smog).toBe(true);
        expect(atmosphereOverlays.cranes).toBe(false);
        expect(atmosphereOverlays.lighting).toBe(false);
        expect(atmosphereOverlays.deprecated).toBe(false);
      });
    });

    describe('toggleEdgeTierVisibility', () => {
      it.each(['crossDistrict', 'inheritance'] as const)(
        'toggles %s off (default is true)',
        (key) => {
          useCanvasStore.getState().toggleEdgeTierVisibility(key);
          expect(useCanvasStore.getState().citySettings.edgeTierVisibility[key]).toBe(false);
        }
      );

      it('toggles back on after toggling off', () => {
        useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');
        useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');
        expect(useCanvasStore.getState().citySettings.edgeTierVisibility.crossDistrict).toBe(true);
      });

      it('does not affect other edge tiers', () => {
        useCanvasStore.getState().toggleEdgeTierVisibility('inheritance');
        const { edgeTierVisibility } = useCanvasStore.getState().citySettings;
        expect(edgeTierVisibility.inheritance).toBe(false);
        expect(edgeTierVisibility.crossDistrict).toBe(true);
      });
    });

    describe('selector isolation (AC-7)', () => {
      it('changing transitMapMode does not alter layoutPositions reference', () => {
        const positionsBefore = useCanvasStore.getState().layoutPositions;
        useCanvasStore.getState().toggleTransitMapMode();
        const positionsAfter = useCanvasStore.getState().layoutPositions;
        expect(positionsAfter).toBe(positionsBefore);
      });

      it('changing heightEncoding does not alter other citySettings fields', () => {
        useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
        useCanvasStore.getState().setHeightEncoding('loc');
        const { citySettings } = useCanvasStore.getState();
        expect(citySettings.heightEncoding).toBe('loc');
        expect(citySettings.atmosphereOverlays.cranes).toBe(true);
      });
    });

    describe('reset', () => {
      it('resets all citySettings to defaults', () => {
        useCanvasStore.getState().setCityVersion('v2');
        useCanvasStore.getState().setHeightEncoding('complexity');
        useCanvasStore.getState().toggleTransitMapMode();
        useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
        useCanvasStore.getState().toggleAtmosphereOverlay('smog');
        useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');

        useCanvasStore.getState().reset();

        const { citySettings } = useCanvasStore.getState();
        expect(citySettings.cityVersion).toBe('v1');
        expect(citySettings.heightEncoding).toBe('methodCount');
        expect(citySettings.transitMapMode).toBe(false);
        expect(citySettings.atmosphereOverlays).toEqual({
          cranes: false,
          smog: false,
          lighting: false,
          deprecated: false,
        });
        expect(citySettings.edgeTierVisibility).toEqual({
          crossDistrict: true,
          inheritance: true,
        });
      });
    });

    // ── Story 11-10: Underground settings ────────────────────────────
    describe('undergroundVisible (Story 11-10)', () => {
      it('defaults to false', () => {
        expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(false);
      });

      it('toggleUndergroundVisible toggles from false to true', () => {
        useCanvasStore.getState().toggleUndergroundVisible();
        expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(true);
      });

      it('toggleUndergroundVisible toggles back to false', () => {
        useCanvasStore.getState().toggleUndergroundVisible();
        useCanvasStore.getState().toggleUndergroundVisible();
        expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(false);
      });

      it('does not affect other citySettings fields', () => {
        useCanvasStore.getState().setCityVersion('v2');
        useCanvasStore.getState().toggleUndergroundVisible();
        const { citySettings } = useCanvasStore.getState();
        expect(citySettings.undergroundVisible).toBe(true);
        expect(citySettings.cityVersion).toBe('v2');
        expect(citySettings.externalPipesVisible).toBe(false);
      });

      it('resets to false on reset()', () => {
        useCanvasStore.getState().toggleUndergroundVisible();
        useCanvasStore.getState().reset();
        expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(false);
      });
    });

    describe('externalPipesVisible (Story 11-10)', () => {
      it('defaults to false', () => {
        expect(useCanvasStore.getState().citySettings.externalPipesVisible).toBe(false);
      });

      it('toggleExternalPipes toggles from false to true', () => {
        useCanvasStore.getState().toggleExternalPipes();
        expect(useCanvasStore.getState().citySettings.externalPipesVisible).toBe(true);
      });

      it('toggleExternalPipes toggles back to false', () => {
        useCanvasStore.getState().toggleExternalPipes();
        useCanvasStore.getState().toggleExternalPipes();
        expect(useCanvasStore.getState().citySettings.externalPipesVisible).toBe(false);
      });

      it('does not affect undergroundVisible', () => {
        useCanvasStore.getState().toggleExternalPipes();
        expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(false);
      });

      it('resets to false on reset()', () => {
        useCanvasStore.getState().toggleExternalPipes();
        useCanvasStore.getState().reset();
        expect(useCanvasStore.getState().citySettings.externalPipesVisible).toBe(false);
      });
    });
  });
});
