import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { aoeEffectHandler } from '../game/skills/handlers/aoeEffectHandler.js'
import { executeSkill } from '../game/ServerSkillExecutionSystem.js'
import { registerAllEffectHandlers } from '../game/skills/handlers/index.js'
import { getSkillDefinition } from '@shared/skills/skillDefinitions'
import { ProjectileTracker } from '../game/ProjectileTracker.js'
import type { AoEEffectParams } from '@shared/skills/skillDefinitions'
import type { SkillExecutionContext } from '../game/skills/SkillEffectHandler.js'

const NOVA_PARAMS: AoEEffectParams = {
  effectType: 'aoe',
  damage: 80,
  healAmount: 60,
  radius: 200,
}

function createHero(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.hp = 500
  hero.maxHp = 500
  hero.dead = false
  hero.team = 'blue'
  hero.x = 100
  hero.y = 100
  hero.radius = 22
  Object.assign(hero, overrides)
  return hero
}

function createContext(
  hero: HeroSchema,
  heroes: MapSchema<HeroSchema>,
  overrides: Partial<SkillExecutionContext> = {},
): SkillExecutionContext {
  return {
    hero,
    casterId: 'caster-1',
    skillId: 'aura-nova',
    direction: { x: 1, y: 0 },
    targetPosition: { x: 300, y: 100 },
    projectiles: new MapSchema<ProjectileSchema>(),
    heroes,
    projectileTracker: new ProjectileTracker(),
    ...overrides,
  }
}

beforeEach(() => {
  registerAllEffectHandlers()
})

describe('getSkillDefinition — aura-nova', () => {
  it('should return aura-nova definition with correct params', () => {
    const def = getSkillDefinition('aura-nova')
    expect(def).toBeDefined()
    expect(def!.id).toBe('aura-nova')
    expect(def!.targeting).toBe('point')
    expect(def!.cooldown).toBe(16)
    expect(def!.effect.effectType).toBe('aoe')
    if (def!.effect.effectType === 'aoe') {
      expect(def!.effect.damage).toBe(80)
      expect(def!.effect.healAmount).toBe(60)
      expect(def!.effect.radius).toBe(200)
    }
  })
})

describe('aoeEffectHandler', () => {
  it('should have effectType "aoe"', () => {
    expect(aoeEffectHandler.effectType).toBe('aoe')
  })

  it('should damage enemies within radius', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue' })
    const enemy = createHero({ x: 300, y: 100, team: 'red', hp: 500 })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    // targetPosition at (300, 100), enemy at (300, 100) — distance 0, within radius 200
    const ctx = createContext(caster, heroes, { targetPosition: { x: 300, y: 100 } })
    aoeEffectHandler.execute(ctx, NOVA_PARAMS)

    expect(enemy.hp).toBe(420) // 500 - 80
  })

  it('should heal allies within radius (including caster)', () => {
    const caster = createHero({ x: 300, y: 100, team: 'blue', hp: 400 })
    const ally = createHero({ x: 350, y: 100, team: 'blue', hp: 300 })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    // targetPosition at (300, 100), both within radius 200
    const ctx = createContext(caster, heroes, { targetPosition: { x: 300, y: 100 } })
    aoeEffectHandler.execute(ctx, NOVA_PARAMS)

    expect(caster.hp).toBe(460) // 400 + 60
    expect(ally.hp).toBe(360)   // 300 + 60
  })

  it('should not affect heroes outside radius', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue' })
    const farEnemy = createHero({ x: 600, y: 100, team: 'red', hp: 500 })
    const farAlly = createHero({ x: 600, y: 300, team: 'blue', hp: 300 })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('far-enemy', farEnemy)
    heroes.set('far-ally', farAlly)

    // targetPosition at (300, 100), farEnemy at (600, 100) — distance 300 > radius 200
    const ctx = createContext(caster, heroes, { targetPosition: { x: 300, y: 100 } })
    aoeEffectHandler.execute(ctx, NOVA_PARAMS)

    expect(farEnemy.hp).toBe(500) // unchanged
    expect(farAlly.hp).toBe(300)  // unchanged
  })

  it('should not affect dead heroes', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue' })
    const deadEnemy = createHero({ x: 300, y: 100, team: 'red', hp: 0, dead: true })
    const deadAlly = createHero({ x: 300, y: 100, team: 'blue', hp: 0, dead: true })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('dead-enemy', deadEnemy)
    heroes.set('dead-ally', deadAlly)

    const ctx = createContext(caster, heroes, { targetPosition: { x: 300, y: 100 } })
    aoeEffectHandler.execute(ctx, NOVA_PARAMS)

    expect(deadEnemy.hp).toBe(0) // unchanged
    expect(deadAlly.hp).toBe(0)  // unchanged
  })

  it('should set lastAttackerSessionId on damaged enemies', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue' })
    const enemy = createHero({ x: 300, y: 100, team: 'red' })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    const ctx = createContext(caster, heroes, { targetPosition: { x: 300, y: 100 } })
    aoeEffectHandler.execute(ctx, NOVA_PARAMS)

    expect(enemy.lastAttackerSessionId).toBe('caster-1')
  })

  it('should damage and heal simultaneously in mixed group', () => {
    const caster = createHero({ x: 300, y: 100, team: 'blue', hp: 400 })
    const ally = createHero({ x: 350, y: 100, team: 'blue', hp: 300 })
    const enemy1 = createHero({ x: 280, y: 100, team: 'red', hp: 500 })
    const enemy2 = createHero({ x: 320, y: 100, team: 'red', hp: 500 })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)
    heroes.set('enemy-1', enemy1)
    heroes.set('enemy-2', enemy2)

    const ctx = createContext(caster, heroes, { targetPosition: { x: 300, y: 100 } })
    aoeEffectHandler.execute(ctx, NOVA_PARAMS)

    expect(caster.hp).toBe(460)  // healed
    expect(ally.hp).toBe(360)    // healed
    expect(enemy1.hp).toBe(420)  // damaged
    expect(enemy2.hp).toBe(420)  // damaged
  })
})

describe('executeSkill — aura-nova integration', () => {
  it('should execute via point targeting and pass targetPosition', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue', skillSlotQ: 'aura-nova', hp: 400 })
    const enemy = createHero({ x: 500, y: 300, team: 'red', hp: 500 })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    const tracker = new ProjectileTracker()
    // Click at enemy position — AoE center at (500, 300)
    const event = executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker)

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('aura-nova')
    expect(enemy.hp).toBe(420) // 500 - 80
  })

  it('should set cooldown to 16 seconds', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue', skillSlotQ: 'aura-nova' })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    const tracker = new ProjectileTracker()
    executeSkill(caster, 'caster-1', 'Q', { x: 300, y: 100 }, new MapSchema<ProjectileSchema>(), heroes, tracker)

    expect(caster.cooldownQ).toBe(16)
  })
})
