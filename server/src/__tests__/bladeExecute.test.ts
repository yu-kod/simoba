import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { ZoneSchema } from '../schema/ZoneSchema.js'
import { executeSkill } from '../game/ServerSkillExecutionSystem.js'
import { registerAllEffectHandlers } from '../game/skills/handlers/index.js'
import { getSkillDefinition } from '@shared/skills/skillDefinitions'
import { ProjectileTracker } from '../game/ProjectileTracker.js'

let tracker: ProjectileTracker

function createHero(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.hp = 650
  hero.maxHp = 650
  hero.dead = false
  hero.team = 'blue'
  hero.x = 400
  hero.y = 300
  hero.radius = 22
  hero.heroType = 'BLADE'
  hero.skillSlotQ = 'blade-execute'
  Object.assign(hero, overrides)
  return hero
}

function createEnemy(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.hp = 650
  hero.maxHp = 650
  hero.dead = false
  hero.team = 'red'
  hero.x = 450
  hero.y = 300
  hero.radius = 22
  hero.heroType = 'BOLT'
  Object.assign(hero, overrides)
  return hero
}

beforeEach(() => {
  registerAllEffectHandlers()
  tracker = new ProjectileTracker()
})

// ── Skill definition ──

describe('getSkillDefinition — blade-execute', () => {
  it('should return blade-execute definition with correct params', () => {
    const def = getSkillDefinition('blade-execute')
    expect(def).toBeDefined()
    expect(def!.id).toBe('blade-execute')
    expect(def!.targeting).toBe('enemy')
    expect(def!.cooldown).toBe(20)
    expect(def!.range).toBe(150)
    expect(def!.effect.effectType).toBe('strike')
    if (def!.effect.effectType === 'strike') {
      expect(def!.effect.damage).toBe(100)
      expect(def!.effect.executeThreshold).toBe(0.3)
      expect(def!.effect.executeBonusDamage).toBe(150)
    }
  })
})

// ── Skill execution ──

describe('executeSkill — blade-execute', () => {
  it('should deal base damage to full-HP enemy', () => {
    const caster = createHero()
    const enemy = createEnemy({ x: 450, y: 300 }) // within 150px range
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 450, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('blade-execute')
    expect(enemy.hp).toBe(650 - 100) // base damage only
  })

  it('should deal base + bonus damage to low-HP enemy (below threshold)', () => {
    const caster = createHero()
    const enemy = createEnemy({ x: 450, y: 300, hp: 180 }) // 180/650 = 27.7% < 30%
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    executeSkill(caster, 'caster-1', 'Q', { x: 450, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(enemy.hp).toBe(0) // base 100 + bonus 150 = 250, clamped to 0 by applyDamage
  })

  it('should deal base damage only when enemy is above threshold', () => {
    const caster = createHero()
    const enemy = createEnemy({ x: 450, y: 300, hp: 250 }) // 250/650 = 38.5% > 30%
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    executeSkill(caster, 'caster-1', 'Q', { x: 450, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(enemy.hp).toBe(250 - 100) // base damage only
  })

  it('should apply bonus damage at exactly 30% HP threshold', () => {
    const caster = createHero()
    const enemy = createEnemy({ x: 450, y: 300, hp: 195 }) // 195/650 = 30.0% exactly
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    executeSkill(caster, 'caster-1', 'Q', { x: 450, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(enemy.hp).toBe(0) // 195 - 250 = clamped to 0 by applyDamage
  })

  it('should set cooldown to 20 seconds', () => {
    const caster = createHero()
    const enemy = createEnemy({ x: 450, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    executeSkill(caster, 'caster-1', 'Q', { x: 450, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(caster.cooldownQ).toBe(20)
  })

  it('should set lastAttackerSessionId for kill credit', () => {
    const caster = createHero()
    const enemy = createEnemy({ x: 450, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    executeSkill(caster, 'caster-1', 'Q', { x: 450, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(enemy.lastAttackerSessionId).toBe('caster-1')
  })

  it('should reject activation while dashing', () => {
    const caster = createHero({ dashTimer: 0.2 })
    const enemy = createEnemy({ x: 450, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 450, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(event).toBeNull()
    expect(enemy.hp).toBe(650) // no damage
  })

  it('should reject when no enemy in range', () => {
    const caster = createHero()
    const enemy = createEnemy({ x: 800, y: 300 }) // 400px away from hero
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    // Click near the hero — enemy is 400px from click, exceeds 150px range
    const event = executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(event).toBeNull()
    expect(caster.cooldownQ).toBe(0) // no CD consumed
    expect(enemy.hp).toBe(650) // no damage
  })

  it('should clamp damage so HP does not go below 0', () => {
    const caster = createHero()
    const enemy = createEnemy({ x: 450, y: 300, hp: 50 }) // 50/650 = 7.7% < 30%
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    executeSkill(caster, 'caster-1', 'Q', { x: 450, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(enemy.hp).toBe(0) // 50 - 250 = clamped to 0
  })
})
