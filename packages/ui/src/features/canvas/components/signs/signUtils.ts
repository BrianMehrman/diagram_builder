/**
 * Sign Selection & Visibility Utilities
 *
 * Pure utility functions that determine which sign style applies to a
 * node and whether that sign is visible at the current LOD level.
 *
 * Sign types reflect the city metaphor:
 * - neon: public API — bright, attention-grabbing
 * - brass: private internals — subtle, formal
 * - hanging: class-level — swinging shop signs
 * - highway: file/module — large directional signs
 * - labelTape: variables — small utility labels
 * - marquee: exported symbols — lit-up marquee
 * - construction: deprecated — warning/barricade style
 */

import type { GraphNode } from '../../../../shared/types';

/**
 * All possible sign types in the city metaphor.
 */
export type SignType =
  | 'neon'
  | 'brass'
  | 'hanging'
  | 'highway'
  | 'labelTape'
  | 'marquee'
  | 'construction';

/**
 * LOD visibility matrix — which sign types are visible at each LOD level.
 *
 * LOD 1 (city zoom): only highway signs visible
 * LOD 2 (district): + hanging, neon, marquee
 * LOD 3 (neighborhood): + brass, labelTape
 * LOD 4 (street): all signs including construction
 */
const LOD_VISIBILITY: Record<number, Set<SignType>> = {
  1: new Set(['highway']),
  2: new Set(['highway', 'hanging', 'neon', 'marquee']),
  3: new Set(['highway', 'hanging', 'neon', 'marquee', 'brass', 'labelTape']),
  4: new Set(['highway', 'hanging', 'neon', 'marquee', 'brass', 'labelTape', 'construction']),
};

/**
 * Determine the sign type for a given node.
 *
 * Priority order (highest to lowest):
 * 1. deprecated → construction
 * 2. exported → marquee
 * 3. visibility: 'private' → brass
 * 4. visibility: 'public' → neon
 * 5. node type: class/abstract_class → hanging
 * 6. node type: file → highway
 * 7. node type: variable → labelTape
 * 8. fallback → highway
 *
 * @param node - Graph node to determine sign type for
 * @returns The sign type to render
 */
export function getSignType(node: GraphNode): SignType {
  const meta = node.metadata ?? {};

  // Priority 1: deprecated
  if (meta.isDeprecated === true) {
    return 'construction';
  }

  // Priority 2: exported
  if (meta.isExported === true) {
    return 'marquee';
  }

  // Priority 3-4: access level visibility
  if (meta.visibility === 'private') {
    return 'brass';
  }
  if (meta.visibility === 'public') {
    return 'neon';
  }

  // Priority 5-7: node type based
  if (node.type === 'class' || node.type === 'abstract_class') {
    return 'hanging';
  }
  if (node.type === 'file') {
    return 'highway';
  }
  if (node.type === 'variable') {
    return 'labelTape';
  }

  // Fallback: highway for everything else (function, method, interface, enum)
  return 'highway';
}

/**
 * Determine whether a sign type is visible at the given LOD level.
 *
 * Higher LOD levels (closer camera) reveal more sign types.
 * LOD levels above 4 show all signs.
 *
 * @param signType - The sign type to check
 * @param lodLevel - Current LOD level (1-4+)
 * @returns True if the sign should be rendered
 */
export function getSignVisibility(signType: SignType, lodLevel: number): boolean {
  // LOD 0 or below: no signs
  if (lodLevel < 1) return false;

  // LOD 4+: all signs visible
  if (lodLevel >= 4) return true;

  const visibleSet = LOD_VISIBILITY[lodLevel];
  if (!visibleSet) return false;

  return visibleSet.has(signType);
}
