import type { Position } from '@/domain/types'

/**
 * Compute the new facing angle for a hero.
 *
 * Priority: attack target direction > movement direction > keep current facing.
 * When attacking, facing always points at the target regardless of movement.
 *
 * @returns facing in radians (0 = right)
 */
export function updateFacing(
  currentFacing: number,
  movement: Position,
  targetPosition?: Position | null,
  heroPosition?: Position
): number {
  // Priority 1: attack target direction
  if (targetPosition && heroPosition) {
    const dx = targetPosition.x - heroPosition.x
    const dy = targetPosition.y - heroPosition.y
    if (dx !== 0 || dy !== 0) {
      return Math.atan2(dy, dx)
    }
  }

  // Priority 2: movement direction
  if (movement.x !== 0 || movement.y !== 0) {
    return Math.atan2(movement.y, movement.x)
  }

  // Priority 3: keep current facing
  return currentFacing
}
