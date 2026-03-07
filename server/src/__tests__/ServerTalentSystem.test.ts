import { describe, it, expect, beforeEach } from 'vitest'
import { HeroSchema } from '../schema/HeroSchema.js'
import { acquireTalent, recalculateEffectiveStats } from '../game/ServerTalentSystem.js'
import { BLADE_TALENT_TREE } from '@shared/talents/bladeTalents'
import type { TalentTreeDefinition } from '@shared/talents/types'

function createTestHero(overrides?: Partial<{ talentPoints: number; level: number; heroType: string }>): HeroSchema {
  const hero = new HeroSchema()
  hero.heroType = overrides?.heroType ?? 'BLADE'
  hero.level = overrides?.level ?? 1
  hero.talentPoints = overrides?.talentPoints ?? 0
  hero.hp = 650
  hero.maxHp = 650
  hero.speed = 170
  hero.attackDamage = 60
  hero.attackRange = 60
  hero.attackSpeed = 0.8
  return hero
}

describe('acquireTalent', () => {
  let hero: HeroSchema

  beforeEach(() => {
    hero = createTestHero({ talentPoints: 3 })
  })

  it('should acquire a root talent with sufficient points', () => {
    const result = acquireTalent(hero, 'blade-toughness', BLADE_TALENT_TREE)
    expect(result).toBe(true)
    expect(hero.acquiredTalents.length).toBe(1)
    expect(hero.acquiredTalents.at(0)).toBe('blade-toughness')
    expect(hero.talentPoints).toBe(2)
  })

  it('should reject when talentPoints is insufficient', () => {
    hero.talentPoints = 0
    const result = acquireTalent(hero, 'blade-toughness', BLADE_TALENT_TREE)
    expect(result).toBe(false)
    expect(hero.acquiredTalents.length).toBe(0)
    expect(hero.talentPoints).toBe(0)
  })

  it('should reject duplicate acquisition', () => {
    acquireTalent(hero, 'blade-toughness', BLADE_TALENT_TREE)
    const result = acquireTalent(hero, 'blade-toughness', BLADE_TALENT_TREE)
    expect(result).toBe(false)
    expect(hero.acquiredTalents.length).toBe(1)
    expect(hero.talentPoints).toBe(2)
  })

  it('should reject when prerequisites are not met', () => {
    // blade-charge requires blade-toughness
    const result = acquireTalent(hero, 'blade-charge', BLADE_TALENT_TREE)
    expect(result).toBe(false)
    expect(hero.acquiredTalents.length).toBe(0)
  })

  it('should allow acquisition when prerequisites are met', () => {
    acquireTalent(hero, 'blade-toughness', BLADE_TALENT_TREE)
    const result = acquireTalent(hero, 'blade-charge', BLADE_TALENT_TREE)
    expect(result).toBe(true)
    expect(hero.acquiredTalents.length).toBe(2)
  })

  it('should reject unknown talentId', () => {
    const result = acquireTalent(hero, 'nonexistent', BLADE_TALENT_TREE)
    expect(result).toBe(false)
  })

  it('should grant skill on grant_skill effect', () => {
    acquireTalent(hero, 'blade-toughness', BLADE_TALENT_TREE)
    acquireTalent(hero, 'blade-charge', BLADE_TALENT_TREE)
    expect(hero.ownedSkills.length).toBe(1)
    expect(hero.ownedSkills.at(0)).toBe('blade-charge')
  })

  it('should apply stat_modifier effect on acquisition', () => {
    // blade-toughness: maxHp +80 flat
    // hero level=1, BLADE base maxHp=650, growth=80
    // After acquire: baseWithGrowth = 650 + 80*1 = 730, + 80 flat = 810
    acquireTalent(hero, 'blade-toughness', BLADE_TALENT_TREE)
    expect(hero.maxHp).toBe(810)
  })
})

describe('recalculateEffectiveStats', () => {
  it('should calculate base + growth + flat modifier', () => {
    const hero = createTestHero({ level: 3 })
    // Acquire blade-toughness (+80 HP flat)
    hero.acquiredTalents.push('blade-toughness')
    recalculateEffectiveStats(hero, BLADE_TALENT_TREE)
    // BLADE base maxHp=650, growth=80, level=3 → 650 + 80*3 + 80 = 970
    expect(hero.maxHp).toBe(970)
  })

  it('should calculate percent modifier correctly', () => {
    const hero = createTestHero({ level: 1 })
    // Acquire blade-berserker (+20% attackSpeed) — bypass prerequisites for test
    hero.acquiredTalents.push('blade-berserker')
    recalculateEffectiveStats(hero, BLADE_TALENT_TREE)
    // BLADE base attackSpeed=0.8, growth=0.05, level=1 → (0.8+0.05) + (0.8+0.05)*0.20 = 1.02
    expect(hero.attackSpeed).toBeCloseTo(1.02, 2)
  })

  it('should handle both flat and percent modifiers combined', () => {
    // Custom tree for precise testing
    const testTree: TalentTreeDefinition = {
      heroType: 'BLADE',
      nodes: [
        {
          id: 'test-flat',
          name: 'Flat',
          description: '+10 AD',
          cost: 1,
          prerequisites: [],
          effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 10, mode: 'flat' }],
        },
        {
          id: 'test-percent',
          name: 'Percent',
          description: '+20% AD',
          cost: 1,
          prerequisites: [],
          effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 20, mode: 'percent' }],
        },
      ],
    }
    const hero = createTestHero({ level: 3 })
    hero.acquiredTalents.push('test-flat')
    hero.acquiredTalents.push('test-percent')
    recalculateEffectiveStats(hero, testTree)
    // base=60, growth=8, level=3 → baseWithGrowth = 60 + 8*3 = 84
    // effective = 84 + 10 + 84 * 0.20 = 110.8 → rounded = 111
    expect(hero.attackDamage).toBe(111)
  })

  it('should scale current HP proportionally when maxHp changes', () => {
    const hero = createTestHero({ level: 1 })
    hero.maxHp = 650
    hero.hp = 325 // 50% HP
    hero.acquiredTalents.push('blade-toughness')
    recalculateEffectiveStats(hero, BLADE_TALENT_TREE)
    // New maxHp at level 1 = 650 + 80*1 + 80(talent) = 810, HP should be 50% = 405
    expect(hero.maxHp).toBe(810)
    expect(hero.hp).toBe(405)
  })
})
