import { describe, it, expect } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { MinionSchema } from '../schema/MinionSchema.js'
import { processMovement } from '../game/ServerMovementSystem.js'
import { processDashDamage, cleanupDashHitSets } from '../game/ServerDashDamageSystem.js'

function createHero(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.x = 100
  hero.y = 200
  hero.hp = 650
  hero.maxHp = 650
  hero.dead = false
  hero.speed = 200
  hero.radius = 20
  hero.team = 'blue'
  hero.dashTimer = 0
  hero.dashDirX = 0
  hero.dashDirY = 0
  hero.dashSpeed = 0
  hero.dashDamage = 0
  Object.assign(hero, overrides)
  return hero
}

function createMinion(overrides: Partial<Record<string, unknown>> = {}): MinionSchema {
  const minion = new MinionSchema()
  minion.x = 300
  minion.y = 200
  minion.hp = 100
  minion.maxHp = 100
  minion.dead = false
  minion.radius = 15
  minion.team = 'red'
  Object.assign(minion, overrides)
  return minion
}

describe('dash movement (processMovement)', () => {
  it('should move hero along dash direction', () => {
    const hero = createHero({ dashTimer: 0.3, dashDirX: 1, dashDirY: 0, dashSpeed: 1000 })
    processMovement(hero, { seq: 1, moveDir: { x: -1, y: 0 }, attackTargetId: null, facing: 0 }, 0.1)
    expect(hero.x).toBeCloseTo(200) // 100 + 1 * 1000 * 0.1
    expect(hero.y).toBeCloseTo(200)
  })

  it('should decrement dash timer', () => {
    const hero = createHero({ dashTimer: 0.3, dashDirX: 1, dashDirY: 0, dashSpeed: 1000 })
    processMovement(hero, undefined, 0.1)
    expect(hero.dashTimer).toBeCloseTo(0.2)
  })

  it('should clamp dash timer to 0', () => {
    const hero = createHero({ dashTimer: 0.05, dashDirX: 1, dashDirY: 0, dashSpeed: 1000 })
    processMovement(hero, undefined, 0.1)
    expect(hero.dashTimer).toBe(0)
  })

  it('should reset dash state when dash ends naturally', () => {
    const hero = createHero({ dashTimer: 0.05, dashDirX: 1, dashDirY: 0, dashSpeed: 1000, dashDamage: 80 })
    processMovement(hero, undefined, 0.1)
    expect(hero.dashTimer).toBe(0)
    expect(hero.dashDirX).toBe(0)
    expect(hero.dashDirY).toBe(0)
    expect(hero.dashSpeed).toBe(0)
    expect(hero.dashDamage).toBe(0)
  })

  it('should ignore WASD input during dash', () => {
    const hero = createHero({ dashTimer: 0.3, dashDirX: 1, dashDirY: 0, dashSpeed: 1000 })
    const input = { seq: 1, moveDir: { x: 0, y: -1 }, attackTargetId: null, facing: Math.PI }
    processMovement(hero, input, 0.1)
    // Should move right (dash), not up (input)
    expect(hero.x).toBeCloseTo(200)
    expect(hero.y).toBeCloseTo(200)
  })

  it('should clamp position to world boundary', () => {
    // WORLD_WIDTH = 3200 from constants
    const hero = createHero({ x: 3190, dashTimer: 0.3, dashDirX: 1, dashDirY: 0, dashSpeed: 1000 })
    processMovement(hero, undefined, 0.1)
    expect(hero.x).toBe(3200)
  })

  it('should resume normal movement after dash ends', () => {
    const hero = createHero({ dashTimer: 0, dashDirX: 1, dashDirY: 0, dashSpeed: 1000 })
    const input = { seq: 1, moveDir: { x: 0, y: 1 }, attackTargetId: null, facing: 0 }
    processMovement(hero, input, 0.1)
    // Normal movement: y should increase
    expect(hero.y).toBeCloseTo(220) // 200 + 200 * 0.1
  })
})

