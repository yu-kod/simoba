import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { ZoneSchema } from '../schema/ZoneSchema.js'
import { zoneEffectHandler } from '../game/skills/handlers/zoneEffectHandler.js'
import { tickZones } from '../game/ServerZoneSystem.js'
import { executeSkill } from '../game/ServerSkillExecutionSystem.js'
import { registerAllEffectHandlers } from '../game/skills/handlers/index.js'
import { getSkillDefinition } from '@shared/skills/skillDefinitions'
import { ProjectileTracker } from '../game/ProjectileTracker.js'
import type { ZoneEffectParams } from '@shared/skills/skillDefinitions'
import type { SkillExecutionContext } from '../game/skills/SkillEffectHandler.js'

const SLOW_FIELD_PARAMS: ZoneEffectParams = {
  effectType: 'zone',
  zoneRadius: 200,
  zoneDuration: 4,
  zoneEffect: {
    buffType: 'speed',
    value: -60,
    isDebuff: true,
    target: 'enemy',
  },
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
  zones: MapSchema<ZoneSchema>,
  overrides: Partial<SkillExecutionContext> = {},
): SkillExecutionContext {
  return {
    hero,
    casterId: 'caster-1',
    skillId: 'aura-slow-field',
    direction: { x: 1, y: 0 },
    targetPosition: { x: 300, y: 100 },
    projectiles: new MapSchema<ProjectileSchema>(),
    heroes,
    zones,
    projectileTracker: new ProjectileTracker(),
    ...overrides,
  }
}

beforeEach(() => {
  registerAllEffectHandlers()
})

describe('getSkillDefinition — aura-slow-field', () => {
  it('should return aura-slow-field definition with correct params', () => {
    const def = getSkillDefinition('aura-slow-field')
    expect(def).toBeDefined()
    expect(def!.id).toBe('aura-slow-field')
    expect(def!.targeting).toBe('point')
    expect(def!.cooldown).toBe(14)
    expect(def!.range).toBe(600)
    expect(def!.effect.effectType).toBe('zone')
    if (def!.effect.effectType === 'zone') {
      expect(def!.effect.zoneRadius).toBe(200)
      expect(def!.effect.zoneDuration).toBe(4)
      expect(def!.effect.zoneEffect.buffType).toBe('speed')
      expect(def!.effect.zoneEffect.value).toBe(-60)
      expect(def!.effect.zoneEffect.isDebuff).toBe(true)
      expect(def!.effect.zoneEffect.target).toBe('enemy')
    }
  })
})

describe('zoneEffectHandler', () => {
  it('should have effectType "zone"', () => {
    expect(zoneEffectHandler.effectType).toBe('zone')
  })

  it('should create a zone at targetPosition', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const ctx = createContext(caster, heroes, zones, { targetPosition: { x: 400, y: 200 } })
    zoneEffectHandler.execute(ctx, SLOW_FIELD_PARAMS)

    expect(zones.size).toBe(1)
    const zone = zones.get('zone-1')!
    expect(zone.x).toBe(400)
    expect(zone.y).toBe(200)
    expect(zone.radius).toBe(200)
    expect(zone.remainingDuration).toBe(4)
    expect(zone.team).toBe('blue')
    expect(zone.casterId).toBe('caster-1')
    expect(zone.skillId).toBe('aura-slow-field')
    expect(zone.buffType).toBe('speed')
    expect(zone.value).toBe(-60)
    expect(zone.isDebuff).toBe(true)
    expect(zone.target).toBe('enemy')
  })
})

