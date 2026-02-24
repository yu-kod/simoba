import { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'

/**
 * Apply damage to a hero, tower, or minion by ID (mutable schema version).
 * Looks up the target in heroes first, then towers, then minions.
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
    hero.hp = Math.max(0, hero.hp - damage)
    return
  }
  const tower = towers.get(targetId)
  if (tower) {
    tower.hp = Math.max(0, tower.hp - damage)
    return
  }
  if (minions) {
    const minion = minions.get(targetId)
    if (minion) {
      minion.hp = Math.max(0, minion.hp - damage)
    }
  }
}
