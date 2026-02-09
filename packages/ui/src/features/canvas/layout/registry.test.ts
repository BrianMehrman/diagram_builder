import { describe, it, expect, beforeEach } from 'vitest';
import type { Graph } from '../../../shared/types';
import type { LayoutEngine, LayoutConfig, LayoutResult } from './types';
import { LayoutRegistry } from './registry';

// Mock graph for testing
const mockGraph: Graph = {
  nodes: [
    { id: '1', type: 'file', label: 'index.ts', metadata: {}, lod: 0 },
  ],
  edges: [],
  metadata: {
    repositoryId: 'test-repo',
    name: 'Test',
    totalNodes: 1,
    totalEdges: 0,
  },
};

// Helper to create a mock engine
function createMockEngine(
  type: string,
  canHandleResult: boolean = true
): LayoutEngine {
  return {
    type,
    layout(_graph: Graph, _config: LayoutConfig): LayoutResult {
      return {
        positions: new Map(),
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
      };
    },
    canHandle(_graph: Graph): boolean {
      return canHandleResult;
    },
  };
}

describe('LayoutRegistry', () => {
  let registry: LayoutRegistry;

  beforeEach(() => {
    registry = new LayoutRegistry();
  });

  describe('register and get', () => {
    it('should register and retrieve an engine by type', () => {
      const engine = createMockEngine('city');
      registry.register(engine);

      const retrieved = registry.get('city');
      expect(retrieved).toBe(engine);
    });

    it('should return undefined for unregistered type', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing engine with same type', () => {
      const engine1 = createMockEngine('city');
      const engine2 = createMockEngine('city');

      registry.register(engine1);
      registry.register(engine2);

      expect(registry.get('city')).toBe(engine2);
      expect(registry.size).toBe(1);
    });
  });

  describe('unregister', () => {
    it('should remove a registered engine', () => {
      registry.register(createMockEngine('city'));
      expect(registry.has('city')).toBe(true);

      const removed = registry.unregister('city');
      expect(removed).toBe(true);
      expect(registry.has('city')).toBe(false);
    });

    it('should return false when unregistering non-existent engine', () => {
      expect(registry.unregister('nonexistent')).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for registered engines', () => {
      registry.register(createMockEngine('building'));
      expect(registry.has('building')).toBe(true);
    });

    it('should return false for unregistered engines', () => {
      expect(registry.has('cell')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all registered engines', () => {
      registry.register(createMockEngine('city'));
      registry.register(createMockEngine('building'));
      registry.register(createMockEngine('cell'));

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all.map(e => e.type).sort()).toEqual(['building', 'cell', 'city']);
    });

    it('should return empty array when no engines registered', () => {
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size).toBe(0);
    });

    it('should track registered engine count', () => {
      registry.register(createMockEngine('city'));
      expect(registry.size).toBe(1);

      registry.register(createMockEngine('building'));
      expect(registry.size).toBe(2);
    });
  });

  describe('autoSelect', () => {
    it('should return the first engine that can handle the graph', () => {
      const noHandle = createMockEngine('city', false);
      const canHandle = createMockEngine('building', true);

      registry.register(noHandle);
      registry.register(canHandle);

      const selected = registry.autoSelect(mockGraph);
      expect(selected).toBe(canHandle);
    });

    it('should return undefined when no engine can handle the graph', () => {
      registry.register(createMockEngine('city', false));
      registry.register(createMockEngine('building', false));

      expect(registry.autoSelect(mockGraph)).toBeUndefined();
    });

    it('should return undefined for empty registry', () => {
      expect(registry.autoSelect(mockGraph)).toBeUndefined();
    });

    it('should return the first matching engine in registration order', () => {
      const engine1 = createMockEngine('city', true);
      const engine2 = createMockEngine('building', true);

      registry.register(engine1);
      registry.register(engine2);

      // First registered engine that canHandle should win
      expect(registry.autoSelect(mockGraph)).toBe(engine1);
    });
  });
});
