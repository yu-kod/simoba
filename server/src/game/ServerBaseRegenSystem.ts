import { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import { BASES, BASE_HP_REGEN_PER_SEC } from '@shared/constants'

/**
 * Check if a hero is inside their own base area.
 */
export function isHeroInBase(hero: HeroSchema): boolean {
  const base = hero.team === 'blue' ? BASES.blue : BASES.red
  return (
    hero.x >= base.x &&
    hero.x <= base.x + base.width &&
    hero.y >= base.y &&
    hero.y <= base.y + base.height
  )
}

/**
 * Regenerate HP for heroes standing inside their own base.
 * Skips dead heroes. Clamps HP to maxHp.
 */
export function processBaseRegen(
  heroes: MapSchema<HeroSchema>,
  deltaTime: number,
): void {
  heroes.forEach((hero) => {
    if (hero.dead) return
    if (hero.hp >= hero.maxHp) return
    if (!isHeroInBase(hero)) return

    hero.hp = Math.min(hero.maxHp, hero.hp + BASE_HP_REGEN_PER_SEC * deltaTime)
  })
}
