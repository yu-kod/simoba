import type { MinionState } from '@shared/entities/Minion'
import type { CombatEntityState } from '@/domain/types'

const TARGET_PRIORITY: readonly CombatEntityState['entityType'][] = [
  'minion',
  'tower',
  'hero',
]

export function selectMinionTarget(
  minion: MinionState,
  enemies: readonly CombatEntityState[],
): CombatEntityState | null {
  for (const entityType of TARGET_PRIORITY) {
    let bestTarget: CombatEntityState | null = null
    let bestDistSq = Infinity

    for (const enemy of enemies) {
      if (enemy.dead) continue
      if (enemy.entityType !== entityType) continue

      const dx = enemy.position.x - minion.position.x
      const dy = enemy.position.y - minion.position.y
      const centerDistSq = dx * dx + dy * dy

      const rangeThreshold =
        minion.stats.attackRange + minion.radius + enemy.radius
      if (centerDistSq > rangeThreshold * rangeThreshold) continue

      if (centerDistSq < bestDistSq) {
        bestDistSq = centerDistSq
        bestTarget = enemy
      }
    }

    if (bestTarget !== null) {
      return bestTarget
    }
  }

  return null
}
