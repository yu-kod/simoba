import type { TowerState } from '@/domain/entities/Tower'
import type { CombatEntityState } from '@/domain/types'

/**
 * Select the nearest alive enemy within the tower's attack range.
 * Returns null if no valid target exists.
 */
export function selectTowerTarget(
  tower: TowerState,
  enemies: readonly CombatEntityState[]
): CombatEntityState | null {
  let bestTarget: CombatEntityState | null = null
  let bestDistSq = Infinity

  for (const enemy of enemies) {
    if (enemy.dead) continue

    const dx = enemy.position.x - tower.position.x
    const dy = enemy.position.y - tower.position.y
    const centerDistSq = dx * dx + dy * dy

    // Use squared distance to avoid Math.sqrt in hot path
    const rangeThreshold = tower.stats.attackRange + tower.radius + enemy.radius
    if (centerDistSq > rangeThreshold * rangeThreshold) continue

    if (centerDistSq < bestDistSq) {
      bestDistSq = centerDistSq
      bestTarget = enemy
    }
  }

  return bestTarget
}
