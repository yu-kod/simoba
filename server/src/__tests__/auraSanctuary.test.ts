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
  hero.skillSlotQ = 'aura-sanctuary'
  Object.assign(hero, overrides)
  return hero
}

function createSanctuaryZone(
  casterId: string,
  team: string,
  x: number,
  y: number,
  overrides: Partial<Record<string, unknown>> = {},
): ZoneSchema {
  const zone = new ZoneSchema()
  zone.x = x
  zone.y = y
  zone.radius = 160
  zone.remainingDuration = 5
  zone.team = team
  zone.casterId = casterId
  zone.skillId = 'aura-sanctuary'
  zone.buffType = 'damageReduction'
  zone.value = 0.25
  zone.isDebuff = false
  zone.target = 'ally'
  zone.tickDamage = 0
  zone.tickHeal = 15
  zone.tickInterval = 1.0
  zone.tickTimer = 0
  zone.followHeroId = casterId
  Object.assign(zone, overrides)
  return zone
}

beforeEach(() => {
  registerAllEffectHandlers()
  tracker = new ProjectileTracker()
})

// ── Skill definition tests ──

describe('getSkillDefinition — aura-sanctuary', () => {
  it('should return aura-sanctuary definition with correct params', () => {
    const def = getSkillDefinition('aura-sanctuary')
    expect(def).toBeDefined()
    expect(def!.id).toBe('aura-sanctuary')
    expect(def!.targeting).toBe('self')
    expect(def!.cooldown).toBe(20)
    expect(def!.effect.effectType).toBe('zone')
    if (def!.effect.effectType === 'zone') {
      expect(def!.effect.zoneRadius).toBe(160)
      expect(def!.effect.zoneDuration).toBe(5)
      expect(def!.effect.tickHeal).toBe(15)
      expect(def!.effect.tickInterval).toBe(1.0)
      expect(def!.effect.followCaster).toBe(true)
    }
  })
})

// ── Skill execution tests ──

