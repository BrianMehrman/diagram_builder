/**
 * Room Layout Utilities
 *
 * Calculates positions and sizes for method rooms inside class buildings.
 * Rooms are stacked vertically within the building volume with padding.
 */

import { METHOD_ROOM_HEIGHT } from '../../views/cityViewUtils';

/** Padding between room edges and building walls */
export const WALL_PADDING = 0.15;

/** Padding between adjacent rooms on the same floor */
export const ROOM_GAP = 0.1;

/**
 * Describes a single room's position and size within a building.
 * Positions are local to the building group origin (base center).
 */
export interface RoomPlacement {
  /** Local position within building (center of room) */
  position: { x: number; y: number; z: number };
  /** Room dimensions */
  size: { width: number; height: number; depth: number };
  /** Index into the methods array */
  methodIndex: number;
}

/**
 * Calculate room placements for methods inside a building.
 *
 * Rooms stack vertically, one per floor. If the building is wide enough,
 * multiple rooms can share a floor (grid arrangement).
 *
 * @param methodCount - Number of method rooms to place
 * @param buildingWidth - Building interior width
 * @param buildingHeight - Building total height (from getContainmentHeight)
 * @param buildingDepth - Building interior depth
 * @returns Array of room placements, one per method
 */
export function calculateRoomLayout(
  methodCount: number,
  buildingWidth: number,
  buildingHeight: number,
  buildingDepth: number,
): RoomPlacement[] {
  if (methodCount <= 0) return [];

  const interiorWidth = buildingWidth - WALL_PADDING * 2;
  const interiorDepth = buildingDepth - WALL_PADDING * 2;

  // Determine how many rooms fit per floor (side by side along X)
  const minRoomWidth = 0.6;
  const roomsPerFloor = Math.max(
    1,
    Math.floor((interiorWidth + ROOM_GAP) / (minRoomWidth + ROOM_GAP)),
  );

  // Room dimensions
  const roomWidth = roomsPerFloor > 1
    ? (interiorWidth - ROOM_GAP * (roomsPerFloor - 1)) / roomsPerFloor
    : interiorWidth;
  const roomHeight = METHOD_ROOM_HEIGHT * 0.8; // 80% of floor height for visual gap
  const roomDepth = interiorDepth;

  const placements: RoomPlacement[] = [];

  for (let i = 0; i < methodCount; i++) {
    const floorIndex = Math.floor(i / roomsPerFloor);
    const colIndex = i % roomsPerFloor;

    // Y position: stack from bottom, each floor is METHOD_ROOM_HEIGHT tall
    const y = floorIndex * METHOD_ROOM_HEIGHT + METHOD_ROOM_HEIGHT / 2;

    // X position: distribute across floor width
    const xStart = -interiorWidth / 2 + roomWidth / 2;
    const x = xStart + colIndex * (roomWidth + ROOM_GAP);

    placements.push({
      position: { x, y, z: 0 },
      size: { width: roomWidth, height: roomHeight, depth: roomDepth },
      methodIndex: i,
    });
  }

  return placements;
}
