/**
 * 3D Coordinate System Utilities
 *
 * Provides functions for coordinate transformations, distance calculations,
 * and spatial operations in 3D space.
 */

import type { Position3D, BoundingBox } from '../ivm/types.js';
import type { SphericalCoords, CylindricalCoords } from './types.js';

// =============================================================================
// Basic Vector Operations
// =============================================================================

/**
 * Creates a zero position
 */
export function zero(): Position3D {
  return { x: 0, y: 0, z: 0 };
}

/**
 * Creates a position from components
 */
export function vec3(x: number, y: number, z: number): Position3D {
  return { x, y, z };
}

/**
 * Adds two positions
 */
export function add(a: Position3D, b: Position3D): Position3D {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

/**
 * Subtracts position b from position a
 */
export function subtract(a: Position3D, b: Position3D): Position3D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

/**
 * Multiplies a position by a scalar
 */
export function scale(p: Position3D, scalar: number): Position3D {
  return {
    x: p.x * scalar,
    y: p.y * scalar,
    z: p.z * scalar,
  };
}

/**
 * Divides a position by a scalar
 */
export function divide(p: Position3D, scalar: number): Position3D {
  if (scalar === 0) {
    throw new Error('Cannot divide by zero');
  }
  return {
    x: p.x / scalar,
    y: p.y / scalar,
    z: p.z / scalar,
  };
}

/**
 * Negates a position
 */
export function negate(p: Position3D): Position3D {
  return { x: -p.x, y: -p.y, z: -p.z };
}

/**
 * Calculates the dot product of two positions
 */
export function dot(a: Position3D, b: Position3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Calculates the cross product of two positions
 */
export function cross(a: Position3D, b: Position3D): Position3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Calculates the magnitude (length) of a position vector
 */
export function magnitude(p: Position3D): number {
  return Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
}

/**
 * Calculates the squared magnitude (avoids sqrt for comparisons)
 */
export function magnitudeSquared(p: Position3D): number {
  return p.x * p.x + p.y * p.y + p.z * p.z;
}

/**
 * Normalizes a position to unit length
 */
export function normalize(p: Position3D): Position3D {
  const mag = magnitude(p);
  if (mag === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  return divide(p, mag);
}

/**
 * Calculates the distance between two positions
 */
export function distance(a: Position3D, b: Position3D): number {
  return magnitude(subtract(b, a));
}

/**
 * Calculates the squared distance between two positions
 */
export function distanceSquared(a: Position3D, b: Position3D): number {
  return magnitudeSquared(subtract(b, a));
}

/**
 * Linearly interpolates between two positions
 */
export function lerp(a: Position3D, b: Position3D, t: number): Position3D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Clamps a position to be within a bounding box
 */
export function clamp(p: Position3D, bounds: BoundingBox): Position3D {
  return {
    x: Math.max(bounds.min.x, Math.min(bounds.max.x, p.x)),
    y: Math.max(bounds.min.y, Math.min(bounds.max.y, p.y)),
    z: Math.max(bounds.min.z, Math.min(bounds.max.z, p.z)),
  };
}

/**
 * Checks if a position is inside a bounding box
 */
export function isInsideBounds(p: Position3D, bounds: BoundingBox): boolean {
  return (
    p.x >= bounds.min.x &&
    p.x <= bounds.max.x &&
    p.y >= bounds.min.y &&
    p.y <= bounds.max.y &&
    p.z >= bounds.min.z &&
    p.z <= bounds.max.z
  );
}

// =============================================================================
// Coordinate System Conversions
// =============================================================================

/**
 * Converts Cartesian coordinates to spherical
 */
export function cartesianToSpherical(p: Position3D): SphericalCoords {
  const r = magnitude(p);
  if (r === 0) {
    return { r: 0, theta: 0, phi: 0 };
  }
  return {
    r,
    theta: Math.acos(p.z / r), // polar angle from z-axis
    phi: Math.atan2(p.y, p.x), // azimuthal angle from x-axis
  };
}

/**
 * Converts spherical coordinates to Cartesian
 */
export function sphericalToCartesian(s: SphericalCoords): Position3D {
  const sinTheta = Math.sin(s.theta);
  return {
    x: s.r * sinTheta * Math.cos(s.phi),
    y: s.r * sinTheta * Math.sin(s.phi),
    z: s.r * Math.cos(s.theta),
  };
}

/**
 * Converts Cartesian coordinates to cylindrical
 */
export function cartesianToCylindrical(p: Position3D): CylindricalCoords {
  return {
    r: Math.sqrt(p.x * p.x + p.y * p.y),
    theta: Math.atan2(p.y, p.x),
    z: p.z,
  };
}

/**
 * Converts cylindrical coordinates to Cartesian
 */
export function cylindricalToCartesian(c: CylindricalCoords): Position3D {
  return {
    x: c.r * Math.cos(c.theta),
    y: c.r * Math.sin(c.theta),
    z: c.z,
  };
}

// =============================================================================
// Bounding Box Operations
// =============================================================================

/**
 * Creates an empty bounding box
 */
export function emptyBounds(): BoundingBox {
  return {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
}

/**
 * Creates a bounding box from a single point
 */
export function boundsFromPoint(p: Position3D): BoundingBox {
  return {
    min: { ...p },
    max: { ...p },
  };
}

/**
 * Expands a bounding box to include a point
 */
export function expandBounds(bounds: BoundingBox, p: Position3D): BoundingBox {
  return {
    min: {
      x: Math.min(bounds.min.x, p.x),
      y: Math.min(bounds.min.y, p.y),
      z: Math.min(bounds.min.z, p.z),
    },
    max: {
      x: Math.max(bounds.max.x, p.x),
      y: Math.max(bounds.max.y, p.y),
      z: Math.max(bounds.max.z, p.z),
    },
  };
}

/**
 * Merges two bounding boxes
 */
export function mergeBounds(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    min: {
      x: Math.min(a.min.x, b.min.x),
      y: Math.min(a.min.y, b.min.y),
      z: Math.min(a.min.z, b.min.z),
    },
    max: {
      x: Math.max(a.max.x, b.max.x),
      y: Math.max(a.max.y, b.max.y),
      z: Math.max(a.max.z, b.max.z),
    },
  };
}

/**
 * Calculates the center of a bounding box
 */
export function boundsCenter(bounds: BoundingBox): Position3D {
  return {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  };
}

/**
 * Calculates the size of a bounding box
 */
export function boundsSize(bounds: BoundingBox): Position3D {
  return {
    x: bounds.max.x - bounds.min.x,
    y: bounds.max.y - bounds.min.y,
    z: bounds.max.z - bounds.min.z,
  };
}

/**
 * Calculates the diagonal length of a bounding box
 */
export function boundsDiagonal(bounds: BoundingBox): number {
  return distance(bounds.min, bounds.max);
}

/**
 * Checks if two bounding boxes intersect
 */
export function boundsIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

/**
 * Pads a bounding box by a given amount
 */
export function padBounds(bounds: BoundingBox, padding: number): BoundingBox {
  return {
    min: {
      x: bounds.min.x - padding,
      y: bounds.min.y - padding,
      z: bounds.min.z - padding,
    },
    max: {
      x: bounds.max.x + padding,
      y: bounds.max.y + padding,
      z: bounds.max.z + padding,
    },
  };
}

// =============================================================================
// Angle Utilities
// =============================================================================

/**
 * Converts degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculates the angle between two vectors
 */
export function angleBetween(a: Position3D, b: Position3D): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) {
    return 0;
  }
  const cosAngle = dot(a, b) / (magA * magB);
  // Clamp to handle floating point errors
  return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
}

// =============================================================================
// Random Position Generation
// =============================================================================

/**
 * Generates a random position within bounds
 */
export function randomInBounds(bounds: BoundingBox): Position3D {
  return {
    x: bounds.min.x + Math.random() * (bounds.max.x - bounds.min.x),
    y: bounds.min.y + Math.random() * (bounds.max.y - bounds.min.y),
    z: bounds.min.z + Math.random() * (bounds.max.z - bounds.min.z),
  };
}

/**
 * Generates a random position within a sphere
 */
export function randomInSphere(center: Position3D, radius: number): Position3D {
  // Use rejection sampling for uniform distribution
  let p: Position3D;
  do {
    p = {
      x: (Math.random() * 2 - 1) * radius,
      y: (Math.random() * 2 - 1) * radius,
      z: (Math.random() * 2 - 1) * radius,
    };
  } while (magnitudeSquared(p) > radius * radius);

  return add(center, p);
}

/**
 * Generates a random position on the surface of a sphere
 */
export function randomOnSphere(center: Position3D, radius: number): Position3D {
  // Use spherical coordinates for uniform distribution
  const theta = Math.acos(2 * Math.random() - 1);
  const phi = Math.random() * 2 * Math.PI;

  const point = sphericalToCartesian({ r: radius, theta, phi });
  return add(center, point);
}
