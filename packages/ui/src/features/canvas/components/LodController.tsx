/**
 * LodController Component
 *
 * Invisible component that drives LOD level updates based on
 * camera distance. Place inside the R3F Canvas tree.
 */

import { useLodCalculator } from '../hooks/useLodCalculator';

export function LodController() {
  useLodCalculator();
  return null;
}