describe('executeSkill — aura-sanctuary', () => {
  it('should create a zone at caster position', () => {
    const caster = createHero({ x: 400, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('aura-sanctuary')
    expect(zones.size).toBe(1)

    const zone = [...zones.values()][0]
    expect(zone.x).toBe(400)
    expect(zone.y).toBe(300)
    expect(zone.radius).toBe(160)
    expect(zone.remainingDuration).toBe(5)
    expect(zone.followHeroId).toBe('caster-1')
    expect(zone.tickHeal).toBe(15)
    expect(zone.tickInterval).toBe(1.0)
    expect(zone.tickTimer).toBe(0)
  })

  it('should set cooldown to 20 seconds', () => {
    const caster = createHero({ x: 400, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(caster.cooldownQ).toBe(20)
  })

  it('should reject activation while dashing', () => {
    const caster = createHero({ x: 400, y: 300, dashTimer: 0.2 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(event).toBeNull()
    expect(zones.size).toBe(0)
  })

  it('should NOT apply self-debuff to caster', () => {
    const caster = createHero({ x: 400, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    // Sanctuary has isDebuff: false, so no self-debuff should be applied
    expect(caster.statusEffects.get('aura-sanctuary')).toBeUndefined()
  })
})

// ── Follow zone tests ──

describe('tickZones — Sanctuary follow zone', () => {
  it('should update zone position to follow caster', () => {
    const caster = createHero({ x: 400, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    caster.x = 500
    caster.y = 350

    tickZones(zones, heroes, 0.016)

    const zone = zones.get('zone-1')!
    expect(zone.x).toBe(500)
    expect(zone.y).toBe(350)
  })

  it('should remove zone when caster dies', () => {
    const caster = createHero({ x: 400, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    caster.hp = 0
    caster.dead = true

    tickZones(zones, heroes, 0.016)

    expect(zones.size).toBe(0)
  })

  it('should remove zone when caster is not found', () => {
    const heroes = new MapSchema<HeroSchema>()
    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    tickZones(zones, heroes, 0.016)

    expect(zones.size).toBe(0)
  })
})

// ── Tick healing tests ──

describe('tickZones — Sanctuary tick healing', () => {
  it('should heal ally hero in radius on tick', () => {
    const caster = createHero({ x: 400, y: 300 })
    const ally = createHero({ x: 450, y: 300, hp: 500, maxHp: 650 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    tickZones(zones, heroes, 1.0)

    expect(ally.hp).toBe(515) // 500 + 15
  })

  it('should not heal enemies', () => {
    const caster = createHero({ x: 400, y: 300 })
    const enemy = createHero({ x: 450, y: 300, team: 'red', hp: 500, maxHp: 650 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    tickZones(zones, heroes, 1.0)

    expect(enemy.hp).toBe(500) // no healing
  })

  it('should cap healing at maxHp', () => {
    const caster = createHero({ x: 400, y: 300 })
    const ally = createHero({ x: 450, y: 300, hp: 645, maxHp: 650 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    tickZones(zones, heroes, 1.0)

    expect(ally.hp).toBe(650) // capped at maxHp, not 660
  })

  it('should heal multiple allies simultaneously', () => {
    const caster = createHero({ x: 400, y: 300 })
    const ally1 = createHero({ x: 450, y: 300, hp: 500, maxHp: 650 })
    const ally2 = createHero({ x: 400, y: 350, hp: 400, maxHp: 650 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally1)
    heroes.set('ally-2', ally2)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    tickZones(zones, heroes, 1.0)

    expect(ally1.hp).toBe(515) // 500 + 15
    expect(ally2.hp).toBe(415) // 400 + 15
  })

  it('should deal approximately 75 total healing over full 5s duration (5 ticks)', () => {
    const caster = createHero({ x: 400, y: 300 })
    const ally = createHero({ x: 450, y: 300, hp: 400, maxHp: 650 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    // Simulate 5 ticks at 1.0s each
    for (let i = 0; i < 5; i++) {
      tickZones(zones, heroes, 1.0)
    }

    // 5 ticks x 15 heal = 75 total
    expect(ally.hp).toBe(475) // 400 + 75
  })

  it('should heal on first tick immediately, then wait for interval', () => {
    const caster = createHero({ x: 400, y: 300 })
    const ally = createHero({ x: 450, y: 300, hp: 500, maxHp: 650 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    // First tick fires immediately
    tickZones(zones, heroes, 0.016)
    expect(ally.hp).toBe(515) // 500 + 15

    // 0.5s later — less than 1.0s interval, no additional heal
    tickZones(zones, heroes, 0.5)
    expect(ally.hp).toBe(515)
  })

  it('should not heal allies outside radius', () => {
    const caster = createHero({ x: 400, y: 300 })
    const farAlly = createHero({ x: 700, y: 300, hp: 500, maxHp: 650 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', farAlly)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    tickZones(zones, heroes, 1.0)

    expect(farAlly.hp).toBe(500) // too far, no healing
  })
})

// ── Damage reduction status effect tests ──

describe('tickZones — Sanctuary damage reduction', () => {
  it('should apply damageReduction status effect to ally in radius', () => {
    const caster = createHero({ x: 400, y: 300 })
    const ally = createHero({ x: 450, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    tickZones(zones, heroes, 0.016)

    const effect = ally.statusEffects.get('zone-1')
    expect(effect).toBeDefined()
    expect(effect!.buffType).toBe('damageReduction')
    expect(effect!.value).toBe(0.25)
    expect(effect!.isDebuff).toBe(false)
  })

  it('should NOT apply damageReduction to enemy in radius', () => {
    const caster = createHero({ x: 400, y: 300 })
    const enemy = createHero({ x: 450, y: 300, team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createSanctuaryZone('caster-1', 'blue', 400, 300))

    tickZones(zones, heroes, 0.016)

    expect(enemy.statusEffects.get('zone-1')).toBeUndefined()
  })
})
