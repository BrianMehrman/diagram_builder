/**
 * Shared types for sign components.
 */

import type { Position3D } from '../../../../shared/types';

/**
 * Standard props accepted by all sign components.
 */
export interface SignProps {
  /** Label text to display */
  text: string;
  /** World-space position */
  position: Position3D;
  /** Whether the sign is currently visible (LOD-controlled) */
  visible: boolean;
  /** Optional override color */
  color?: string;
}
