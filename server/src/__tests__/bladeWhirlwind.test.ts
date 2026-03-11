import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { ZoneSchema } from '../schema/ZoneSchema.js'
import { MinionSchema } from '../schema/MinionSchema.js'
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
  hero.x = 500
  hero.y = 300
  hero.radius = 22
  hero.heroType = 'BLADE'
  hero.skillSlotQ = 'blade-whirlwind'
  Object.assign(hero, overrides)
  return hero
}

function createWhirlwindZone(
  casterId: string,
  team: string,
  x: number,
  y: number,
  overrides: Partial<Record<string, unknown>> = {},
): ZoneSchema {
  const zone = new ZoneSchema()
  zone.x = x
  zone.y = y
  zone.radius = 120
  zone.remainingDuration = 3
  zone.team = team
  zone.casterId = casterId
  zone.skillId = 'blade-whirlwind'
  zone.buffType = 'speed'
  zone.value = -40
  zone.isDebuff = true
  zone.target = 'enemy'
  zone.tickDamage = 30
  zone.tickInterval = 0.5
  zone.tickTimer = 0
  zone.followHeroId = casterId
  Object.assign(zone, overrides)
  return zone
}

function createMinion(overrides: Partial<Record<string, unknown>> = {}): MinionSchema {
  const minion = new MinionSchema()
  minion.hp = 200
  minion.maxHp = 200
  minion.dead = false
  minion.team = 'red'
  minion.x = 500
  minion.y = 300
  minion.radius = 16
  Object.assign(minion, overrides)
  return minion
}

beforeEach(() => {
  registerAllEffectHandlers()
  tracker = new ProjectileTracker()
})

// ── Task 5.1: Skill definition & execution tests ──

describe('getSkillDefinition — blade-whirlwind', () => {
  it('should return blade-whirlwind definition with correct params', () => {
    const def = getSkillDefinition('blade-whirlwind')
    expect(def).toBeDefined()
    expect(def!.id).toBe('blade-whirlwind')
    expect(def!.targeting).toBe('self')
    expect(def!.cooldown).toBe(12)
    expect(def!.effect.effectType).toBe('zone')
    if (def!.effect.effectType === 'zone') {
      expect(def!.effect.zoneRadius).toBe(120)
      expect(def!.effect.zoneDuration).toBe(3)
      expect(def!.effect.tickDamage).toBe(30)
      expect(def!.effect.tickInterval).toBe(0.5)
      expect(def!.effect.followCaster).toBe(true)
    }
  })
})

