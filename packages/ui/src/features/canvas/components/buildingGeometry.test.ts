/**
 * Building Geometry Factory Tests
 */

import { describe, it, expect } from 'vitest';
import { getBuildingConfig } from './buildingGeometry';
import type { GraphNode } from '../../../shared/types';
import {
  CLASS_WIDTH,
  CLASS_DEPTH,
  SHOP_WIDTH,
  SHOP_DEPTH,
  CRATE_SIZE,
  FLOOR_HEIGHT,
  GLASS_OPACITY,
  ABSTRACT_OPACITY,
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

    it('scales height by methodCount (log scale)', () => {
      const config = getBuildingConfig(makeNode({ type: 'class', methodCount: 5 }));
      expect(config.geometry.height).toBeCloseTo(Math.log2(6) * FLOOR_HEIGHT);
    });

    it('falls back to depth-based height when methodCount missing', () => {
      const config = getBuildingConfig(makeNode({ type: 'class', depth: 2 }));
      expect(config.geometry.height).toBe(3 * FLOOR_HEIGHT); // (depth + 1) * FLOOR_HEIGHT
    });
  });

  describe('function', () => {
    it('returns single-story cylinder shop', () => {
      const config = getBuildingConfig(makeNode({ type: 'function' }));
      expect(config.geometry.shape).toBe('cylinder');
      expect(config.geometry.width).toBe(SHOP_WIDTH);
      expect(config.geometry.depth).toBe(SHOP_DEPTH);
      expect(config.geometry.height).toBe(FLOOR_HEIGHT);
      expect(config.material.opacity).toBe(1);
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

    it('scales height by methodCount (log scale)', () => {
      const config = getBuildingConfig(makeNode({ type: 'interface', methodCount: 3 }));
      expect(config.geometry.height).toBeCloseTo(Math.log2(4) * FLOOR_HEIGHT);
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
