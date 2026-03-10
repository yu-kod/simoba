import type { HeroSchema } from '../schema/HeroSchema.js'

/**
 * Sum all status effect values matching the given buffType.
 * Returns 0 if no matching effects exist.
 */
export function getStatusEffectValue(hero: HeroSchema, buffType: string): number {
  let total = 0
  hero.statusEffects.forEach((effect) => {
    if (effect.buffType === buffType) {
      total += effect.value
    }
  })
  return total
}

/**
 * Calculate the effective stat value after applying all matching status effects.
 * Clamps to 0 to prevent negative stats.
 */
export function getEffectiveStat(base: number, hero: HeroSchema, buffType: string): number {
  return Math.max(0, base + getStatusEffectValue(hero, buffType))
}

/**
 * Tick down all status effect durations for a hero.
 * Removes expired effects (remainingDuration <= 0).
 */
export function tickBuffs(hero: HeroSchema, dt: number): void {
  const toRemove: string[] = []

  hero.statusEffects.forEach((effect, key) => {
    effect.remainingDuration -= dt
    if (effect.remainingDuration <= 0) {
      toRemove.push(key)
    }
  })

  for (const key of toRemove) {
    hero.statusEffects.delete(key)
  }
}
