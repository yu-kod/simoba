import type { CombatEntityState, Position } from '@/domain/types'

/**
 * Find the enemy entity under the click position using circle hit-testing.
 * Returns the closest enemy whose position is within radius of the click,
 * or null if no enemy was clicked.
 */
export function findClickTarget(
  clickWorldPos: Position,
  enemies: readonly CombatEntityState[],
  getRadius: (entity: CombatEntityState) => number
): CombatEntityState | null {
  let closest: CombatEntityState | null = null
  let closestDistSq = Infinity

  for (const enemy of enemies) {
    const dx = clickWorldPos.x - enemy.position.x
    const dy = clickWorldPos.y - enemy.position.y
    const distSq = dx * dx + dy * dy
    const radius = getRadius(enemy)

    if (distSq <= radius * radius && distSq < closestDistSq) {
      closest = enemy
      closestDistSq = distSq
    }
  }

  return closest
}