describe('tickZones — ServerZoneSystem', () => {
  it('should decrement zone duration and remove expired zones', () => {
    const zones = new MapSchema<ZoneSchema>()
    const zone = new ZoneSchema()
    zone.x = 300
    zone.y = 100
    zone.radius = 200
    zone.remainingDuration = 1.0
    zone.team = 'blue'
    zone.target = 'enemy'
    zone.buffType = 'speed'
    zone.value = -60
    zone.isDebuff = true
    zones.set('zone-0', zone)

    const heroes = new MapSchema<HeroSchema>()

    // Tick 0.5s — zone should still exist
    tickZones(zones, heroes, 0.5)
    expect(zones.size).toBe(1)
    expect(zone.remainingDuration).toBeCloseTo(0.5)

    // Tick 0.6s — zone should be removed
    tickZones(zones, heroes, 0.6)
    expect(zones.size).toBe(0)
  })

  it('should apply speed debuff to enemies within radius', () => {
    const zones = new MapSchema<ZoneSchema>()
    const zone = new ZoneSchema()
    zone.x = 300
    zone.y = 100
    zone.radius = 200
    zone.remainingDuration = 4
    zone.team = 'blue'
    zone.target = 'enemy'
    zone.buffType = 'speed'
    zone.value = -60
    zone.isDebuff = true
    zones.set('zone-0', zone)

    const enemy = createHero({ x: 300, y: 100, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('enemy-1', enemy)

    tickZones(zones, heroes, 0.016)

    const effect = enemy.statusEffects.get('zone-0')
    expect(effect).toBeDefined()
    expect(effect!.buffType).toBe('speed')
    expect(effect!.value).toBe(-60)
    expect(effect!.isDebuff).toBe(true)
    expect(effect!.remainingDuration).toBeCloseTo(0.1)
  })

  it('should not affect heroes outside radius', () => {
    const zones = new MapSchema<ZoneSchema>()
    const zone = new ZoneSchema()
    zone.x = 300
    zone.y = 100
    zone.radius = 200
    zone.remainingDuration = 4
    zone.team = 'blue'
    zone.target = 'enemy'
    zone.buffType = 'speed'
    zone.value = -60
    zone.isDebuff = true
    zones.set('zone-0', zone)

    const farEnemy = createHero({ x: 600, y: 100, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('far-enemy', farEnemy)

    tickZones(zones, heroes, 0.016)

    expect(farEnemy.statusEffects.size).toBe(0)
  })

  it('should not affect allies when target is enemy', () => {
    const zones = new MapSchema<ZoneSchema>()
    const zone = new ZoneSchema()
    zone.x = 300
    zone.y = 100
    zone.radius = 200
    zone.remainingDuration = 4
    zone.team = 'blue'
    zone.target = 'enemy'
    zone.buffType = 'speed'
    zone.value = -60
    zone.isDebuff = true
    zones.set('zone-0', zone)

    const ally = createHero({ x: 300, y: 100, team: 'blue' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('ally-1', ally)

    tickZones(zones, heroes, 0.016)

    expect(ally.statusEffects.size).toBe(0)
  })

  it('should not affect dead heroes', () => {
    const zones = new MapSchema<ZoneSchema>()
    const zone = new ZoneSchema()
    zone.x = 300
    zone.y = 100
    zone.radius = 200
    zone.remainingDuration = 4
    zone.team = 'blue'
    zone.target = 'enemy'
    zone.buffType = 'speed'
    zone.value = -60
    zone.isDebuff = true
    zones.set('zone-0', zone)

    const deadEnemy = createHero({ x: 300, y: 100, team: 'red', dead: true, hp: 0 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('dead-enemy', deadEnemy)

    tickZones(zones, heroes, 0.016)

    expect(deadEnemy.statusEffects.size).toBe(0)
  })

  it('should affect allies when target is ally', () => {
    const zones = new MapSchema<ZoneSchema>()
    const zone = new ZoneSchema()
    zone.x = 300
    zone.y = 100
    zone.radius = 200
    zone.remainingDuration = 4
    zone.team = 'blue'
    zone.target = 'ally'
    zone.buffType = 'speed'
    zone.value = 50
    zone.isDebuff = false
    zones.set('zone-0', zone)

    const ally = createHero({ x: 300, y: 100, team: 'blue' })
    const enemy = createHero({ x: 300, y: 100, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('ally-1', ally)
    heroes.set('enemy-1', enemy)

    tickZones(zones, heroes, 0.016)

    expect(ally.statusEffects.size).toBe(1)
    expect(enemy.statusEffects.size).toBe(0)
  })

  it('should affect all heroes when target is all', () => {
    const zones = new MapSchema<ZoneSchema>()
    const zone = new ZoneSchema()
    zone.x = 300
    zone.y = 100
    zone.radius = 200
    zone.remainingDuration = 4
    zone.team = 'blue'
    zone.target = 'all'
    zone.buffType = 'speed'
    zone.value = -30
    zone.isDebuff = true
    zones.set('zone-0', zone)

    const ally = createHero({ x: 300, y: 100, team: 'blue' })
    const enemy = createHero({ x: 300, y: 100, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('ally-1', ally)
    heroes.set('enemy-1', enemy)

    tickZones(zones, heroes, 0.016)

    expect(ally.statusEffects.size).toBe(1)
    expect(enemy.statusEffects.size).toBe(1)
  })

  it('should refresh effect duration on subsequent ticks', () => {
    const zones = new MapSchema<ZoneSchema>()
    const zone = new ZoneSchema()
    zone.x = 300
    zone.y = 100
    zone.radius = 200
    zone.remainingDuration = 4
    zone.team = 'blue'
    zone.target = 'enemy'
    zone.buffType = 'speed'
    zone.value = -60
    zone.isDebuff = true
    zones.set('zone-0', zone)

    const enemy = createHero({ x: 300, y: 100, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('enemy-1', enemy)

    // First tick
    tickZones(zones, heroes, 0.016)
    expect(enemy.statusEffects.get('zone-0')!.remainingDuration).toBeCloseTo(0.1)

    // Simulate some time passing (effect would tick down)
    enemy.statusEffects.get('zone-0')!.remainingDuration = 0.05

    // Second tick — should refresh
    tickZones(zones, heroes, 0.016)
    expect(enemy.statusEffects.get('zone-0')!.remainingDuration).toBeCloseTo(0.1)
  })
})

describe('executeSkill — aura-slow-field integration', () => {
  it('should create a zone via point targeting', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue', skillSlotQ: 'aura-slow-field' })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const tracker = new ProjectileTracker()
    const event = executeSkill(caster, 'caster-1', 'Q', { x: 300, y: 100 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('aura-slow-field')
    expect(zones.size).toBe(1)
  })

  it('should set cooldown to 14 seconds', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue', skillSlotQ: 'aura-slow-field' })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const tracker = new ProjectileTracker()
    executeSkill(caster, 'caster-1', 'Q', { x: 300, y: 100 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(caster.cooldownQ).toBe(14)
  })
})
