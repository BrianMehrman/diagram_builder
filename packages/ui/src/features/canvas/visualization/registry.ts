import type { VisualizationRenderer, VisualizationStyle } from './types'

/**
 * Registry for VisualizationRenderer instances.
 * Mirrors LayoutRegistry in layout/registry.ts.
 */
export class RendererRegistry {
  private readonly renderers = new Map<string, VisualizationRenderer>()

  register(renderer: VisualizationRenderer): void {
    this.renderers.set(renderer.type, renderer)
  }

  unregister(type: string): boolean {
    return this.renderers.delete(type)
  }

  get(type: string): VisualizationRenderer | undefined {
    return this.renderers.get(type)
  }

  autoSelect(layoutType: string): VisualizationRenderer | undefined {
    for (const renderer of this.renderers.values()) {
      if (renderer.canRender(layoutType)) return renderer
    }
    return undefined
  }

  getAll(): VisualizationRenderer[] {
    return Array.from(this.renderers.values())
  }

  has(type: string): boolean {
    return this.renderers.has(type)
  }

  get size(): number {
    return this.renderers.size
  }
}

/**
 * Registry for VisualizationStyle instances.
 */
export class VisualizationStyleRegistry {
  private readonly styles = new Map<string, VisualizationStyle>()

  register(style: VisualizationStyle): void {
    this.styles.set(style.id, style)
  }

  unregister(id: string): boolean {
    return this.styles.delete(id)
  }

  get(id: string): VisualizationStyle | undefined {
    return this.styles.get(id)
  }

  getAll(): VisualizationStyle[] {
    return Array.from(this.styles.values())
  }

  has(id: string): boolean {
    return this.styles.has(id)
  }
}

/** Singleton renderer registry */
export const rendererRegistry = new RendererRegistry()

/** Singleton style registry */
export const visualizationStyleRegistry = new VisualizationStyleRegistry()
