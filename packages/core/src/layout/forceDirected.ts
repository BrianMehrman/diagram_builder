/**
 * Force-Directed Layout Algorithm
 *
 * Implements a 3D force-directed graph layout using:
 * - Coulomb's law for node repulsion
 * - Hooke's law for edge attraction
 * - Center gravity to prevent drift
 * - Velocity damping for stabilization
 */

import type { Position3D, IVMGraph, IVMNode, IVMEdge, BoundingBox } from '../ivm/types.js';
import {
  ForceDirectedConfig,
  DEFAULT_FORCE_DIRECTED_CONFIG,
  LayoutNode,
  LayoutEdge,
  LayoutState,
  LayoutResult,
  LayoutProgress,
  LayoutProgressCallback,
  Velocity3D,
  Force3D,
} from './types.js';
import { calculateBounds } from '../ivm/builder.js';

// =============================================================================
// Layout Node Creation
// =============================================================================

/**
 * Creates a layout node from an IVM node
 */
function createLayoutNode(node: IVMNode): LayoutNode {
  return {
    id: node.id,
    position: { ...node.position },
    velocity: { vx: 0, vy: 0, vz: 0 },
    force: { fx: 0, fy: 0, fz: 0 },
    mass: 1,
    fixed: false,
    node,
  };
}

/**
 * Creates a layout edge from an IVM edge
 */
function createLayoutEdge(edge: IVMEdge): LayoutEdge {
  return {
    source: edge.source,
    target: edge.target,
    weight: edge.metadata.weight ?? 1,
    edge,
  };
}

// =============================================================================
// Force Calculations
// =============================================================================

/**
 * Calculates the distance between two positions
 */
