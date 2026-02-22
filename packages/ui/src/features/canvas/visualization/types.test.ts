import { describe, it, expect } from 'vitest';
import type { VisualizationRenderer, RenderContext, VisualizationStyle } from './types';
import type { Graph } from '../../../shared/types';
import type { LayoutEngine, LayoutResult } from '../layout/types';

describe('VisualizationRenderer contract', () => {
  it('can implement VisualizationRenderer with required methods', () => {
    const stubRenderer: VisualizationRenderer = {
      type: 'stub',
      render: (_ctx: RenderContext) => null as unknown as React.JSX.Element,
      canRender: (_layoutType: string) => true,
    };
    expect(stubRenderer.type).toBe('stub');
    expect(stubRenderer.canRender('radial-city')).toBe(true);
  });

  it('VisualizationStyle bundles a layout engine and renderer', () => {
    const stubEngine: LayoutEngine = {
      type: 'stub-layout',
      layout: (_graph: Graph) => ({ positions: new Map(), bounds: { min: { x:0,y:0,z:0 }, max: { x:0,y:0,z:0 } } }) as LayoutResult,
      canHandle: () => true,
    };
    const stubRenderer: VisualizationRenderer = {
      type: 'stub',
      render: () => null as unknown as React.JSX.Element,
      canRender: () => true,
    };
    const style: VisualizationStyle = {
      id: 'test-style',
      label: 'Test Style',
      layoutEngine: stubEngine,
      renderer: stubRenderer,
    };
    expect(style.id).toBe('test-style');
    expect(style.layoutEngine.type).toBe('stub-layout');
    expect(style.renderer.type).toBe('stub');
  });
});
