import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { MinionSchema } from '../schema/MinionSchema.js'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import {
  createMinionSystemContext,
  spawnMinionWave,
  processMinionBehavior,
  applyMinionSeparation,
  processMinionDeaths,
  type MinionSystemContext,
} from '../game/ServerMinionSystem.js'
import {
  MINION_WAVE_INTERVAL,
  MINION_XP_REWARD,
  XP_GRANT_RANGE,
  MINION_DEATH_CLEANUP_DELAY,
  BLUE_MELEE_X,
  RED_MELEE_X,
  MELEE_Y_OFFSETS,
} from '@shared/constants'
import { MELEE_MINION } from '@shared/entities/Minion'

function createMinion(overrides: Partial<Record<string, unknown>> = {}): MinionSchema {
  const m = new MinionSchema()
  m.id = 'minion-1'
  m.x = 500
  m.y = 360
  m.hp = 100
  m.maxHp = 100
  m.speed = 80
  m.attackDamage = 10
  m.attackRange = 60
  m.attackSpeed = 0.8
  m.radius = 8
  m.projectileSpeed = 0
  m.projectileRadius = 0
  m.team = 'blue'
  m.minionType = 'melee'
  m.facing = 0
  m.attackCooldown = 0
  m.attackTargetId = ''
  m.dead = false
  Object.assign(m, overrides)
  return m
}

function createHero(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
  const h = new HeroSchema()
  h.id = 'hero-1'
  h.x = 500
  h.y = 360
  h.hp = 650
  h.maxHp = 650
  h.speed = 170
  h.attackDamage = 60
  h.attackRange = 60
  h.attackSpeed = 0.8
  h.radius = 16
  h.team = 'blue'
  h.dead = false
  h.level = 0
  h.xp = 0
  Object.assign(h, overrides)
  return h
}

// ==========================================
// MinionSystemContext
// ==========================================

describe('MinionSystemContext', () => {
  it('should create fresh context with zero counters', () => {
    const ctx = createMinionSystemContext()
    expect(ctx.waveCounter).toBe(0)
    expect(ctx.minionProjectileIdCounter).toBe(0)
    expect(ctx.deathTimers.size).toBe(0)
  })
})

// ==========================================
// spawnMinionWave
// ==========================================

