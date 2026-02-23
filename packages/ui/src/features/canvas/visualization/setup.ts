/**
 * Register all built-in visualization styles.
 * Import this file once at app startup (e.g., in Canvas3D.tsx).
 */
import { visualizationStyleRegistry } from './registry';
import { cityRenderer } from './renderers/city/CityRenderer';
import { RadialCityLayoutEngine } from '../layout/engines/radialCityLayout';

visualizationStyleRegistry.register({
  id: 'city',
  label: 'City View',
  layoutEngine: new RadialCityLayoutEngine(),
  renderer: cityRenderer,
});
