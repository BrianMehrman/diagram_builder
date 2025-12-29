/**
 * Force-Directed Layout Tests
 */

import { describe, it, expect } from 'vitest';
import {
  initializeLayoutState,
  layoutIteration,
  forceDirectedLayout,
  applyLayoutToGraph,
  layoutGraph,
} from './forceDirected.js';
import { buildGraph } from '../ivm/builder.js';
import type { IVMGraph } from '../ivm/types.js';

describe('Force-Directed Layout', () => {
  // Helper to create a simple test graph
  function createTestGraph(): IVMGraph {
    return buildGraph({
      nodes: [
        { id: 'n1', type: 'file', metadata: { label: 'a', path: '/a' } },
        { id: 'n2', type: 'file', metadata: { label: 'b', path: '/b' } },
        { id: 'n3', type: 'file', metadata: { label: 'c', path: '/c' } },
      ],
      edges: [
        { source: 'n1', target: 'n2', type: 'imports' },
        { source: 'n2', target: 'n3', type: 'imports' },
      ],
      metadata: { name: 'test', rootPath: '/' },
    });
  }

  describe('initializeLayoutState', () => {
    it('should create layout state from graph', () => {
      const graph = createTestGraph();
      const state = initializeLayoutState(graph);

      expect(state.nodes.size).toBe(3);
      expect(state.edges.length).toBe(2);
      expect(state.iteration).toBe(0);
      expect(state.stabilized).toBe(false);
    });

    it('should initialize nodes with zero velocity', () => {
      const graph = createTestGraph();
      const state = initializeLayoutState(graph);

      for (const node of state.nodes.values()) {
        expect(node.velocity).toEqual({ vx: 0, vy: 0, vz: 0 });
        expect(node.force).toEqual({ fx: 0, fy: 0, fz: 0 });
      }
    });

    it('should copy initial positions from graph', () => {
      const graph = createTestGraph();
      const state = initializeLayoutState(graph);

      for (const graphNode of graph.nodes) {
        const layoutNode = state.nodes.get(graphNode.id);
        expect(layoutNode).toBeDefined();
        expect(layoutNode?.position.x).toBe(graphNode.position.x);
        expect(layoutNode?.position.y).toBe(graphNode.position.y);
        expect(layoutNode?.position.z).toBe(graphNode.position.z);
      }
    });
  });

  describe('layoutIteration', () => {
    it('should increment iteration counter', () => {
      const graph = createTestGraph();
      const state = initializeLayoutState(graph);

      layoutIteration(state, {
        repulsionStrength: 1000,
        attractionStrength: 0.1,
        linkDistance: 100,
        damping: 0.9,
        minVelocity: 0.1,
        maxIterations: 100,
        timeStep: 0.1,
        centerGravity: 0.01,
        enable3D: true,
        theta: 0.8,
      });

      expect(state.iteration).toBe(1);
    });

    it('should apply forces and update positions', () => {
      const graph = createTestGraph();
      const state = initializeLayoutState(graph);

      // Get initial positions
      const initialPositions = new Map<string, { x: number; y: number; z: number }>();
      for (const [id, node] of state.nodes) {
        initialPositions.set(id, { ...node.position });
      }

      // Run several iterations
      for (let i = 0; i < 10; i++) {
        layoutIteration(state, {
          repulsionStrength: 1000,
          attractionStrength: 0.1,
          linkDistance: 100,
          damping: 0.9,
          minVelocity: 0.001,
          maxIterations: 100,
          timeStep: 0.1,
          centerGravity: 0.01,
          enable3D: true,
          theta: 0.8,
        });
      }

      // At least some positions should have changed
      let positionsChanged = false;
      for (const [id, node] of state.nodes) {
        const initial = initialPositions.get(id);
        if (
          initial &&
          (node.position.x !== initial.x ||
            node.position.y !== initial.y ||
            node.position.z !== initial.z)
        ) {
          positionsChanged = true;
          break;
        }
      }

      expect(positionsChanged).toBe(true);
    });

    it('should calculate energy', () => {
      const graph = createTestGraph();
      const state = initializeLayoutState(graph);

      layoutIteration(state, {
        repulsionStrength: 1000,
        attractionStrength: 0.1,
        linkDistance: 100,
        damping: 0.9,
        minVelocity: 0.1,
        maxIterations: 100,
        timeStep: 0.1,
        centerGravity: 0.01,
        enable3D: true,
        theta: 0.8,
      });

      expect(typeof state.energy).toBe('number');
      expect(state.energy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('forceDirectedLayout', () => {
    it('should return layout result', () => {
      const graph = createTestGraph();
      const result = forceDirectedLayout(graph, { maxIterations: 50 });

      expect(result.positions.size).toBe(3);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.iterations).toBeLessThanOrEqual(50);
      expect(typeof result.energy).toBe('number');
      expect(typeof result.duration).toBe('number');
      expect(result.bounds).toBeDefined();
    });

    it('should converge with default settings', () => {
      const graph = createTestGraph();
      const result = forceDirectedLayout(graph, {
        maxIterations: 500,
        minVelocity: 0.5,
      });

      // Should either converge or hit max iterations
      expect(result.converged || result.iterations === 500).toBe(true);
    });

    it('should call progress callback', () => {
      const graph = createTestGraph();
      const progressCalls: number[] = [];

      forceDirectedLayout(graph, { maxIterations: 50 }, (progress) => {
        progressCalls.push(progress.iteration);
      });

      // Progress is called every 10 iterations
      expect(progressCalls.length).toBeGreaterThan(0);
    });

    it('should respect 2D mode', () => {
      const graph = createTestGraph();
      
      // Get initial z positions
      const initialZ = new Map<string, number>();
      for (const node of graph.nodes) {
        initialZ.set(node.id, node.position.z);
      }
      
      const result = forceDirectedLayout(graph, {
        enable3D: false,
        maxIterations: 50,
      });

      // All z positions should remain at their initial values
      for (const [id, position] of result.positions) {
        expect(position.z).toBe(initialZ.get(id));
      }
    });
  });

  describe('applyLayoutToGraph', () => {
    it('should apply positions to graph nodes', () => {
      const graph = createTestGraph();
      const positions = new Map([
        ['n1', { x: 100, y: 200, z: 300 }],
        ['n2', { x: 400, y: 500, z: 600 }],
        ['n3', { x: 700, y: 800, z: 900 }],
      ]);

      const updatedGraph = applyLayoutToGraph(graph, positions);

      const n1 = updatedGraph.nodes.find((n) => n.id === 'n1');
      const n2 = updatedGraph.nodes.find((n) => n.id === 'n2');
      const n3 = updatedGraph.nodes.find((n) => n.id === 'n3');

      expect(n1?.position).toEqual({ x: 100, y: 200, z: 300 });
      expect(n2?.position).toEqual({ x: 400, y: 500, z: 600 });
      expect(n3?.position).toEqual({ x: 700, y: 800, z: 900 });
    });

    it('should update bounds', () => {
      const graph = createTestGraph();
      const positions = new Map([
        ['n1', { x: -100, y: -100, z: -100 }],
        ['n2', { x: 0, y: 0, z: 0 }],
        ['n3', { x: 100, y: 100, z: 100 }],
      ]);

      const updatedGraph = applyLayoutToGraph(graph, positions);

      expect(updatedGraph.bounds.min).toEqual({ x: -100, y: -100, z: -100 });
      expect(updatedGraph.bounds.max).toEqual({ x: 100, y: 100, z: 100 });
    });

    it('should preserve nodes without new positions', () => {
      const graph = createTestGraph();
      const positions = new Map([['n1', { x: 100, y: 200, z: 300 }]]);

      const updatedGraph = applyLayoutToGraph(graph, positions);

      const n1 = updatedGraph.nodes.find((n) => n.id === 'n1');
      const n2 = updatedGraph.nodes.find((n) => n.id === 'n2');

      expect(n1?.position).toEqual({ x: 100, y: 200, z: 300 });
      // n2 should keep its original position
      const originalN2 = graph.nodes.find((n) => n.id === 'n2');
      expect(n2?.position).toEqual(originalN2?.position);
    });
  });

  describe('layoutGraph', () => {
    it('should return both graph and result', () => {
      const graph = createTestGraph();
      const { graph: layoutedGraph, result } = layoutGraph(graph, { maxIterations: 20 });

      expect(layoutedGraph.nodes.length).toBe(3);
      expect(result.positions.size).toBe(3);
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should spread nodes apart', () => {
      const graph = createTestGraph();
      const { graph: layoutedGraph } = layoutGraph(graph, { maxIterations: 100 });

      // Calculate average distance between nodes
      const nodes = layoutedGraph.nodes;
      let totalDistance = 0;
      let count = 0;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          if (!n1 || !n2) continue;
          const dx = n2.position.x - n1.position.x;
          const dy = n2.position.y - n1.position.y;
          const dz = n2.position.z - n1.position.z;
          totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
          count++;
        }
      }

      const avgDistance = totalDistance / count;
      // Nodes should be spread apart (average distance > 10)
      expect(avgDistance).toBeGreaterThan(10);
    });
  });
});