function distance(p1: Position3D, p2: Position3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates repulsion force between two nodes (Coulomb's law)
 * F = k * q1 * q2 / r^2
 */
function calculateRepulsion(
  node1: LayoutNode,
  node2: LayoutNode,
  strength: number,
  enable3D: boolean
): Force3D {
  const dx = node1.position.x - node2.position.x;
  const dy = node1.position.y - node2.position.y;
  const dz = enable3D ? node1.position.z - node2.position.z : 0;

  const distSq = dx * dx + dy * dy + dz * dz;
  const dist = Math.sqrt(distSq);

  // Prevent division by zero and extreme forces at very close distances
  const minDist = 1;
  const effectiveDist = Math.max(dist, minDist);
  const effectiveDistSq = effectiveDist * effectiveDist;

  // Coulomb-like repulsion force
  const force = strength / effectiveDistSq;

  // Normalize direction
  const fx = dist > 0 ? (dx / dist) * force : (Math.random() - 0.5) * force;
  const fy = dist > 0 ? (dy / dist) * force : (Math.random() - 0.5) * force;
  const fz = enable3D && dist > 0 ? (dz / dist) * force : 0;

  return { fx, fy, fz };
}

/**
 * Calculates attraction force for an edge (Hooke's law)
 * F = -k * (x - x0)
 */
function calculateAttraction(
  source: LayoutNode,
  target: LayoutNode,
  strength: number,
  idealLength: number,
  weight: number,
  enable3D: boolean
): { sourceForce: Force3D; targetForce: Force3D } {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;
  const dz = enable3D ? target.position.z - source.position.z : 0;

  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Spring force: attraction when stretched, repulsion when compressed
  const displacement = dist - idealLength;
  const force = strength * displacement * weight;

  // Normalize direction
  const fx = dist > 0 ? (dx / dist) * force : 0;
  const fy = dist > 0 ? (dy / dist) * force : 0;
  const fz = enable3D && dist > 0 ? (dz / dist) * force : 0;

  return {
    sourceForce: { fx, fy, fz },
    targetForce: { fx: -fx, fy: -fy, fz: -fz },
  };
}

/**
 * Calculates center gravity force (pulls toward origin)
 */
function calculateCenterGravity(
  node: LayoutNode,
  strength: number,
  center: Position3D,
  enable3D: boolean
): Force3D {
  const dx = center.x - node.position.x;
  const dy = center.y - node.position.y;
  const dz = enable3D ? center.z - node.position.z : 0;

  return {
    fx: dx * strength,
    fy: dy * strength,
    fz: dz * strength,
  };
}

// =============================================================================
// Layout State Management
// =============================================================================

/**
 * Initializes layout state from an IVM graph
 */
export function initializeLayoutState(graph: IVMGraph): LayoutState {
  const nodes = new Map<string, LayoutNode>();
  const edges: LayoutEdge[] = [];

  // Create layout nodes
  for (const node of graph.nodes) {
    nodes.set(node.id, createLayoutNode(node));
  }

  // Create layout edges (only for edges where both nodes exist)
  for (const edge of graph.edges) {
    if (nodes.has(edge.source) && nodes.has(edge.target)) {
      edges.push(createLayoutEdge(edge));
    }
  }

  // Calculate initial energy
  let energy = 0;
  for (const node of nodes.values()) {
    const v = node.velocity;
    energy += v.vx * v.vx + v.vy * v.vy + v.vz * v.vz;
  }

  // Calculate initial bounds
  const positions = [...nodes.values()].map((n) => ({
    ...n.node,
    position: n.position,
  }));
  const bounds = calculateBounds(positions as IVMNode[]);

  return {
    nodes,
    edges,
    iteration: 0,
    energy,
    stabilized: false,
    bounds,
  };
}

/**
 * Resets all forces on nodes
 */
function resetForces(state: LayoutState): void {
  for (const node of state.nodes.values()) {
    node.force = { fx: 0, fy: 0, fz: 0 };
  }
}

/**
 * Applies all forces for one iteration
 */
function applyForces(state: LayoutState, config: ForceDirectedConfig): void {
  const { repulsionStrength, attractionStrength, linkDistance, centerGravity, enable3D } = config;
  const nodes = [...state.nodes.values()];
  const center: Position3D = { x: 0, y: 0, z: 0 };

  // Apply repulsion between all pairs of nodes (O(n^2) - can optimize with Barnes-Hut)
  for (let i = 0; i < nodes.length; i++) {
    const node1 = nodes[i];
    if (!node1 || node1.fixed) continue;

    for (let j = i + 1; j < nodes.length; j++) {
      const node2 = nodes[j];
      if (!node2) continue;

      const repulsion = calculateRepulsion(node1, node2, repulsionStrength, enable3D);

      // Apply equal and opposite forces
      node1.force.fx += repulsion.fx;
      node1.force.fy += repulsion.fy;
      node1.force.fz += repulsion.fz;

      if (!node2.fixed) {
        node2.force.fx -= repulsion.fx;
        node2.force.fy -= repulsion.fy;
        node2.force.fz -= repulsion.fz;
      }
    }

    // Apply center gravity
    const gravity = calculateCenterGravity(node1, centerGravity, center, enable3D);
    node1.force.fx += gravity.fx;
    node1.force.fy += gravity.fy;
    node1.force.fz += gravity.fz;
  }

  // Apply attraction along edges
  for (const edge of state.edges) {
    const source = state.nodes.get(edge.source);
    const target = state.nodes.get(edge.target);
    if (!source || !target) continue;

    const { sourceForce, targetForce } = calculateAttraction(
      source,
      target,
      attractionStrength,
      linkDistance,
      edge.weight,
      enable3D
    );

    if (!source.fixed) {
      source.force.fx += sourceForce.fx;
      source.force.fy += sourceForce.fy;
      source.force.fz += sourceForce.fz;
    }

    if (!target.fixed) {
      target.force.fx += targetForce.fx;
      target.force.fy += targetForce.fy;
      target.force.fz += targetForce.fz;
    }
  }
}

/**
 * Updates node positions based on forces and velocities
 */
function updatePositions(state: LayoutState, config: ForceDirectedConfig): number {
  const { damping, timeStep, enable3D } = config;
  let totalEnergy = 0;

  for (const node of state.nodes.values()) {
    if (node.fixed) continue;

    // Update velocity: v = v * damping + (F / m) * dt
    node.velocity.vx = node.velocity.vx * damping + (node.force.fx / node.mass) * timeStep;
    node.velocity.vy = node.velocity.vy * damping + (node.force.fy / node.mass) * timeStep;
    if (enable3D) {
      node.velocity.vz = node.velocity.vz * damping + (node.force.fz / node.mass) * timeStep;
    }

    // Update position: p = p + v * dt
    node.position.x += node.velocity.vx * timeStep;
    node.position.y += node.velocity.vy * timeStep;
    if (enable3D) {
      node.position.z += node.velocity.vz * timeStep;
    }

    // Calculate kinetic energy
    const energy =
      node.velocity.vx * node.velocity.vx +
      node.velocity.vy * node.velocity.vy +
      node.velocity.vz * node.velocity.vz;
    totalEnergy += energy;
  }

  return totalEnergy;
}

/**
 * Performs one iteration of the layout algorithm
 */
export function layoutIteration(state: LayoutState, config: ForceDirectedConfig): void {
  resetForces(state);
  applyForces(state, config);
  state.energy = updatePositions(state, config);
  state.iteration++;

  // Check for stabilization
  const avgEnergy = state.energy / state.nodes.size;
  state.stabilized = avgEnergy < config.minVelocity * config.minVelocity;
}

// =============================================================================
// Main Layout Function
// =============================================================================

/**
 * Runs the force-directed layout algorithm
 */
export function forceDirectedLayout(
  graph: IVMGraph,
  config: Partial<ForceDirectedConfig> = {},
  onProgress?: LayoutProgressCallback
): LayoutResult {
  const startTime = performance.now();
  const fullConfig: ForceDirectedConfig = { ...DEFAULT_FORCE_DIRECTED_CONFIG, ...config };

  // Initialize state
  const state = initializeLayoutState(graph);

  // Run iterations
  while (state.iteration < fullConfig.maxIterations && !state.stabilized) {
    layoutIteration(state, fullConfig);

    // Report progress
    if (onProgress && state.iteration % 10 === 0) {
      onProgress({
        iteration: state.iteration,
        maxIterations: fullConfig.maxIterations,
        energy: state.energy,
        percent: (state.iteration / fullConfig.maxIterations) * 100,
      });
    }
  }

  // Extract final positions
  const positions = new Map<string, Position3D>();
  for (const [id, node] of state.nodes) {
    positions.set(id, { ...node.position });
  }

  // Calculate final bounds
  const nodePositions = [...state.nodes.values()].map((n) => ({
    ...n.node,
    position: n.position,
  }));
  const bounds = calculateBounds(nodePositions as IVMNode[]);

  const endTime = performance.now();

  return {
    positions,
    iterations: state.iteration,
    energy: state.energy,
    converged: state.stabilized,
    duration: endTime - startTime,
    bounds,
  };
}

/**
 * Applies layout positions back to an IVM graph
 */
export function applyLayoutToGraph(graph: IVMGraph, positions: Map<string, Position3D>): IVMGraph {
  const updatedNodes = graph.nodes.map((node) => {
    const newPosition = positions.get(node.id);
    return newPosition ? { ...node, position: newPosition } : node;
  });

  const bounds = calculateBounds(updatedNodes);

  return {
    ...graph,
    nodes: updatedNodes,
    bounds,
  };
}

/**
 * Runs layout and returns updated graph
 */
export function layoutGraph(
  graph: IVMGraph,
  config: Partial<ForceDirectedConfig> = {},
  onProgress?: LayoutProgressCallback
): { graph: IVMGraph; result: LayoutResult } {
  const result = forceDirectedLayout(graph, config, onProgress);
  const layoutedGraph = applyLayoutToGraph(graph, result.positions);
  return { graph: layoutedGraph, result };
}
