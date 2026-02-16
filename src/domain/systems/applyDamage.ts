import type { CombatEntityState } from '@/domain/types'

/**
 * Apply damage to a combat entity, clamping HP at 0.
 * Returns a new entity state (immutable update).
 */
export function applyDamage<T extends CombatEntityState>(
  target: T,
  damage: number
): T {
  return {
    ...target,
    hp: Math.max(0, target.hp - damage),
  }
}
