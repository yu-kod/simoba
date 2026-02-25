import { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'

/**
 * Apply damage to a hero, tower, or minion by ID.
 * Delegates to CombatEntitySchema.applyDamage() which handles
 * HP clamping and automatic dead flag transition.
 */
export function applyDamageToTarget(
  targetId: string,
  damage: number,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  minions?: MapSchema<MinionSchema>,
): void {
  const hero = heroes.get(targetId)
  if (hero) {
    hero.applyDamage(damage)
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
