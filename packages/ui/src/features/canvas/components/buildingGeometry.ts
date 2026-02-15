/**
 * Building Geometry Factory
 *
 * Pure utility that maps GraphNode types to geometry and material
 * configurations. Components consume these descriptions to create
 * actual Three.js geometry (story 9-9).
 */

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
  BUILDING_WIDTH,
  BUILDING_DEPTH,
  getMethodBasedHeight,
  getEncodedHeight,
  getBuildingHeight,
} from '../views/cityViewUtils';
import type { EncodedHeightOptions } from '../views/cityViewUtils';
import { getMethodCount } from './buildings/floorBandUtils';

/**
 * Geometry shape types for Three.js
 */
export type GeometryShape = 'box' | 'cylinder' | 'cone' | 'sphere' | 'hexagonal' | 'octagonal';

/**
 * Describes the geometry dimensions for a building.
 */
export interface GeometryConfig {
  shape: GeometryShape;
  width: number;
  height: number;
  depth: number;
}

/**
 * Describes the material appearance for a building.
 */
export interface MaterialConfig {
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  roughness: number;
  metalness: number;
  dashed: boolean;
}

/**
 * Combined building configuration returned by the factory.
 */
export interface BuildingConfig {
  geometry: GeometryConfig;
  material: MaterialConfig;
}

/**
 * Returns geometry and material configuration for a given node type.
 *
 * When `encodingOptions` is provided, height is calculated using the
 * specified encoding metric instead of the default methodCount.
 */
export function getBuildingConfig(
  node: GraphNode,
  encodingOptions?: EncodedHeightOptions,
): BuildingConfig {
  const resolvedMethodCount = getMethodCount(node);
  const classHeight = encodingOptions
    ? getEncodedHeight(node, encodingOptions, resolvedMethodCount)
    : getMethodBasedHeight(resolvedMethodCount || undefined, node.depth);

  switch (node.type) {
    case 'class':
      return {
        geometry: {
          shape: 'box',
          width: CLASS_WIDTH,
          height: classHeight,
          depth: CLASS_DEPTH,
        },
        material: {
          opacity: 1,
          transparent: false,
          wireframe: false,
          roughness: 0.7,
          metalness: 0.1,
          dashed: false,
        },
      };

    case 'function':
      return {
        geometry: {
          shape: 'cylinder',
          width: SHOP_WIDTH,
          height: FLOOR_HEIGHT,
          depth: SHOP_DEPTH,
        },
        material: {
          opacity: 1,
          transparent: false,
          wireframe: false,
          roughness: 0.6,
          metalness: 0.15,
          dashed: false,
        },
      };

    case 'variable':
      return {
        geometry: {
          shape: 'sphere',
          width: CRATE_SIZE,
          height: CRATE_SIZE,
          depth: CRATE_SIZE,
        },
        material: {
          opacity: 1,
          transparent: false,
          wireframe: false,
          roughness: 0.9,
          metalness: 0.0,
          dashed: false,
        },
      };

    case 'interface':
      return {
        geometry: {
          shape: 'octagonal',
          width: CLASS_WIDTH,
          height: classHeight,
          depth: CLASS_DEPTH,
        },
        material: {
          opacity: GLASS_OPACITY,
          transparent: true,
          wireframe: true,
          roughness: 0.2,
          metalness: 0.6,
          dashed: false,
        },
      };

    case 'abstract_class':
      return {
        geometry: {
          shape: 'cone',
          width: CLASS_WIDTH,
          height: classHeight,
          depth: CLASS_DEPTH,
        },
        material: {
          opacity: ABSTRACT_OPACITY,
          transparent: true,
          wireframe: false,
          roughness: 0.5,
          metalness: 0.3,
          dashed: true,
        },
      };

    case 'enum':
      return {
        geometry: {
          shape: 'hexagonal',
          width: CRATE_SIZE * 1.5,
          height: CRATE_SIZE * 1.5,
          depth: CRATE_SIZE * 1.5,
        },
        material: {
          opacity: 1,
          transparent: false,
          wireframe: false,
          roughness: 0.4,
          metalness: 0.4,
          dashed: false,
        },
      };

    // file, method, and any unknown types use default
    default:
      return {
        geometry: {
          shape: 'box',
          width: BUILDING_WIDTH,
          height: getBuildingHeight(node.depth),
          depth: BUILDING_DEPTH,
        },
        material: {
          opacity: 1,
          transparent: false,
          wireframe: false,
          roughness: 0.7,
          metalness: 0.1,
          dashed: false,
        },
      };
  }
}