describe('dash contact damage', () => {
  it('should damage enemy hero on collision', () => {
    const heroes = new MapSchema<HeroSchema>()
    const dasher = createHero({ x: 100, y: 200, dashTimer: 0.3, dashDamage: 80, team: 'blue' })
    const target = createHero({ x: 120, y: 200, team: 'red' }) // within collision range
    heroes.set('dasher', dasher)
    heroes.set('target', target)

    const minions = new MapSchema<MinionSchema>()
    const hitSets = new Map<string, Set<string>>()

    const events = processDashDamage(heroes, minions, hitSets)
    expect(events.length).toBe(1)
    expect(events[0].targetId).toBe('target')
    expect(events[0].sourceId).toBe('dasher')
    expect(target.hp).toBeLessThan(650)
  })

  it('should not damage same-team hero', () => {
    const heroes = new MapSchema<HeroSchema>()
    const dasher = createHero({ x: 100, y: 200, dashTimer: 0.3, dashDamage: 80, team: 'blue' })
    const ally = createHero({ x: 120, y: 200, team: 'blue' })
    heroes.set('dasher', dasher)
    heroes.set('ally', ally)

    const minions = new MapSchema<MinionSchema>()
    const hitSets = new Map<string, Set<string>>()

    const events = processDashDamage(heroes, minions, hitSets)
    expect(events.length).toBe(0)
  })

  it('should prevent duplicate hits on same target', () => {
    const heroes = new MapSchema<HeroSchema>()
    const dasher = createHero({ x: 100, y: 200, dashTimer: 0.3, dashDamage: 80, team: 'blue' })
    const target = createHero({ x: 120, y: 200, team: 'red' })
    heroes.set('dasher', dasher)
    heroes.set('target', target)

    const minions = new MapSchema<MinionSchema>()
    const hitSets = new Map<string, Set<string>>()

    processDashDamage(heroes, minions, hitSets)
    const hpAfterFirst = target.hp
    const events2 = processDashDamage(heroes, minions, hitSets)
    expect(events2.length).toBe(0)
    expect(target.hp).toBe(hpAfterFirst) // no additional damage
  })

  it('should damage enemy minion on collision', () => {
    const heroes = new MapSchema<HeroSchema>()
    const dasher = createHero({ x: 100, y: 200, dashTimer: 0.3, dashDamage: 80, team: 'blue' })
    heroes.set('dasher', dasher)

    const minions = new MapSchema<MinionSchema>()
    const minion = createMinion({ x: 120, y: 200, team: 'red' })
    minions.set('minion-1', minion)

    const hitSets = new Map<string, Set<string>>()
    const events = processDashDamage(heroes, minions, hitSets)
    expect(events.length).toBe(1)
    expect(minion.hp).toBeLessThan(100)
  })

  it('should not damage entities out of range', () => {
    const heroes = new MapSchema<HeroSchema>()
    const dasher = createHero({ x: 100, y: 200, dashTimer: 0.3, dashDamage: 80, team: 'blue' })
    const farTarget = createHero({ x: 500, y: 200, team: 'red' })
    heroes.set('dasher', dasher)
    heroes.set('far', farTarget)

    const minions = new MapSchema<MinionSchema>()
    const hitSets = new Map<string, Set<string>>()

    const events = processDashDamage(heroes, minions, hitSets)
    expect(events.length).toBe(0)
  })

  it('should skip zero-damage dashes (escape dashes)', () => {
    const heroes = new MapSchema<HeroSchema>()
    const dasher = createHero({ x: 100, y: 200, dashTimer: 0.3, dashDamage: 0, team: 'blue' })
    const target = createHero({ x: 120, y: 200, team: 'red' })
    heroes.set('dasher', dasher)
    heroes.set('target', target)

    const minions = new MapSchema<MinionSchema>()
    const hitSets = new Map<string, Set<string>>()

    const events = processDashDamage(heroes, minions, hitSets)
    expect(events.length).toBe(0)
    expect(target.hp).toBe(650)
  })
})

describe('cleanupDashHitSets', () => {
  it('should clean up hit sets when dash ends', () => {
    const heroes = new MapSchema<HeroSchema>()
    const hero = createHero({ dashTimer: 0 }) // dash ended
    heroes.set('hero-1', hero)

    const hitSets = new Map<string, Set<string>>()
    hitSets.set('hero-1', new Set(['target-1']))

    cleanupDashHitSets(heroes, hitSets)
    expect(hitSets.has('hero-1')).toBe(false)
  })

  it('should keep hit sets for ongoing dashes', () => {
    const heroes = new MapSchema<HeroSchema>()
    const hero = createHero({ dashTimer: 0.2 })
    heroes.set('hero-1', hero)

    const hitSets = new Map<string, Set<string>>()
    hitSets.set('hero-1', new Set(['target-1']))

    cleanupDashHitSets(heroes, hitSets)
    expect(hitSets.has('hero-1')).toBe(true)
  })
})
