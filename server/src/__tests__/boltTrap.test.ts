import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { ZoneSchema } from '../schema/ZoneSchema.js'
import { zoneEffectHandler } from '../game/skills/handlers/zoneEffectHandler.js'
import { tickZones } from '../game/ServerZoneSystem.js'
import { ZONE_EFFECT_DURATION } from '@shared/constants'
import { executeSkill } from '../game/ServerSkillExecutionSystem.js'
import { registerAllEffectHandlers } from '../game/skills/handlers/index.js'
import { getSkillDefinition } from '@shared/skills/skillDefinitions'
import { ProjectileTracker } from '../game/ProjectileTracker.js'
import type { ZoneEffectParams } from '@shared/skills/skillDefinitions'
import type { SkillExecutionContext } from '../game/skills/SkillEffectHandler.js'

const TRAP_PARAMS: ZoneEffectParams = {
  effectType: 'zone',
  zoneRadius: 80,
  zoneDuration: 30,
  triggerDamage: 70,
  triggerOnce: true,
  zoneEffect: {
    buffType: 'speed',
    value: -50,
    isDebuff: true,
    target: 'enemy',
    duration: 2,
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
    skillId: 'bolt-trap',
    direction: { x: 1, y: 0 },
    targetPosition: { x: 300, y: 100 },
    projectiles: new MapSchema<ProjectileSchema>(),
    heroes,
    zones,
    projectileTracker: new ProjectileTracker(),
    ...overrides,
  }
}

function createTrapZone(overrides: Partial<Record<string, unknown>> = {}): ZoneSchema {
  const zone = new ZoneSchema()
  zone.x = 300
  zone.y = 100
  zone.radius = 80
  zone.remainingDuration = 30
  zone.team = 'blue'
  zone.casterId = 'caster-1'
  zone.skillId = 'bolt-trap'
  zone.buffType = 'speed'
  zone.value = -50
  zone.isDebuff = true
  zone.target = 'enemy'
  zone.triggerDamage = 70
  zone.triggerOnce = true
  zone.effectDuration = 2
  Object.assign(zone, overrides)
  return zone
}

beforeEach(() => {
  registerAllEffectHandlers()
})

describe('getSkillDefinition — bolt-trap', () => {
  it('should return bolt-trap definition with correct params', () => {
    const def = getSkillDefinition('bolt-trap')
    expect(def).toBeDefined()
    expect(def!.id).toBe('bolt-trap')
    expect(def!.targeting).toBe('point')
    expect(def!.cooldown).toBe(10)
    expect(def!.range).toBe(500)
    expect(def!.effect.effectType).toBe('zone')
    if (def!.effect.effectType === 'zone') {
      expect(def!.effect.zoneRadius).toBe(80)
      expect(def!.effect.zoneDuration).toBe(30)
      expect(def!.effect.triggerDamage).toBe(70)
      expect(def!.effect.triggerOnce).toBe(true)
      expect(def!.effect.zoneEffect.buffType).toBe('speed')
      expect(def!.effect.zoneEffect.value).toBe(-50)
      expect(def!.effect.zoneEffect.isDebuff).toBe(true)
      expect(def!.effect.zoneEffect.target).toBe('enemy')
      expect(def!.effect.zoneEffect.duration).toBe(2)
    }
  })
})

describe('zoneEffectHandler — trap zone creation', () => {
  it('should create a trap zone with trigger fields', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const ctx = createContext(caster, heroes, zones, { targetPosition: { x: 400, y: 200 } })
    zoneEffectHandler.execute(ctx, TRAP_PARAMS)

    expect(zones.size).toBe(1)
    const zone = [...zones.values()][0]
    expect(zone.x).toBe(400)
    expect(zone.y).toBe(200)
    expect(zone.radius).toBe(80)
    expect(zone.remainingDuration).toBe(30)
    expect(zone.triggerDamage).toBe(70)
    expect(zone.triggerOnce).toBe(true)
    expect(zone.effectDuration).toBe(2)
    expect(zone.buffType).toBe('speed')
    expect(zone.value).toBe(-50)
  })
})

