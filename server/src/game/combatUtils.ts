import { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'

/**
 * Apply damage to a hero, tower, or minion by ID.
 * Delegates to CombatEntitySchema.applyDamage() which handles
 * HP clamping and automatic dead flag transition.
 *
 * When attackerSessionId is provided and the target is a hero,
 * records the attacker for kill-credit XP.
 */
export function applyDamageToTarget(
  targetId: string,
  damage: number,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  minions?: MapSchema<MinionSchema>,
  attackerSessionId?: string,
): void {
  const hero = heroes.get(targetId)
  if (hero) {
    hero.applyDamage(damage)
    if (attackerSessionId) {
      hero.lastAttackerSessionId = attackerSessionId
    }
    return
  }
  const tower = towers.get(targetId)
  if (tower) {
    tower.applyDamage(damage)
    return
  }
  if (minions) {
    const minion = minions.get(targetId)
    if (minion) {
      minion.applyDamage(damage)
    }
  }
}
