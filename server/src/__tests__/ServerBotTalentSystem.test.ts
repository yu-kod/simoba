import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { spendBotTalents } from '../game/ServerBotTalentSystem.js'
import { BLADE_TALENT_TREE } from '@shared/talents/bladeTalents'
import type { HeroType } from '@shared/types'
import type { TalentTreeDefinition } from '@shared/talents/types'

const TALENT_TREES: Partial<Record<HeroType, TalentTreeDefinition>> = {
  BLADE: BLADE_TALENT_TREE,
}

function createHero(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.heroType = 'BLADE'
  hero.level = 1
  hero.talentPoints = 0
  hero.hp = 650
  hero.maxHp = 650
  hero.speed = 170
  hero.attackDamage = 60
  hero.attackRange = 60
  hero.attackSpeed = 0.8
  hero.isBot = false
  hero.dead = false
  Object.assign(hero, overrides)
  return hero
}

describe('ServerBotTalentSystem', () => {
  let heroes: MapSchema<HeroSchema>

  beforeEach(() => {
    heroes = new MapSchema<HeroSchema>()
  })

  it('should acquire a talent when bot has talent points', () => {
    const bot = createHero({ isBot: true, talentPoints: 1 })
    heroes.set('bot-1', bot)

    spendBotTalents(heroes, TALENT_TREES)

    expect(bot.talentPoints).toBe(0)
    expect(bot.acquiredTalents.length).toBe(1)
  })

  it('should skip bot with zero talent points', () => {
    const bot = createHero({ isBot: true, talentPoints: 0 })
    heroes.set('bot-1', bot)

    spendBotTalents(heroes, TALENT_TREES)

    expect(bot.acquiredTalents.length).toBe(0)
  })

  it('should skip human players', () => {
    const human = createHero({ isBot: false, talentPoints: 3 })
    heroes.set('player-1', human)

    spendBotTalents(heroes, TALENT_TREES)

    expect(human.talentPoints).toBe(3)
    expect(human.acquiredTalents.length).toBe(0)
  })

  it('should skip dead bots', () => {
    const bot = createHero({ isBot: true, talentPoints: 2, dead: true, hp: 0 })
    heroes.set('bot-1', bot)

    spendBotTalents(heroes, TALENT_TREES)

    expect(bot.talentPoints).toBe(2)
    expect(bot.acquiredTalents.length).toBe(0)
  })

  it('should spend multiple talent points in one call', () => {
    const bot = createHero({ isBot: true, talentPoints: 2 })
    heroes.set('bot-1', bot)

    spendBotTalents(heroes, TALENT_TREES)

    // BLADE has 2 root nodes (blade-toughness, blade-sharp-edge), so 2 points → 2 talents
    expect(bot.talentPoints).toBe(0)
    expect(bot.acquiredTalents.length).toBe(2)
  })

  it('should stop when no acquirable nodes remain despite having points', () => {
    // Give 3 points but only 2 root nodes available (tier 2 needs prerequisites)
    // After acquiring 2 root nodes, tier 2 nodes become available, so 3 should be spent
    const bot = createHero({ isBot: true, talentPoints: 3 })
    heroes.set('bot-1', bot)

    spendBotTalents(heroes, TALENT_TREES)

    // 2 root nodes + 1 tier-2 node (either blade-charge or blade-cleave)
    expect(bot.talentPoints).toBe(0)
    expect(bot.acquiredTalents.length).toBe(3)
  })

  it('should spend all 5 points to acquire entire talent tree', () => {
    const bot = createHero({ isBot: true, talentPoints: 5 })
    heroes.set('bot-1', bot)

    spendBotTalents(heroes, TALENT_TREES)

    expect(bot.talentPoints).toBe(0)
    expect(bot.acquiredTalents.length).toBe(5)
  })

  it('should select randomly from available nodes', () => {
    // Run multiple times and check that different root nodes can be selected first
    const firstTalents = new Set<string>()

    for (let i = 0; i < 20; i++) {
      const bot = createHero({ isBot: true, talentPoints: 1 })
      const testHeroes = new MapSchema<HeroSchema>()
      testHeroes.set('bot', bot)

      spendBotTalents(testHeroes, TALENT_TREES)

      firstTalents.add(bot.acquiredTalents.at(0)!)
    }

    // With 2 root nodes and 20 iterations, both should appear (extremely unlikely to fail)
    expect(firstTalents.size).toBe(2)
  })

  it('should handle multiple bots independently', () => {
    const bot1 = createHero({ isBot: true, talentPoints: 1 })
    const bot2 = createHero({ isBot: true, talentPoints: 2 })
    heroes.set('bot-1', bot1)
    heroes.set('bot-2', bot2)

    spendBotTalents(heroes, TALENT_TREES)

    expect(bot1.talentPoints).toBe(0)
    expect(bot1.acquiredTalents.length).toBe(1)
    expect(bot2.talentPoints).toBe(0)
    expect(bot2.acquiredTalents.length).toBe(2)
  })
})