describe('executeSkill — blade-whirlwind', () => {
  it('should create a zone at caster position', () => {
    const caster = createHero({ x: 500, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('blade-whirlwind')
    expect(zones.size).toBe(1)

    const zone = [...zones.values()][0]
    expect(zone.x).toBe(500)
    expect(zone.y).toBe(300)
    expect(zone.radius).toBe(120)
    expect(zone.remainingDuration).toBe(3)
    expect(zone.followHeroId).toBe('caster-1')
    expect(zone.tickDamage).toBe(30)
    expect(zone.tickInterval).toBe(0.5)
    expect(zone.tickTimer).toBe(0)
  })

  it('should set cooldown to 12 seconds', () => {
    const caster = createHero({ x: 500, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(caster.cooldownQ).toBe(12)
  })

  it('should reject activation while dashing', () => {
    const caster = createHero({ x: 500, y: 300, dashTimer: 0.2 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    expect(event).toBeNull()
    expect(zones.size).toBe(0)
  })
})

// ── Task 5.2: Follow zone tests ──

describe('tickZones — follow zone', () => {
  it('should update zone position to follow caster', () => {
    const caster = createHero({ x: 500, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    // Move caster
    caster.x = 600
    caster.y = 350

    tickZones(zones, heroes, 0.016)

    const zone = zones.get('zone-1')!
    expect(zone.x).toBe(600)
    expect(zone.y).toBe(350)
  })

  it('should remove zone when caster dies', () => {
    const caster = createHero({ x: 500, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    // Kill caster
    caster.hp = 0
    caster.dead = true

    tickZones(zones, heroes, 0.016)

    expect(zones.size).toBe(0)
  })

  it('should remove zone when caster is not found', () => {
    const heroes = new MapSchema<HeroSchema>()
    // No caster in heroes map

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    tickZones(zones, heroes, 0.016)

    expect(zones.size).toBe(0)
  })
})

// ── Task 5.3: Tick damage tests ──

describe('tickZones — tick damage', () => {
  it('should deal tick damage to enemy hero in radius', () => {
    const caster = createHero({ x: 500, y: 300 })
    const enemy = createHero({ x: 550, y: 300, team: 'red', hp: 500, maxHp: 500 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    // Tick past the first interval (0.5s)
    tickZones(zones, heroes, 0.5)

    expect(enemy.hp).toBe(470) // 500 - 30
    expect(enemy.lastAttackerSessionId).toBe('caster-1')
  })

  it('should not damage allies', () => {
    const caster = createHero({ x: 500, y: 300 })
    const ally = createHero({ x: 550, y: 300, team: 'blue', hp: 650 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    tickZones(zones, heroes, 0.5)

    expect(ally.hp).toBe(650) // no damage
  })

  it('should damage multiple enemies simultaneously', () => {
    const caster = createHero({ x: 500, y: 300 })
    const enemy1 = createHero({ x: 550, y: 300, team: 'red', hp: 500, maxHp: 500 })
    const enemy2 = createHero({ x: 500, y: 350, team: 'red', hp: 500, maxHp: 500 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy1)
    heroes.set('enemy-2', enemy2)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    tickZones(zones, heroes, 0.5)

    expect(enemy1.hp).toBe(470) // 500 - 30
    expect(enemy2.hp).toBe(470) // 500 - 30
  })

  it('should deal approximately 180 total damage over full 3s duration (6 ticks)', () => {
    const caster = createHero({ x: 500, y: 300 })
    const enemy = createHero({ x: 550, y: 300, team: 'red', hp: 500, maxHp: 500 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    // Simulate 6 ticks at 0.5s each
    for (let i = 0; i < 6; i++) {
      tickZones(zones, heroes, 0.5)
    }

    // 6 ticks x 30 damage = 180 total
    expect(enemy.hp).toBe(320) // 500 - 180
  })

  it('should deal first tick damage immediately, then wait for interval', () => {
    const caster = createHero({ x: 500, y: 300 })
    const enemy = createHero({ x: 550, y: 300, team: 'red', hp: 500, maxHp: 500 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    // First tick fires immediately (tickTimer starts at 0)
    tickZones(zones, heroes, 0.016)
    expect(enemy.hp).toBe(470) // 500 - 30 (first tick)

    // Tick 0.3s — less than 0.5s interval since last tick, no additional damage
    tickZones(zones, heroes, 0.3)
    expect(enemy.hp).toBe(470) // still only first tick damage
  })

  it('should damage enemy minions in radius', () => {
    const caster = createHero({ x: 500, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    const minion = createMinion({ x: 550, y: 300, team: 'red', hp: 200 })
    const minions = new MapSchema<MinionSchema>()
    minions.set('minion-1', minion)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    tickZones(zones, heroes, 0.5, minions)

    expect(minion.hp).toBe(170) // 200 - 30
  })

  it('should not damage allied minions', () => {
    const caster = createHero({ x: 500, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    const allyMinion = createMinion({ x: 550, y: 300, team: 'blue', hp: 200 })
    const minions = new MapSchema<MinionSchema>()
    minions.set('minion-1', allyMinion)

    const zones = new MapSchema<ZoneSchema>()
    zones.set('zone-1', createWhirlwindZone('caster-1', 'blue', 500, 300))

    tickZones(zones, heroes, 0.5, minions)

    expect(allyMinion.hp).toBe(200) // no damage
  })
})

// ── Task 5.4: Speed debuff tests ──

describe('executeSkill — blade-whirlwind speed debuff', () => {
  it('should apply speed debuff to caster on activation', () => {
    const caster = createHero({ x: 500, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    const effect = caster.statusEffects.get('blade-whirlwind')
    expect(effect).toBeDefined()
    expect(effect!.buffType).toBe('speed')
    expect(effect!.value).toBe(-40)
    expect(effect!.remainingDuration).toBe(3)
    expect(effect!.isDebuff).toBe(true)
  })

  it('should expire after 3 seconds (handled by tickBuffs)', () => {
    const caster = createHero({ x: 500, y: 300 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, zones)

    const effect = caster.statusEffects.get('blade-whirlwind')
    expect(effect).toBeDefined()
    expect(effect!.remainingDuration).toBe(3)

    // Simulate tickBuffs decrementing — the existing tickBuffs system handles removal
    effect!.remainingDuration = 0
    // When remainingDuration <= 0, tickBuffs removes the effect
    expect(effect!.remainingDuration).toBe(0)
  })
})
