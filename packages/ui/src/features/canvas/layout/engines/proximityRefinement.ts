import type { GraphEdge } from '../../../../shared/types';
import type { BlockLayout } from '../types';

/**
 * Deterministic hash from sorted node IDs.
 *
 * Uses a simple DJB2-style hash over the concatenated sorted IDs.
 */
export function hashSeed(nodeIds: string[]): number {
  const sorted = [...nodeIds].sort();
  let hash = 5381;
  for (const id of sorted) {
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
    }
  }
  return Math.abs(hash);
}

/**
 * Seeded LCG (Linear Congruential Generator) pseudo-random number generator.
 *
 * Returns a function that produces deterministic values in [0, 1).
 */
export function createSeededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}

/**
 * Force-directed refinement within a district.
 *
 * Attractive force between blocks linked by import edges.
 * Repulsive force prevents overlap between all block pairs.
 * Max 100 iterations. Clamps blocks within arc boundaries.
 *
 * Uses seeded PRNG for initial perturbation to break symmetry deterministically.
 */
export function refineDistrictProximity(
  blocks: BlockLayout[],
  edges: GraphEdge[],
  seed: number,
  maxIterations = 100,
): BlockLayout[] {
  if (blocks.length <= 1) return blocks;

  // Build adjacency set from edges
  const blockIds = new Set(blocks.map((b) => b.fileId));
  const adjacency = new Map<string, Set<string>>();
  for (const b of blocks) {
    adjacency.set(b.fileId, new Set());
  }

  for (const edge of edges) {
    if (edge.type === 'imports' || edge.type === 'depends_on') {
      if (blockIds.has(edge.source) && blockIds.has(edge.target)) {
        adjacency.get(edge.source)!.add(edge.target);
        adjacency.get(edge.target)!.add(edge.source);
      }
    }
  }

  // Clone blocks for mutation
  const refined = blocks.map((b) => ({
    ...b,
    position: { ...b.position },
  }));

  // Add small seeded perturbation to break symmetry
  const rng = createSeededRng(seed);
  for (const block of refined) {
    block.position.x += (rng() - 0.5) * 0.1;
    block.position.z += (rng() - 0.5) * 0.1;
  }

  // Compute bounding circle from original positions
  let cx = 0;
  let cz = 0;
  for (const b of blocks) {
    cx += b.position.x;
    cz += b.position.z;
  }
  cx /= blocks.length;
  cz /= blocks.length;

  let maxDist = 0;
  for (const b of blocks) {
    const d = Math.sqrt((b.position.x - cx) ** 2 + (b.position.z - cz) ** 2);
    maxDist = Math.max(maxDist, d);
  }
  const boundaryRadius = Math.max(maxDist * 1.5, 10);

  const attractionStrength = 0.01;
  const repulsionStrength = 2.0;
  const damping = 0.9;

  for (let iter = 0; iter < maxIterations; iter++) {
    const forces = refined.map(() => ({ fx: 0, fz: 0 }));

    // Repulsive forces between all pairs
    for (let i = 0; i < refined.length; i++) {
      for (let j = i + 1; j < refined.length; j++) {
        const a = refined[i]!;
        const b = refined[j]!;
        const dx = a.position.x - b.position.x;
        const dz = a.position.z - b.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz) + 0.01;

        const minDist = (a.footprint.width + b.footprint.width) / 2;
        if (dist < minDist) {
          const force = repulsionStrength * (minDist - dist) / dist;
          const fx = dx * force;
          const fz = dz * force;
          forces[i]!.fx += fx;
          forces[i]!.fz += fz;
          forces[j]!.fx -= fx;
          forces[j]!.fz -= fz;
        }
      }
    }

    // Attractive forces along edges
    for (let i = 0; i < refined.length; i++) {
      const a = refined[i]!;
      const neighbors = adjacency.get(a.fileId);
      if (!neighbors) continue;

      for (let j = i + 1; j < refined.length; j++) {
        const b = refined[j]!;
        if (!neighbors.has(b.fileId)) continue;

        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;

        const fx = dx * attractionStrength;
        const fz = dz * attractionStrength;
        forces[i]!.fx += fx;
        forces[i]!.fz += fz;
        forces[j]!.fx -= fx;
        forces[j]!.fz -= fz;
      }
    }

    // Apply forces with damping and clamp within boundary
    let totalMovement = 0;
    for (let i = 0; i < refined.length; i++) {
      const block = refined[i]!;
      const f = forces[i]!;

      block.position.x += f.fx * damping;
      block.position.z += f.fz * damping;

      totalMovement += Math.abs(f.fx * damping) + Math.abs(f.fz * damping);

      // Clamp within bounding circle
      const dx = block.position.x - cx;
      const dz = block.position.z - cz;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d > boundaryRadius) {
        block.position.x = cx + (dx / d) * boundaryRadius;
        block.position.z = cz + (dz / d) * boundaryRadius;
      }
    }

    // Early exit if converged
    if (totalMovement < 0.001) break;
  }

  return refined;
}
