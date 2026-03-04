import { MAX_LEVEL } from '@shared/constants'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import { computeLevelUp } from '@shared/systems/levelUp'
import type { HeroType } from '@shared/types'
import { TALENT_TREES } from '@shared/talents/index'
import type { HeroSchema } from '../schema/HeroSchema.js'
import { recalculateEffectiveStats } from './ServerTalentSystem.js'

/**
 * Recalculate hero stats from base + growth * (level - 1).
 * Mutates the HeroSchema directly (Colyseus convention).
 */
export function applyStatsGrowth(hero: HeroSchema, newLevel: number): void {
  if (newLevel < 1 || newLevel > MAX_LEVEL) {
    throw new Error(`applyStatsGrowth: newLevel ${newLevel} out of range`)
  }
  const def = HERO_DEFINITIONS[hero.heroType as HeroType]
  if (!def) {
    throw new Error(`Unknown heroType: "${hero.heroType}"`)
  }
  const prevMaxHp = hero.maxHp

  hero.maxHp = Math.round(def.base.maxHp + def.growth.maxHp * (newLevel - 1))
  hero.speed = def.base.speed + def.growth.speed * (newLevel - 1)
  hero.attackDamage = Math.round(def.base.attackDamage + def.growth.attackDamage * (newLevel - 1))
  hero.attackRange = def.base.attackRange + def.growth.attackRange * (newLevel - 1)
  hero.attackSpeed = def.base.attackSpeed + def.growth.attackSpeed * (newLevel - 1)

  // Increase current HP by the same amount maxHp grew (prevent level-up death)
  const hpGain = hero.maxHp - prevMaxHp
  if (hpGain > 0) {
    hero.hp = Math.min(hero.hp + hpGain, hero.maxHp)
  }
}

/**
 * Grant XP to a hero and apply level-up + stats growth if threshold is reached.
 * Uses recalculateEffectiveStats to include talent modifiers in the calculation.
 * Shared by both minion-kill and hero-kill XP paths.
 */
export function grantXpAndLevelUp(hero: HeroSchema, xpAmount: number): void {
  hero.xp = hero.xp + xpAmount
  const { newLevel, levelsGained } = computeLevelUp(hero.level, hero.xp)
  if (levelsGained > 0) {
    hero.level = newLevel
    hero.talentPoints = hero.talentPoints + levelsGained
    const treeDef = TALENT_TREES[hero.heroType as HeroType]
    if (treeDef) {
      recalculateEffectiveStats(hero, treeDef)
    } else {
      applyStatsGrowth(hero, newLevel)
    }
  }
}