describe('spawnMinionWave', () => {
  let ctx: MinionSystemContext
  let minions: MapSchema<MinionSchema>

  beforeEach(() => {
    ctx = createMinionSystemContext()
    minions = new MapSchema<MinionSchema>()
  })

  it('should not spawn if matchTime < nextWaveTime', () => {
    const result = spawnMinionWave(ctx, 5, 30, minions, MinionSchema)
    expect(result).toBe(30)
    expect(minions.size).toBe(0)
  })

  it('should spawn minions for both teams when matchTime >= nextWaveTime', () => {
    spawnMinionWave(ctx, 30, 30, minions, MinionSchema)
    expect(minions.size).toBeGreaterThan(0)

    // Should have both blue and red minions
    let blueCount = 0
    let redCount = 0
    minions.forEach((m) => {
      if (m.team === 'blue') blueCount++
      else redCount++
    })
    expect(blueCount).toBeGreaterThan(0)
    expect(redCount).toBeGreaterThan(0)
    expect(blueCount).toBe(redCount)
  })

  it('should return next wave time = matchTime + MINION_WAVE_INTERVAL', () => {
    const result = spawnMinionWave(ctx, 30, 30, minions, MinionSchema)
    expect(result).toBe(30 + MINION_WAVE_INTERVAL)
  })

  it('should increment waveCounter', () => {
    spawnMinionWave(ctx, 30, 30, minions, MinionSchema)
    expect(ctx.waveCounter).toBe(1)

    spawnMinionWave(ctx, 60, 60, minions, MinionSchema)
    expect(ctx.waveCounter).toBe(2)
  })

  it('should spawn melee minions at correct X positions', () => {
    spawnMinionWave(ctx, 30, 30, minions, MinionSchema)

    const blueMelee: MinionSchema[] = []
    const redMelee: MinionSchema[] = []
    minions.forEach((m) => {
      if (m.minionType === 'melee') {
        if (m.team === 'blue') blueMelee.push(m)
        else redMelee.push(m)
      }
    })

    for (const m of blueMelee) expect(m.x).toBe(BLUE_MELEE_X)
    for (const m of redMelee) expect(m.x).toBe(RED_MELEE_X)
  })

  it('should spawn melee minions at Y offsets', () => {
    spawnMinionWave(ctx, 30, 30, minions, MinionSchema)

    const blueMelee: MinionSchema[] = []
    minions.forEach((m) => {
      if (m.minionType === 'melee' && m.team === 'blue') blueMelee.push(m)
    })

    const ys = blueMelee.map((m) => m.y).sort((a, b) => a - b)
    const expected = [...MELEE_Y_OFFSETS].sort((a, b) => a - b)
    expect(ys).toEqual(expected)
  })

  it('should set correct stats from MELEE_MINION definition', () => {
    spawnMinionWave(ctx, 30, 30, minions, MinionSchema)

    let melee: MinionSchema | null = null
    minions.forEach((m) => {
      if (m.minionType === 'melee' && !melee) melee = m
    })

    expect(melee).not.toBeNull()
    expect(melee!.hp).toBe(MELEE_MINION.stats.maxHp)
    expect(melee!.maxHp).toBe(MELEE_MINION.stats.maxHp)
    expect(melee!.speed).toBe(MELEE_MINION.stats.speed)
    expect(melee!.attackRange).toBe(MELEE_MINION.stats.attackRange)
    expect(melee!.radius).toBe(MELEE_MINION.radius)
  })

  it('should set blue minion facing to 0 and red to PI', () => {
    spawnMinionWave(ctx, 30, 30, minions, MinionSchema)

    minions.forEach((m) => {
      if (m.team === 'blue') expect(m.facing).toBe(0)
      else expect(m.facing).toBeCloseTo(Math.PI, 5)
    })
  })
})

// ==========================================
// processMinionBehavior (March / Chase / Attack)
// ==========================================

