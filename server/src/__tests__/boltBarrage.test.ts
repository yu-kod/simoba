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
  hero.hp = 500
  hero.maxHp = 500
  hero.dead = false
  hero.team = 'blue'
  hero.x = 400
  hero.y = 300
  hero.radius = 22
  hero.heroType = 'BOLT'
  hero.skillSlotQ = 'bolt-barrage'
  Object.assign(hero, overrides)
  return hero
}

beforeEach(() => {
  registerAllEffectHandlers()
  tracker = new ProjectileTracker()
})

// ── Skill definition ──

describe('getSkillDefinition — bolt-barrage', () => {
  it('should return bolt-barrage definition with correct params', () => {
    const def = getSkillDefinition('bolt-barrage')
    expect(def).toBeDefined()
    expect(def!.id).toBe('bolt-barrage')
    expect(def!.targeting).toBe('direction')
    expect(def!.cooldown).toBe(10)
    expect(def!.effect.effectType).toBe('projectile')
    if (def!.effect.effectType === 'projectile') {
      expect(def!.effect.damage).toBe(25)
      expect(def!.effect.speed).toBe(700)
      expect(def!.effect.range).toBe(450)
      expect(def!.effect.radius).toBe(4)
      expect(def!.effect.pierceCount).toBe(0)
      expect(def!.effect.projectileCount).toBe(5)
      expect(def!.effect.spreadAngle).toBeCloseTo(0.436, 2)
    }
  })
})

// ── Skill execution ──

describe('executeSkill — bolt-barrage', () => {
  it('should create 5 projectiles', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, projectiles, heroes, tracker, zones)

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('bolt-barrage')
    expect(projectiles.size).toBe(5)
  })

  it('should set cooldown to 10 seconds', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, projectiles, heroes, tracker, zones)

    expect(caster.cooldownQ).toBe(10)
  })

  it('should reject activation while dashing', () => {
    const caster = createHero({ dashTimer: 0.2 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, projectiles, heroes, tracker, zones)

    expect(event).toBeNull()
    expect(projectiles.size).toBe(0)
  })

  it('should distribute projectiles in a fan spread', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()

    // Fire to the right (direction x=1, y=0)
    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, projectiles, heroes, tracker, zones)

    const projs = [...projectiles.values()]
    expect(projs).toHaveLength(5)

    // All should have same origin, speed, damage
    for (const p of projs) {
      expect(p.x).toBe(400)
      expect(p.y).toBe(300)
      expect(p.speed).toBe(700)
      expect(p.damage).toBe(25)
      expect(p.mode).toBe('linear')
      expect(p.maxRange).toBe(450)
      expect(p.pierceRemaining).toBe(0)
    }

    // Check that directions span the spread angle
    const angles = projs.map(p => Math.atan2(p.dirY, p.dirX))
    angles.sort((a, b) => a - b)

    // Total spread should be ~0.436 radians
    const actualSpread = angles[angles.length - 1] - angles[0]
    expect(actualSpread).toBeCloseTo(0.436, 2)

    // Middle projectile should be closest to base angle (0 = right)
    expect(angles[2]).toBeCloseTo(0, 2)
  })

  it('should fire in the aimed direction when aiming diagonally', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()

    // Aim down-right (45 degrees)
    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 400 }, projectiles, heroes, tracker, zones)

    const projs = [...projectiles.values()]
    const angles = projs.map(p => Math.atan2(p.dirY, p.dirX))
    const avgAngle = angles.reduce((a, b) => a + b, 0) / angles.length

    // Average angle should be ~45 degrees (π/4 ≈ 0.785)
    expect(avgAngle).toBeCloseTo(Math.PI / 4, 1)
  })

  it('should give each projectile a unique id', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, projectiles, heroes, tracker, zones)

    const ids = [...projectiles.values()].map(p => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(5)
  })
})

// ── Single-projectile backward compatibility ──

describe('projectileEffectHandler — single projectile', () => {
  it('should still create 1 projectile for pierce-shot (no projectileCount)', () => {
    const caster = createHero({ skillSlotQ: 'bolt-pierce-shot' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, projectiles, heroes, tracker, zones)

    expect(projectiles.size).toBe(1)
    const proj = [...projectiles.values()][0]
    expect(proj.damage).toBe(60)
    expect(proj.pierceRemaining).toBe(3)
  })
})