describe('tickZones — trap trigger logic', () => {
  it('should damage enemy when stepping on trap', () => {
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createTrapZone())

    const enemy = createHero({ x: 300, y: 100, team: 'red', hp: 500 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('enemy-1', enemy)

    tickZones(zones, heroes, 0.016)

    expect(enemy.hp).toBe(430) // 500 - 70
  })

  it('should apply slow debuff with effectDuration on trigger', () => {
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createTrapZone())

    const enemy = createHero({ x: 300, y: 100, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('enemy-1', enemy)

    tickZones(zones, heroes, 0.016)

    const effect = enemy.statusEffects.get('zone-1')
    expect(effect).toBeDefined()
    expect(effect!.buffType).toBe('speed')
    expect(effect!.value).toBe(-50)
    expect(effect!.remainingDuration).toBe(2)
    expect(effect!.isDebuff).toBe(true)
  })

  it('should remove zone after trigger when triggerOnce is true', () => {
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createTrapZone())

    const enemy = createHero({ x: 300, y: 100, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('enemy-1', enemy)

    tickZones(zones, heroes, 0.016)

    expect(zones.size).toBe(0)
  })

  it('should not trigger trap for allies', () => {
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createTrapZone())

    const ally = createHero({ x: 300, y: 100, team: 'blue', hp: 500 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('ally-1', ally)

    tickZones(zones, heroes, 0.016)

    expect(ally.hp).toBe(500) // no damage
    expect(ally.statusEffects.size).toBe(0)
    expect(zones.size).toBe(1) // zone still exists
  })

  it('should not trigger trap for dead heroes', () => {
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createTrapZone())

    const deadEnemy = createHero({ x: 300, y: 100, team: 'red', dead: true, hp: 0 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('dead-enemy', deadEnemy)

    tickZones(zones, heroes, 0.016)

    expect(deadEnemy.hp).toBe(0)
    expect(deadEnemy.statusEffects.size).toBe(0)
    expect(zones.size).toBe(1) // zone still exists
  })

  it('should set lastAttackerSessionId on trap damage', () => {
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createTrapZone())

    const enemy = createHero({ x: 300, y: 100, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('enemy-1', enemy)

    tickZones(zones, heroes, 0.016)

    expect(enemy.lastAttackerSessionId).toBe('caster-1')
  })

  it('should not affect existing slow-field behavior (no trigger fields)', () => {
    const zones = new MapSchema<ZoneSchema>()
    const slowZone = new ZoneSchema()
    slowZone.x = 300
    slowZone.y = 100
    slowZone.radius = 200
    slowZone.remainingDuration = 4
    slowZone.team = 'blue'
    slowZone.target = 'enemy'
    slowZone.buffType = 'speed'
    slowZone.value = -60
    slowZone.isDebuff = true
    // triggerDamage defaults to 0, triggerOnce defaults to false
    zones.set('zone-0', slowZone)

    const enemy = createHero({ x: 300, y: 100, team: 'red', hp: 500 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('enemy-1', enemy)

    tickZones(zones, heroes, 0.016)

    expect(enemy.hp).toBe(500) // no trigger damage
    expect(zones.size).toBe(1) // zone persists
    expect(enemy.statusEffects.get('zone-0')!.remainingDuration).toBeCloseTo(ZONE_EFFECT_DURATION)
  })

  it('should hit only the first enemy when multiple are in zone simultaneously', () => {
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createTrapZone())

    const enemy1 = createHero({ x: 300, y: 100, team: 'red', hp: 500 })
    const enemy2 = createHero({ x: 300, y: 100, team: 'red', hp: 500 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('enemy-1', enemy1)
    heroes.set('enemy-2', enemy2)

    tickZones(zones, heroes, 0.016)

    const damaged = [enemy1, enemy2].filter(e => e.hp === 430).length
    const undamaged = [enemy1, enemy2].filter(e => e.hp === 500).length
    expect(damaged).toBe(1)
    expect(undamaged).toBe(1)
    expect(zones.size).toBe(0) // zone removed
  })
})

describe('executeSkill — bolt-trap integration', () => {
  it('should create a trap zone via point targeting', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue', skillSlotQ: 'bolt-trap' })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const tracker = new ProjectileTracker()
    const event = executeSkill(caster, 'caster-1', 'Q', { x: 300, y: 100 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('bolt-trap')
    expect(zones.size).toBe(1)
  })

  it('should set cooldown to 10 seconds', () => {
    const caster = createHero({ x: 100, y: 100, team: 'blue', skillSlotQ: 'bolt-trap' })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const tracker = new ProjectileTracker()
    executeSkill(caster, 'caster-1', 'Q', { x: 300, y: 100 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(caster.cooldownQ).toBe(10)
  })
})