describe('processMinionBehavior', () => {
  let ctx: MinionSystemContext
  let minions: MapSchema<MinionSchema>
  let heroes: MapSchema<HeroSchema>
  let towers: MapSchema<TowerSchema>
  let projectiles: MapSchema<ProjectileSchema>

  beforeEach(() => {
    ctx = createMinionSystemContext()
    minions = new MapSchema<MinionSchema>()
    heroes = new MapSchema<HeroSchema>()
    towers = new MapSchema<TowerSchema>()
    projectiles = new MapSchema<ProjectileSchema>()
  })

  describe('March state', () => {
    it('should move blue minion to the right when no enemies nearby', () => {
      const m = createMinion({ id: 'm1', team: 'blue', x: 500, y: 360 })
      minions.set('m1', m)

      processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      expect(m.x).toBeGreaterThan(500)
      expect(m.attackTargetId).toBe('')
    })

    it('should move red minion to the left when no enemies nearby', () => {
      const m = createMinion({ id: 'm1', team: 'red', x: 500, y: 360 })
      minions.set('m1', m)

      processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      expect(m.x).toBeLessThan(500)
    })

    it('should set facing to 0 for blue and PI for red while marching', () => {
      const blue = createMinion({ id: 'b1', team: 'blue', x: 100 })
      const red = createMinion({ id: 'r1', team: 'red', x: 3000 })
      minions.set('b1', blue)
      minions.set('r1', red)

      processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      expect(blue.facing).toBe(0)
      expect(red.facing).toBeCloseTo(Math.PI, 5)
    })
  })

  describe('Chase state', () => {
    it('should move toward enemy within detection range but out of attack range', () => {
      // Minion at (500, 360), enemy hero at (640, 360) — ~140px apart (within 200 detect, outside 60 attack)
      const m = createMinion({ id: 'm1', team: 'blue', x: 500, y: 360, attackRange: 60 })
      const enemy = createHero({ id: 'h1', team: 'red', x: 640, y: 360 })
      minions.set('m1', m)
      heroes.set('h1', enemy)

      processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      expect(m.x).toBeGreaterThan(500)
      expect(m.attackTargetId).toBe('h1')
    })
  })

  describe('Attack state', () => {
    it('should attack enemy within attack range (melee)', () => {
      const m = createMinion({ id: 'm1', team: 'blue', x: 500, y: 360, attackRange: 60 })
      const enemy = createMinion({ id: 'm2', team: 'red', x: 530, y: 360 })
      minions.set('m1', m)
      minions.set('m2', enemy)

      const events = processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      expect(m.attackTargetId).toBe('m2')
      expect(events.some((e) => e.kind === 'attack')).toBe(true)
      expect(events.some((e) => e.kind === 'damage')).toBe(true)
      expect(enemy.hp).toBeLessThan(100)
    })

    it('should spawn projectile for ranged minion attack', () => {
      const m = createMinion({
        id: 'm1', team: 'blue', x: 500, y: 360,
        attackRange: 200, projectileSpeed: 400, minionType: 'ranged',
      })
      const enemy = createMinion({ id: 'm2', team: 'red', x: 600, y: 360 })
      minions.set('m1', m)
      minions.set('m2', enemy)

      const events = processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      expect(projectiles.size).toBe(1)
      expect(events.some((e) => e.kind === 'attack')).toBe(true)
      // Ranged attack should NOT emit damage event (damage happens on projectile hit)
      expect(events.some((e) => e.kind === 'damage')).toBe(false)
    })

    it('should respect attack cooldown', () => {
      const m = createMinion({ id: 'm1', team: 'blue', x: 500, y: 360, attackCooldown: 2.0 })
      // Enemy also on cooldown so it doesn't generate its own attack events
      const enemy = createMinion({ id: 'm2', team: 'red', x: 530, y: 360, attackCooldown: 2.0 })
      minions.set('m1', m)
      minions.set('m2', enemy)

      const events = processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 0.5)

      // Neither should attack while on cooldown
      expect(events.filter((e) => e.kind === 'attack')).toHaveLength(0)
      expect(m.attackCooldown).toBeCloseTo(1.5, 2)
    })

    it('should not target same-team entities', () => {
      const m = createMinion({ id: 'm1', team: 'blue', x: 500, y: 360 })
      const ally = createMinion({ id: 'm2', team: 'blue', x: 530, y: 360 })
      minions.set('m1', m)
      minions.set('m2', ally)

      processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      // Should march, not attack ally
      expect(m.attackTargetId).toBe('')
    })

    it('should apply damage to hero target and clear lastAttackerSessionId', () => {
      const m = createMinion({ id: 'm1', team: 'blue', x: 500, y: 360 })
      const enemy = createHero({ id: 'h1', team: 'red', x: 530, y: 360, lastAttackerSessionId: 'some-hero' })
      minions.set('m1', m)
      heroes.set('h1', enemy)

      processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      expect(enemy.hp).toBeLessThan(650)
      expect(enemy.lastAttackerSessionId).toBe('')
    })
  })

  describe('Dead minion', () => {
    it('should skip dead minions and clear their attack state', () => {
      const m = createMinion({ id: 'm1', dead: true, hp: 0, attackTargetId: 'old', attackCooldown: 1.0 })
      minions.set('m1', m)

      processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      expect(m.attackTargetId).toBe('')
      expect(m.attackCooldown).toBe(0)
    })

    it('should not target dead enemies', () => {
      const m = createMinion({ id: 'm1', team: 'blue', x: 500, y: 360 })
      const dead = createMinion({ id: 'm2', team: 'red', x: 530, y: 360, dead: true, hp: 0 })
      minions.set('m1', m)
      minions.set('m2', dead)

      processMinionBehavior(ctx, minions, heroes, towers, projectiles, ProjectileSchema, 1.0)

      expect(m.attackTargetId).toBe('')
    })
  })
})

// ==========================================
// applyMinionSeparation
// ==========================================

