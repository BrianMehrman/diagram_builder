/**
 * Building Geometry Factory Tests
 */

import { describe, it, expect } from 'vitest';
import { getBuildingConfig } from './buildingGeometry';
import type { GraphNode } from '../../../shared/types';
import {
  CLASS_WIDTH,
  CLASS_DEPTH,
  KIOSK_WIDTH,
  KIOSK_DEPTH,
  KIOSK_HEIGHT,
  CRATE_SIZE,
  FLOOR_HEIGHT,
  GLASS_OPACITY,
  ABSTRACT_OPACITY,
  METHOD_ROOM_HEIGHT,
  BUILDING_PADDING,
  BASE_CLASS_ROUGHNESS,
  BASE_CLASS_METALNESS,
  BASE_CLASS_FOOTPRINT_MULTIPLIER,
  getContainmentHeight,
} from '../views/cityViewUtils';

function makeNode(overrides: Partial<GraphNode> & { type: GraphNode['type'] }): GraphNode {
  return {
    id: 'test-1',
    label: 'Test',
    metadata: {},
    lod: 1,
    ...overrides,
  };
}

describe('getBuildingConfig', () => {
  describe('class', () => {
    it('returns multi-story building with class dimensions', () => {
      const config = getBuildingConfig(makeNode({ type: 'class' }));
      expect(config.geometry.width).toBe(CLASS_WIDTH);
      expect(config.geometry.depth).toBe(CLASS_DEPTH);
      expect(config.geometry.shape).toBe('box');
      expect(config.material.opacity).toBe(1);
      expect(config.material.wireframe).toBe(false);
    });

    it('uses containment height driven by method count', () => {
      const config = getBuildingConfig(makeNode({ type: 'class', methodCount: 5 }));
      expect(config.geometry.height).toBe(getContainmentHeight(5));
    });

    it('has minimum 1-floor height when methodCount missing', () => {
      const config = getBuildingConfig(makeNode({ type: 'class', depth: 2 }));
      expect(config.geometry.height).toBe(getContainmentHeight(0));
    });

    it('scales footprint with encoding options', () => {
      const node = makeNode({ type: 'class', methodCount: 5, metadata: { loc: 500 } });
      const config = getBuildingConfig(node, { encoding: 'loc' });
      // Height is still containment-driven
      expect(config.geometry.height).toBe(getContainmentHeight(5));
      // Footprint should be scaled up
      expect(config.geometry.width).toBeGreaterThan(CLASS_WIDTH);
      expect(config.geometry.depth).toBeGreaterThan(CLASS_DEPTH);
    });
  });

  describe('function (kiosk — Story 11-12)', () => {
    it('returns compact single-story kiosk box', () => {
      const config = getBuildingConfig(makeNode({ type: 'function' }));
      expect(config.geometry.shape).toBe('box');
      expect(config.geometry.width).toBe(KIOSK_WIDTH);
      expect(config.geometry.depth).toBe(KIOSK_DEPTH);
      expect(config.geometry.height).toBe(KIOSK_HEIGHT);
      expect(config.material.opacity).toBe(1);
    });

    it('kiosk is smaller than a class building footprint', () => {
      const fn = getBuildingConfig(makeNode({ type: 'function' }));
      const cls = getBuildingConfig(makeNode({ type: 'class' }));
      expect(fn.geometry.width).toBeLessThan(cls.geometry.width);
      expect(fn.geometry.depth).toBeLessThan(cls.geometry.depth);
    });

    it('kiosk height is less than one standard floor', () => {
      const config = getBuildingConfig(makeNode({ type: 'function' }));
      expect(config.geometry.height).toBeLessThan(FLOOR_HEIGHT);
    });

    it('kiosk is not transparent and not wireframe', () => {
      const config = getBuildingConfig(makeNode({ type: 'function' }));
      expect(config.material.transparent).toBe(false);
      expect(config.material.wireframe).toBe(false);
      expect(config.material.dashed).toBe(false);
    });

    it('kiosk has distinct roughness/metalness from class building', () => {
      const fn = getBuildingConfig(makeNode({ type: 'function' }));
      const cls = getBuildingConfig(makeNode({ type: 'class' }));
      // Kiosk is lighter/slightly more metallic than default class
      expect(fn.material.roughness).not.toBe(cls.material.roughness);
    });
  });

  describe('variable', () => {
    it('returns small sphere geometry', () => {
      const config = getBuildingConfig(makeNode({ type: 'variable' }));
      expect(config.geometry.shape).toBe('sphere');
      expect(config.geometry.width).toBe(CRATE_SIZE);
      expect(config.geometry.depth).toBe(CRATE_SIZE);
      expect(config.geometry.height).toBe(CRATE_SIZE);
      expect(config.material.roughness).toBe(0.9);
    });
  });

  describe('interface', () => {
    it('returns octagonal glass building with wireframe', () => {
      const config = getBuildingConfig(makeNode({ type: 'interface' }));
      expect(config.geometry.shape).toBe('octagonal');
      expect(config.geometry.width).toBe(CLASS_WIDTH);
      expect(config.material.opacity).toBe(GLASS_OPACITY);
      expect(config.material.transparent).toBe(true);
      expect(config.material.wireframe).toBe(true);
    });

    it('uses containment height driven by method count', () => {
      const config = getBuildingConfig(makeNode({ type: 'interface', methodCount: 3 }));
      expect(config.geometry.height).toBe(getContainmentHeight(3));
    });
  });

  describe('abstract_class', () => {
    it('returns cone with semi-transparent dashed material', () => {
      const config = getBuildingConfig(makeNode({ type: 'abstract_class' }));
      expect(config.geometry.shape).toBe('cone');
      expect(config.material.opacity).toBe(ABSTRACT_OPACITY);
      expect(config.material.transparent).toBe(true);
      expect(config.material.dashed).toBe(true);
      expect(config.material.wireframe).toBe(false);
    });
  });

  describe('enum', () => {
    it('returns hexagonal prism geometry', () => {
      const config = getBuildingConfig(makeNode({ type: 'enum' }));
      expect(config.geometry.shape).toBe('hexagonal');
      expect(config.geometry.width).toBe(CRATE_SIZE * 1.5);
      expect(config.geometry.height).toBe(CRATE_SIZE * 1.5);
      expect(config.material.metalness).toBe(0.4);
    });
  });

  describe('encodingOptions', () => {
    it('class height is containment-driven regardless of encoding', () => {
      const node = makeNode({ type: 'class', methodCount: 5, metadata: { loc: 500 } });
      const config = getBuildingConfig(node, { encoding: 'loc' });
      expect(config.geometry.height).toBe(getContainmentHeight(5));
    });

    it('class footprint scales with encoding metric', () => {
      const node = makeNode({ type: 'class', methodCount: 5 });
      const config = getBuildingConfig(node, { encoding: 'dependencies', incomingEdgeCount: 8 });
      expect(config.geometry.height).toBe(getContainmentHeight(5));
      expect(config.geometry.width).toBeGreaterThan(CLASS_WIDTH);
    });

    it('class footprint is 1x when encoding data is missing', () => {
      const node = makeNode({ type: 'class', methodCount: 5 });
      const config = getBuildingConfig(node, { encoding: 'loc' });
      // loc not in metadata → footprint scale = 1.0
      expect(config.geometry.width).toBe(CLASS_WIDTH);
    });

    it('interface height is containment-driven with encoding', () => {
      const node = makeNode({ type: 'interface', metadata: { complexity: 10 } });
      const config = getBuildingConfig(node, { encoding: 'complexity' });
      expect(config.geometry.height).toBe(getContainmentHeight(0));
      expect(config.geometry.width).toBeGreaterThan(CLASS_WIDTH);
    });

    it('abstract_class height is containment-driven with encoding', () => {
      const node = makeNode({ type: 'abstract_class', metadata: { churn: 15 } });
      const config = getBuildingConfig(node, { encoding: 'churn' });
      expect(config.geometry.height).toBe(getContainmentHeight(0));
      expect(config.geometry.width).toBeGreaterThan(CLASS_WIDTH);
    });

    it('default/file types still use legacy height encoding', () => {
      const node = makeNode({ type: 'file', metadata: { loc: 500 } });
      const config = getBuildingConfig(node, { encoding: 'loc' });
      expect(config.geometry.height).toBeCloseTo(Math.log2(500 / 50 + 1) * FLOOR_HEIGHT);
    });
  });

  describe('base class (isBaseClass=true)', () => {
    it('returns wider footprint than regular class', () => {
      const node = makeNode({ type: 'class' });
      const regular = getBuildingConfig(node);
      const base = getBuildingConfig(node, undefined, true);
      expect(base.geometry.width).toBeCloseTo(regular.geometry.width * BASE_CLASS_FOOTPRINT_MULTIPLIER);
      expect(base.geometry.depth).toBeCloseTo(regular.geometry.depth * BASE_CLASS_FOOTPRINT_MULTIPLIER);
    });

    it('retains same height as regular class (containment-driven)', () => {
      const node = makeNode({ type: 'class', methodCount: 4 });
      const regular = getBuildingConfig(node);
      const base = getBuildingConfig(node, undefined, true);
      expect(base.geometry.height).toBe(regular.geometry.height);
    });

    it('uses stone-like roughness (higher than regular class)', () => {
      const node = makeNode({ type: 'class' });
      const regular = getBuildingConfig(node);
      const base = getBuildingConfig(node, undefined, true);
      expect(base.material.roughness).toBe(BASE_CLASS_ROUGHNESS);
      expect(base.material.roughness).toBeGreaterThan(regular.material.roughness);
    });

    it('uses lower metalness than regular class (matte stone)', () => {
      const node = makeNode({ type: 'class' });
      const regular = getBuildingConfig(node);
      const base = getBuildingConfig(node, undefined, true);
      expect(base.material.metalness).toBe(BASE_CLASS_METALNESS);
      expect(base.material.metalness).toBeLessThan(regular.material.metalness);
    });

    it('is not transparent and not wireframe', () => {
      const config = getBuildingConfig(makeNode({ type: 'class' }), undefined, true);
      expect(config.material.transparent).toBe(false);
      expect(config.material.wireframe).toBe(false);
    });

    it('shape is still box', () => {
      const config = getBuildingConfig(makeNode({ type: 'class' }), undefined, true);
      expect(config.geometry.shape).toBe('box');
    });

    it('base class footprint stacks with encoding footprint scale', () => {
      const node = makeNode({ type: 'class', methodCount: 10, metadata: { loc: 500 } });
      const base = getBuildingConfig(node, { encoding: 'loc' }, true);
      const regular = getBuildingConfig(node, { encoding: 'loc' });
      // Base class width should be larger than the already-scaled regular width
      expect(base.geometry.width).toBeGreaterThan(regular.geometry.width);
    });

    it('isBaseClass=false is identical to isBaseClass=undefined for class', () => {
      const node = makeNode({ type: 'class', methodCount: 3 });
      const undef = getBuildingConfig(node);
      const falsy = getBuildingConfig(node, undefined, false);
      expect(falsy.geometry.width).toBe(undef.geometry.width);
      expect(falsy.material.roughness).toBe(undef.material.roughness);
    });
  });

  describe('default / file', () => {
    it('returns default config for file type', () => {
      const config = getBuildingConfig(makeNode({ type: 'file' }));
      expect(config.geometry.shape).toBe('box');
      expect(config.material.opacity).toBe(1);
      expect(config.material.wireframe).toBe(false);
      expect(config.material.dashed).toBe(false);
    });

    it('returns default config for method type', () => {
      const config = getBuildingConfig(makeNode({ type: 'method' }));
      expect(config.geometry.shape).toBe('box');
      expect(config.material.opacity).toBe(1);
    });
  });
});
