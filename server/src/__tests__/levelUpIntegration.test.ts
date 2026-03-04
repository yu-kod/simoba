import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { MinionSchema } from '../schema/MinionSchema.js'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import { XP_THRESHOLDS, MINION_XP_REWARD, MAX_LEVEL } from '@shared/constants'
import {
  processMinionDeaths,
  createMinionSystemContext,
  type MinionSystemContext,
} from '../game/ServerMinionSystem.js'
import { applyStatsGrowth } from '../game/xpUtils.js'

function createTestHero(id: string, team: string, x: number): HeroSchema {
  const hero = new HeroSchema()
  const def = HERO_DEFINITIONS.BLADE
  hero.id = id
  hero.team = team
  hero.x = x
  hero.y = 360
  hero.heroType = 'BLADE'
  hero.hp = def.base.maxHp
  hero.maxHp = def.base.maxHp
  hero.speed = def.base.speed
  hero.attackDamage = def.base.attackDamage
  hero.attackRange = def.base.attackRange
  hero.attackSpeed = def.base.attackSpeed
  hero.radius = def.radius
  hero.dead = false
  hero.level = 1
  hero.xp = 0
  hero.talentPoints = 0
  return hero
}

function createDeadMinion(id: string, team: string, x: number): MinionSchema {
  const minion = new MinionSchema()
  minion.id = id
  minion.team = team
  minion.x = x
  minion.y = 360
  minion.dead = true
  minion.hp = 0
  minion.maxHp = 100
  return minion
}

describe('Level-up integration', () => {
  let heroes: MapSchema<HeroSchema>
  let minions: MapSchema<MinionSchema>
  let ctx: MinionSystemContext

  beforeEach(() => {
    heroes = new MapSchema<HeroSchema>()
    minions = new MapSchema<MinionSchema>()
    ctx = createMinionSystemContext()
  })

  it('grants XP and levels up when threshold is reached', () => {
    const hero = createTestHero('h1', 'blue', 800)
    // Set XP just below level 2 threshold
    hero.xp = XP_THRESHOLDS[1] - MINION_XP_REWARD
    heroes.set('h1', hero)

    const minion = createDeadMinion('m1', 'red', 800)
    minions.set('m1', minion)

    processMinionDeaths(ctx, minions, heroes, 0.016)

    expect(hero.xp).toBe(XP_THRESHOLDS[1])
    expect(hero.level).toBe(2)
    expect(hero.talentPoints).toBe(1)
  })

  it('does not level up when XP is below threshold', () => {
    const hero = createTestHero('h1', 'blue', 800)
    hero.xp = 0
    heroes.set('h1', hero)

    const minion = createDeadMinion('m1', 'red', 800)
    minions.set('m1', minion)

    processMinionDeaths(ctx, minions, heroes, 0.016)

    expect(hero.xp).toBe(MINION_XP_REWARD)
    expect(hero.level).toBe(1)
    expect(hero.talentPoints).toBe(0)
  })

  it('applies stats growth on level up', () => {
    const hero = createTestHero('h1', 'blue', 800)
    const def = HERO_DEFINITIONS.BLADE
    hero.xp = XP_THRESHOLDS[1] - MINION_XP_REWARD
    heroes.set('h1', hero)

    const prevMaxHp = hero.maxHp
    const minion = createDeadMinion('m1', 'red', 800)
    minions.set('m1', minion)

    processMinionDeaths(ctx, minions, heroes, 0.016)

    expect(hero.maxHp).toBe(def.base.maxHp + def.growth.maxHp)
    expect(hero.speed).toBe(def.base.speed + def.growth.speed)
    // HP should have increased by the maxHp growth
    expect(hero.hp).toBe(prevMaxHp + def.growth.maxHp)
  })

  it('handles multi-level jump and grants correct talent points', () => {
    const hero = createTestHero('h1', 'blue', 800)
    // Set XP so that after reward, hero reaches level 3 threshold
    hero.xp = XP_THRESHOLDS[2] - MINION_XP_REWARD
    heroes.set('h1', hero)

    const minion = createDeadMinion('m1', 'red', 800)
    minions.set('m1', minion)

    processMinionDeaths(ctx, minions, heroes, 0.016)

    expect(hero.level).toBe(3)
    expect(hero.talentPoints).toBe(2) // jumped 2 levels
  })

  it('caps at MAX_LEVEL', () => {
    const hero = createTestHero('h1', 'blue', 800)
    hero.xp = 99999
    hero.level = MAX_LEVEL
    heroes.set('h1', hero)

    const minion = createDeadMinion('m1', 'red', 800)
    minions.set('m1', minion)

    processMinionDeaths(ctx, minions, heroes, 0.016)

    expect(hero.level).toBe(MAX_LEVEL)
    expect(hero.talentPoints).toBe(0)
  })

  describe('applyStatsGrowth', () => {
    it('recalculates stats from base + growth * (level - 1)', () => {
      const hero = createTestHero('h1', 'blue', 800)
      const def = HERO_DEFINITIONS.BLADE

      applyStatsGrowth(hero, 3)

      expect(hero.maxHp).toBe(def.base.maxHp + def.growth.maxHp * 2)
      expect(hero.speed).toBe(def.base.speed + def.growth.speed * 2)
      expect(hero.attackDamage).toBe(Math.round(def.base.attackDamage + def.growth.attackDamage * 2))
      expect(hero.attackSpeed).toBe(def.base.attackSpeed + def.growth.attackSpeed * 2)
    })

    it('increases hp when maxHp grows', () => {
      const hero = createTestHero('h1', 'blue', 800)
      const def = HERO_DEFINITIONS.BLADE
      hero.hp = def.base.maxHp // full HP

      applyStatsGrowth(hero, 2)

      const expectedMaxHp = def.base.maxHp + def.growth.maxHp
      expect(hero.maxHp).toBe(expectedMaxHp)
      expect(hero.hp).toBe(expectedMaxHp) // full HP stays full
    })

    it('does not let hp exceed maxHp', () => {
      const hero = createTestHero('h1', 'blue', 800)
      const def = HERO_DEFINITIONS.BLADE
      hero.hp = def.base.maxHp // full HP

      applyStatsGrowth(hero, 2)

      expect(hero.hp).toBeLessThanOrEqual(hero.maxHp)
    })

    it('adds maxHp growth to current hp when hero is damaged', () => {
      const hero = createTestHero('h1', 'blue', 800)
      const def = HERO_DEFINITIONS.BLADE
      hero.hp = 400 // damaged

      applyStatsGrowth(hero, 2)

      const expectedMaxHp = def.base.maxHp + def.growth.maxHp
      expect(hero.maxHp).toBe(expectedMaxHp)
      expect(hero.hp).toBe(400 + def.growth.maxHp)
    })
  })
})
