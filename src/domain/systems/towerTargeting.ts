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
    const centerDist = Math.sqrt(centerDistSq)
    const effectiveDist = centerDist - tower.radius - enemy.radius

    if (effectiveDist > tower.stats.attackRange) continue

    if (centerDistSq < bestDistSq) {
      bestDistSq = centerDistSq
      bestTarget = enemy
    }
  }

  return bestTarget
}
