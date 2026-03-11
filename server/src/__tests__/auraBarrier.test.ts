import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { ZoneSchema } from '../schema/ZoneSchema.js'
import { tickZones } from '../game/ServerZoneSystem.js'
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
  hero.heroType = 'AURA'
  hero.skillSlotQ = 'aura-barrier'
  Object.assign(hero, overrides)
  return hero
}

function createBarrierZone(
  casterId: string,
  team: string,
  x: number,
  y: number,
): ZoneSchema {
  const zone = new ZoneSchema()
  zone.x = x
  zone.y = y
  zone.radius = 180
  zone.remainingDuration = 4
  zone.team = team
  zone.casterId = casterId
  zone.skillId = 'aura-barrier'
  zone.buffType = 'damageReduction'
  zone.value = 0.30
  zone.isDebuff = false
  zone.target = 'ally'
  return zone
}

beforeEach(() => {
  registerAllEffectHandlers()
  tracker = new ProjectileTracker()
})

// ── Skill definition ──

describe('getSkillDefinition — aura-barrier', () => {
  it('should return aura-barrier definition with correct params', () => {
    const def = getSkillDefinition('aura-barrier')
    expect(def).toBeDefined()
    expect(def!.id).toBe('aura-barrier')
    expect(def!.targeting).toBe('point')
    expect(def!.cooldown).toBe(14)
    expect(def!.range).toBe(500)
    expect(def!.effect.effectType).toBe('zone')
    if (def!.effect.effectType === 'zone') {
      expect(def!.effect.zoneRadius).toBe(180)
      expect(def!.effect.zoneDuration).toBe(4)
      expect(def!.effect.zoneEffect.buffType).toBe('damageReduction')
      expect(def!.effect.zoneEffect.value).toBe(0.30)
      expect(def!.effect.zoneEffect.target).toBe('ally')
    }
  })
})

// ── Skill execution ──

describe('executeSkill — aura-barrier', () => {
  it('should create a fixed zone at target position', () => {
    const caster = createHero({ x: 400, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 600, y: 400 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('aura-barrier')
    expect(zones.size).toBe(1)

    const zone = [...zones.values()][0]
    expect(zone.x).toBe(600)
    expect(zone.y).toBe(400)
    expect(zone.radius).toBe(180)
    expect(zone.remainingDuration).toBe(4)
    expect(zone.followHeroId).toBe('') // fixed position, not follow
  })

  it('should set cooldown to 14 seconds', () => {
    const caster = createHero({ x: 400, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 600, y: 400 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(caster.cooldownQ).toBe(14)
  })

  it('should reject activation while dashing', () => {
    const caster = createHero({ x: 400, y: 300, dashTimer: 0.2 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 600, y: 400 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(event).toBeNull()
    expect(zones.size).toBe(0)
  })
})

// ── Zone effects ──

describe('tickZones — Barrier damage reduction', () => {
  it('should apply damageReduction to ally in radius', () => {
    const ally = createHero({ x: 600, y: 400 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('ally-1', ally)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createBarrierZone('caster-1', 'blue', 600, 400))

    tickZones(zones, heroes, 0.016)

    const effect = ally.statusEffects.get('zone-1')
    expect(effect).toBeDefined()
    expect(effect!.buffType).toBe('damageReduction')
    expect(effect!.value).toBe(0.30)
    expect(effect!.isDebuff).toBe(false)
  })

  it('should NOT apply damageReduction to enemy in radius', () => {
    const enemy = createHero({ x: 600, y: 400, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('enemy-1', enemy)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createBarrierZone('caster-1', 'blue', 600, 400))

    tickZones(zones, heroes, 0.016)

    expect(enemy.statusEffects.get('zone-1')).toBeUndefined()
  })

  it('should not affect ally outside radius', () => {
    const farAlly = createHero({ x: 900, y: 400 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('ally-1', farAlly)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createBarrierZone('caster-1', 'blue', 600, 400))

    tickZones(zones, heroes, 0.016)

    expect(farAlly.statusEffects.get('zone-1')).toBeUndefined()
  })

  it('should remain at fixed position (not follow caster)', () => {
    const caster = createHero({ x: 400, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createBarrierZone('caster-1', 'blue', 600, 400))

    // Move caster far away
    caster.x = 100
    caster.y = 100

    tickZones(zones, heroes, 0.016)

    const zone = zones.get('zone-1')!
    expect(zone.x).toBe(600) // stays at original position
    expect(zone.y).toBe(400)
  })

  it('should expire after 4 seconds', () => {
    const heroes = new MapSchema<HeroSchema>()
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createBarrierZone('caster-1', 'blue', 600, 400))

    tickZones(zones, heroes, 4.0)

    expect(zones.size).toBe(0)
  })
})