describe('applyMinionSeparation', () => {
  let minions: MapSchema<MinionSchema>

  beforeEach(() => {
    minions = new MapSchema<MinionSchema>()
  })

  it('should push overlapping same-team minions apart', () => {
    const a = createMinion({ id: 'a', team: 'blue', x: 500, y: 360, radius: 8 })
    const b = createMinion({ id: 'b', team: 'blue', x: 505, y: 360, radius: 8 })
    minions.set('a', a)
    minions.set('b', b)

    applyMinionSeparation(minions)

    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    expect(dist).toBeGreaterThanOrEqual(8 + 8 + 2 - 0.01) // radii + SEPARATION_MIN_DIST
  })

  it('should not affect non-overlapping minions', () => {
    const a = createMinion({ id: 'a', team: 'blue', x: 500, y: 360 })
    const b = createMinion({ id: 'b', team: 'blue', x: 600, y: 360 })
    minions.set('a', a)
    minions.set('b', b)

    applyMinionSeparation(minions)

    expect(a.x).toBe(500)
    expect(b.x).toBe(600)
  })

  it('should not separate minions from different teams', () => {
    const a = createMinion({ id: 'a', team: 'blue', x: 500, y: 360 })
    const b = createMinion({ id: 'b', team: 'red', x: 505, y: 360 })
    minions.set('a', a)
    minions.set('b', b)

    const ax = a.x
    const bx = b.x
    applyMinionSeparation(minions)

    expect(a.x).toBe(ax)
    expect(b.x).toBe(bx)
  })

  it('should displace later-spawned minion (higher ID)', () => {
    const a = createMinion({ id: 'minion-blue-0-melee-0', team: 'blue', x: 500, y: 360, radius: 8 })
    const b = createMinion({ id: 'minion-blue-1-melee-0', team: 'blue', x: 500, y: 360, radius: 8 })
    minions.set(a.id, a)
    minions.set(b.id, b)

    applyMinionSeparation(minions)

    // Earlier minion should stay, later one should move
    expect(a.x).toBe(500)
    expect(a.y).toBe(360)
    // b should have been displaced
    const moved = b.x !== 500 || b.y !== 360
    expect(moved).toBe(true)
  })

  it('should skip dead minions', () => {
    const a = createMinion({ id: 'a', team: 'blue', x: 500, y: 360, dead: true, hp: 0 })
    const b = createMinion({ id: 'b', team: 'blue', x: 505, y: 360 })
    minions.set('a', a)
    minions.set('b', b)

    applyMinionSeparation(minions)

    expect(b.x).toBe(505)
  })
})

// ==========================================
// processMinionDeaths
// ==========================================

