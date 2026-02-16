import type { Position } from '@/domain/types'

/**
 * Compute the new facing angle for a hero.
 * Moving → face movement direction; idle → keep current facing.
 *
 * @returns facing in radians (0 = right)
 */
export function updateFacing(
  currentFacing: number,
  movement: Position
): number {
  if (movement.x !== 0 || movement.y !== 0) {
    return Math.atan2(movement.y, movement.x)
  }
  return currentFacing
}
