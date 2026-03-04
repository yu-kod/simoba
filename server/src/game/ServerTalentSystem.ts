import type { TalentEffect, TalentTreeDefinition } from '@shared/talents/types'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import type { HeroType, StatBlock } from '@shared/types'
import type { HeroSchema } from '../schema/HeroSchema.js'

// ---------------------------------------------------------------------------
// Talent acquisition
// ---------------------------------------------------------------------------

/**
 * Attempt to acquire a talent for the given hero.
 * Returns true if acquisition succeeded, false if validation failed.
 */
export function acquireTalent(
  hero: HeroSchema,
  talentId: string,
  treeDef: TalentTreeDefinition,
): boolean {
  const node = treeDef.nodes.find((n) => n.id === talentId)
  if (!node) return false

  // Check: sufficient points
  if (hero.talentPoints < node.cost) return false

  // Check: not already acquired
  if (hasAcquiredTalent(hero, talentId)) return false

  // Check: all prerequisites acquired
  const allPrereqsMet = node.prerequisites.every((prereqId) => hasAcquiredTalent(hero, prereqId))
  if (!allPrereqsMet) return false

  // Acquire
  hero.acquiredTalents.push(talentId)
  hero.talentPoints -= node.cost

  // Apply effects
  applyTalentEffects(hero, node.effects)

  // Recalculate stats (includes all talent modifiers)
  recalculateEffectiveStats(hero, treeDef)

  return true
}

function hasAcquiredTalent(hero: HeroSchema, talentId: string): boolean {
  for (let i = 0; i < hero.acquiredTalents.length; i++) {
    if (hero.acquiredTalents.at(i) === talentId) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Effect application
// ---------------------------------------------------------------------------

export function applyTalentEffects(hero: HeroSchema, effects: readonly TalentEffect[]): void {
  for (const effect of effects) {
    switch (effect.type) {
      case 'grant_skill':
        grantSkill(hero, effect.skillId)
        break
      case 'stat_modifier':
        // Stat modifiers are applied via recalculateEffectiveStats
        break
      case 'modify_basic_attack':
        // Reserved for future implementation
        break
      case 'unlock_passive':
        // Reserved for future implementation
        break
    }
  }
}

function grantSkill(hero: HeroSchema, skillId: string): void {
  // Prevent duplicates
  for (let i = 0; i < hero.ownedSkills.length; i++) {
    if (hero.ownedSkills.at(i) === skillId) return
  }
  hero.ownedSkills.push(skillId)
}

// ---------------------------------------------------------------------------
// Stats recalculation
// ---------------------------------------------------------------------------

/**
 * Recalculate effective stats from base + growth + talent modifiers.
 * Formula: base + (growth × (level - 1)) + Σ flat + base × Σ percent
 */
export function recalculateEffectiveStats(
  hero: HeroSchema,
  treeDef: TalentTreeDefinition,
): void {
  const heroType = hero.heroType as HeroType
  const def = HERO_DEFINITIONS[heroType]
  if (!def) return

  const level = hero.level

  // Collect all stat modifiers from acquired talents
  const flatMods: Partial<Record<keyof StatBlock, number>> = {}
  const percentMods: Partial<Record<keyof StatBlock, number>> = {}

  for (let i = 0; i < hero.acquiredTalents.length; i++) {
    const talentId = hero.acquiredTalents.at(i)
    const node = treeDef.nodes.find((n) => n.id === talentId)
    if (!node) continue
    for (const effect of node.effects) {
      if (effect.type === 'stat_modifier') {
        if (effect.mode === 'flat') {
          flatMods[effect.stat] = (flatMods[effect.stat] ?? 0) + effect.value
        } else {
          percentMods[effect.stat] = (percentMods[effect.stat] ?? 0) + effect.value
        }
      }
    }
  }

  // Apply formula for each stat
  const stats: (keyof StatBlock)[] = ['maxHp', 'speed', 'attackDamage', 'attackRange', 'attackSpeed']
  for (const stat of stats) {
    const base = def.base[stat]
    const growth = def.growth[stat]
    const baseWithGrowth = base + growth * (level - 1)
    const flat = flatMods[stat] ?? 0
    const percent = percentMods[stat] ?? 0
    const effective = baseWithGrowth + flat + baseWithGrowth * (percent / 100)

    // Write to HeroSchema fields
    switch (stat) {
      case 'maxHp': {
        const prevMax = hero.maxHp
        hero.maxHp = Math.round(effective)
        // Scale current HP proportionally
        if (prevMax > 0) {
          hero.hp = Math.round((hero.hp / prevMax) * hero.maxHp)
        }
        break
      }
      case 'speed':
        hero.speed = effective
        break
      case 'attackDamage':
        hero.attackDamage = Math.round(effective)
        break
      case 'attackRange':
        hero.attackRange = effective
        break
      case 'attackSpeed':
        hero.attackSpeed = effective
        break
    }
  }
}
