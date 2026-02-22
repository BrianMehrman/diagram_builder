import { describe, it, expect } from 'vitest';
import { cityRenderer } from './CityRenderer';

describe('CityRenderer', () => {
  it('has type radial-city', () => {
    expect(cityRenderer.type).toBe('radial-city');
  });

  it('canRender radial-city layout', () => {
    expect(cityRenderer.canRender('radial-city')).toBe(true);
  });

  it('cannot render tree layout', () => {
    expect(cityRenderer.canRender('tree')).toBe(false);
  });

  it('has a render function', () => {
    expect(typeof cityRenderer.render).toBe('function');
  });
});
