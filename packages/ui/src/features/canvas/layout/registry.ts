import type { Graph } from '../../../shared/types';
import type { LayoutEngine } from './types';

/**
 * Registry for managing layout engines.
 *
 * Engines are registered by type and can be retrieved by type
 * or auto-selected based on graph characteristics.
 */
export class LayoutRegistry {
  private engines = new Map<string, LayoutEngine>();

  /**
   * Register a layout engine. Overwrites any existing engine with the same type.
   */
  register(engine: LayoutEngine): void {
    this.engines.set(engine.type, engine);
  }

  /**
   * Unregister a layout engine by type.
   */
  unregister(type: string): boolean {
    return this.engines.delete(type);
  }

  /**
   * Get a layout engine by type.
   */
  get(type: string): LayoutEngine | undefined {
    return this.engines.get(type);
  }

  /**
   * Auto-select a layout engine based on graph characteristics.
   * Returns the first engine whose `canHandle` returns true.
   */
  autoSelect(graph: Graph): LayoutEngine | undefined {
    for (const engine of this.engines.values()) {
      if (engine.canHandle(graph)) {
        return engine;
      }
    }
    return undefined;
  }

  /**
   * Get all registered engines.
   */
  getAll(): LayoutEngine[] {
    return Array.from(this.engines.values());
  }

  /**
   * Check if an engine is registered for the given type.
   */
  has(type: string): boolean {
    return this.engines.has(type);
  }

  /**
   * Get the number of registered engines.
   */
  get size(): number {
    return this.engines.size;
  }
}

/** Singleton layout registry instance */
export const layoutRegistry = new LayoutRegistry();
