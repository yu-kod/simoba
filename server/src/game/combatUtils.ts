import { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'

/**
 * Apply damage to a hero or tower by ID (mutable schema version).
 * Looks up the target in heroes first, then towers.
 */
export function applyDamageToTarget(
  targetId: string,
  damage: number,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>
): void {
  const hero = heroes.get(targetId)
  if (hero) {
    hero.hp = Math.max(0, hero.hp - damage)
    return
  }
  const tower = towers.get(targetId)
  if (tower) {
    tower.hp = Math.max(0, tower.hp - damage)
  }
}
