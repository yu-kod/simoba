import { MAX_LEVEL, XP_THRESHOLDS } from '@shared/constants'
import type { HeroType } from '@shared/types'
import { TALENT_TREES } from '@shared/talents/index'
import type { HeroSchema } from '../schema/HeroSchema.js'
import { recalculateEffectiveStats } from './ServerTalentSystem.js'
import { applyStatsGrowth } from './xpUtils.js'

/**
 * Set a hero to maximum level instantly.
 * Grants all remaining talent points and recalculates stats.
 * Intended for Solo mode debug use only.
 */
export function applyMaxLevel(hero: HeroSchema): void {
  if (hero.level >= MAX_LEVEL) return

  const levelsGained = MAX_LEVEL - hero.level
  hero.level = MAX_LEVEL
  hero.xp = XP_THRESHOLDS[MAX_LEVEL - 1]!
  hero.talentPoints = hero.talentPoints + levelsGained

  const treeDef = TALENT_TREES[hero.heroType as HeroType]
  if (treeDef) {
    recalculateEffectiveStats(hero, treeDef)
  } else {
    applyStatsGrowth(hero, MAX_LEVEL)
  }
}