describe('processMinionDeaths', () => {
  let ctx: MinionSystemContext
  let minions: MapSchema<MinionSchema>
  let heroes: MapSchema<HeroSchema>

  beforeEach(() => {
    ctx = createMinionSystemContext()
    minions = new MapSchema<MinionSchema>()
    heroes = new MapSchema<HeroSchema>()
  })

  it('should detect newly dead minion and emit death event', () => {
    const m = createMinion({ id: 'm1', dead: true, hp: 0, attackTargetId: 'old' })
    minions.set('m1', m)

    const events = processMinionDeaths(ctx, minions, heroes, 0.1)

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      kind: 'death',
      event: { entityId: 'm1', type: 'death' },
    })
    expect(m.attackTargetId).toBe('')
  })

  it('should start cleanup timer for dead minion', () => {
    const m = createMinion({ id: 'm1', dead: true, hp: 0 })
    minions.set('m1', m)

    // deltaTime=0 so the timer is set but not decremented in the same call
    processMinionDeaths(ctx, minions, heroes, 0)

    expect(ctx.deathTimers.has('m1')).toBe(true)
    expect(ctx.deathTimers.get('m1')).toBe(MINION_DEATH_CLEANUP_DELAY)
  })

  it('should not re-detect already-tracked dead minion', () => {
    const m = createMinion({ id: 'm1', dead: true, hp: 0 })
    minions.set('m1', m)

    processMinionDeaths(ctx, minions, heroes, 0.1)
    const events2 = processMinionDeaths(ctx, minions, heroes, 0.01)

    // Second call should not emit another death event
    expect(events2.filter((e) => e.event.type === 'death')).toHaveLength(0)
  })

  it('should remove minion from map after cleanup delay expires', () => {
    const m = createMinion({ id: 'm1', dead: true, hp: 0 })
    minions.set('m1', m)

    // First call: detect death, start timer
    processMinionDeaths(ctx, minions, heroes, 0)

    // Tick enough time to expire the timer (MINION_DEATH_CLEANUP_DELAY is in ms, deltaTime in seconds)
    processMinionDeaths(ctx, minions, heroes, MINION_DEATH_CLEANUP_DELAY / 1000 + 0.01)

    expect(minions.has('m1')).toBe(false)
    expect(ctx.deathTimers.has('m1')).toBe(false)
  })

  it('should not remove minion before cleanup delay expires', () => {
    const m = createMinion({ id: 'm1', dead: true, hp: 0 })
    minions.set('m1', m)

    processMinionDeaths(ctx, minions, heroes, 0)
    processMinionDeaths(ctx, minions, heroes, 0.01) // Only 10ms elapsed

    expect(minions.has('m1')).toBe(true)
  })

  it('should grant XP to nearby enemy heroes', () => {
    const m = createMinion({ id: 'm1', team: 'blue', dead: true, hp: 0, x: 500, y: 360 })
    const enemy = createHero({ id: 'h1', team: 'red', x: 500 + XP_GRANT_RANGE - 10, y: 360, xp: 0 })
    minions.set('m1', m)
    heroes.set('h1', enemy)

    processMinionDeaths(ctx, minions, heroes, 0.1)

    expect(enemy.xp).toBe(MINION_XP_REWARD)
  })

  it('should split XP among multiple nearby enemy heroes', () => {
    const m = createMinion({ id: 'm1', team: 'blue', dead: true, hp: 0, x: 500, y: 360 })
    const h1 = createHero({ id: 'h1', team: 'red', x: 500, y: 360, xp: 0 })
    const h2 = createHero({ id: 'h2', team: 'red', x: 510, y: 360, xp: 0 })
    minions.set('m1', m)
    heroes.set('h1', h1)
    heroes.set('h2', h2)

    processMinionDeaths(ctx, minions, heroes, 0.1)

    const expectedEach = Math.floor(MINION_XP_REWARD / 2)
    expect(h1.xp).toBe(expectedEach)
    expect(h2.xp).toBe(expectedEach)
  })

  it('should not grant XP to same-team heroes', () => {
    const m = createMinion({ id: 'm1', team: 'blue', dead: true, hp: 0, x: 500, y: 360 })
    const ally = createHero({ id: 'h1', team: 'blue', x: 500, y: 360, xp: 0 })
    minions.set('m1', m)
    heroes.set('h1', ally)

    processMinionDeaths(ctx, minions, heroes, 0.1)

    expect(ally.xp).toBe(0)
  })

  it('should not grant XP to heroes outside XP_GRANT_RANGE', () => {
    const m = createMinion({ id: 'm1', team: 'blue', dead: true, hp: 0, x: 500, y: 360 })
    const farHero = createHero({ id: 'h1', team: 'red', x: 500 + XP_GRANT_RANGE + 100, y: 360, xp: 0 })
    minions.set('m1', m)
    heroes.set('h1', farHero)

    processMinionDeaths(ctx, minions, heroes, 0.1)

    expect(farHero.xp).toBe(0)
  })

  it('should not grant XP to dead heroes', () => {
    const m = createMinion({ id: 'm1', team: 'blue', dead: true, hp: 0, x: 500, y: 360 })
    const deadHero = createHero({ id: 'h1', team: 'red', x: 500, y: 360, xp: 0, dead: true, hp: 0 })
    minions.set('m1', m)
    heroes.set('h1', deadHero)

    processMinionDeaths(ctx, minions, heroes, 0.1)

    expect(deadHero.xp).toBe(0)
  })

  it('should not emit events for alive minions', () => {
    const m = createMinion({ id: 'm1', dead: false, hp: 50 })
    minions.set('m1', m)

    const events = processMinionDeaths(ctx, minions, heroes, 0.1)

    expect(events).toHaveLength(0)
  })
})
