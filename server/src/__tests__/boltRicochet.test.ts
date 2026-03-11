import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { ZoneSchema } from '../schema/ZoneSchema.js'
import { executeSkill } from '../game/ServerSkillExecutionSystem.js'
import { registerAllEffectHandlers } from '../game/skills/handlers/index.js'
import { getSkillDefinition } from '@shared/skills/skillDefinitions'
import { ProjectileTracker } from '../game/ProjectileTracker.js'
import { processProjectiles } from '../game/ServerProjectileSystem.js'
import { BOLT_TALENT_TREE } from '@shared/talents/boltTalents'

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
  hero.skillSlotQ = 'bolt-ricochet'
  Object.assign(hero, overrides)
  return hero
}

function createEnemy(id: string, x: number, y: number): HeroSchema {
  const hero = new HeroSchema()
  hero.id = id
  hero.hp = 500
  hero.maxHp = 500
  hero.dead = false
  hero.team = 'red'
  hero.x = x
  hero.y = y
  hero.radius = 22
  return hero
}

beforeEach(() => {
  registerAllEffectHandlers()
  tracker = new ProjectileTracker()
})

// ── Skill definition ──

describe('getSkillDefinition — bolt-ricochet', () => {
  it('should return bolt-ricochet definition with correct params', () => {
    const def = getSkillDefinition('bolt-ricochet')
    expect(def).toBeDefined()
    expect(def!.id).toBe('bolt-ricochet')
    expect(def!.targeting).toBe('direction')
    expect(def!.cooldown).toBe(8)
    expect(def!.effect.effectType).toBe('projectile')
    if (def!.effect.effectType === 'projectile') {
      expect(def!.effect.damage).toBe(50)
      expect(def!.effect.speed).toBe(700)
      expect(def!.effect.range).toBe(500)
      expect(def!.effect.radius).toBe(5)
      expect(def!.effect.pierceCount).toBe(0)
      expect(def!.effect.homing).toBe(false)
      expect(def!.effect.visualType).toBe('diamond')
      expect(def!.effect.bounceCount).toBe(3)
      expect(def!.effect.bounceRange).toBe(300)
    }
  })
})

// ── Skill execution ──

describe('executeSkill — bolt-ricochet', () => {
  it('should create a projectile with bounce fields set', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, projectiles, heroes, tracker, zones)

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('bolt-ricochet')
    expect(projectiles.size).toBe(1)

    const proj = [...projectiles.values()][0]
    expect(proj.bounceRemaining).toBe(3)
    expect(proj.bounceRange).toBe(300)
    expect(proj.mode).toBe('linear')
    expect(proj.damage).toBe(50)
    expect(proj.speed).toBe(700)
    expect(proj.visualType).toBe('diamond')
  })

  it('should set cooldown to 8 seconds', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 300 }, projectiles, heroes, tracker, zones)

    expect(caster.cooldownQ).toBe(8)
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
})

// ── Bounce behavior ──

describe('processProjectiles — bounce', () => {
  it('should redirect projectile toward nearest unhit enemy on hit', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const projectiles = new MapSchema<ProjectileSchema>()

    // Enemy 1 directly ahead, Enemy 2 nearby
    const enemy1 = createEnemy('enemy-1', 200, 100)
    const enemy2 = createEnemy('enemy-2', 300, 100)
    heroes.set('enemy-1', enemy1)
    heroes.set('enemy-2', enemy2)

    // Projectile heading right toward enemy1
    const proj = new ProjectileSchema()
    proj.id = 'bounce-proj'
    proj.x = 170
    proj.y = 100
    proj.dirX = 1
    proj.dirY = 0
    proj.speed = 1000
    proj.damage = 50
    proj.ownerId = 'caster'
    proj.team = 'blue'
    proj.mode = 'linear'
    proj.maxRange = 500
    proj.bounceRemaining = 3
    proj.bounceRange = 300
    proj.pierceRemaining = 0
    proj.radius = 5
    projectiles.set(proj.id, proj)

    // Tick — should hit enemy1 and redirect toward enemy2
    const events = processProjectiles(projectiles, heroes, towers, 0.05, tracker)

    expect(events).toHaveLength(1)
    expect(events[0].event.targetId).toBe('enemy-1')
    expect(projectiles.size).toBe(1) // still alive
    expect(proj.bounceRemaining).toBe(2) // decremented

    // Direction should now point toward enemy2
    const dx = enemy2.x - proj.x
    const dy = enemy2.y - proj.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    expect(proj.dirX).toBeCloseTo(dx / dist, 2)
    expect(proj.dirY).toBeCloseTo(dy / dist, 2)
  })

  it('should reset distanceTraveled on bounce', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const projectiles = new MapSchema<ProjectileSchema>()

    const enemy1 = createEnemy('enemy-1', 200, 100)
    const enemy2 = createEnemy('enemy-2', 400, 100)
    heroes.set('enemy-1', enemy1)
    heroes.set('enemy-2', enemy2)

    const proj = new ProjectileSchema()
    proj.id = 'bounce-dist'
    proj.x = 170
    proj.y = 100
    proj.dirX = 1
    proj.dirY = 0
    proj.speed = 1000
    proj.damage = 50
    proj.ownerId = 'caster'
    proj.team = 'blue'
    proj.mode = 'linear'
    proj.maxRange = 500
    proj.bounceRemaining = 2
    proj.bounceRange = 500
    proj.pierceRemaining = 0
    proj.radius = 5
    projectiles.set(proj.id, proj)

    // Pre-set some distance traveled
    tracker.setDistanceTraveled(proj.id, 100)

    processProjectiles(projectiles, heroes, towers, 0.05, tracker)

    // After bounce, distance should be reset (close to 0 + movement in this tick)
    const traveled = tracker.getDistanceTraveled(proj.id)
    expect(traveled).toBeLessThan(10) // was 100, now reset
  })

  it('should remove projectile when no bounce target available', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const projectiles = new MapSchema<ProjectileSchema>()

    // Only one enemy, no one to bounce to
    const enemy1 = createEnemy('enemy-1', 200, 100)
    heroes.set('enemy-1', enemy1)

    const proj = new ProjectileSchema()
    proj.id = 'bounce-none'
    proj.x = 170
    proj.y = 100
    proj.dirX = 1
    proj.dirY = 0
    proj.speed = 1000
    proj.damage = 50
    proj.ownerId = 'caster'
    proj.team = 'blue'
    proj.mode = 'linear'
    proj.maxRange = 500
    proj.bounceRemaining = 2
    proj.bounceRange = 300
    proj.pierceRemaining = 0
    proj.radius = 5
    projectiles.set(proj.id, proj)

    const events = processProjectiles(projectiles, heroes, towers, 0.05, tracker)

    expect(events).toHaveLength(1)
    expect(events[0].event.targetId).toBe('enemy-1')
    expect(projectiles.size).toBe(0) // removed — no bounce target
  })

  it('should exclude previously hit enemies from bounce targets', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const projectiles = new MapSchema<ProjectileSchema>()

    // Two enemies: one already hit, one new
    const enemy1 = createEnemy('enemy-1', 200, 100)
    const enemy2 = createEnemy('enemy-2', 250, 100) // closer but already hit
    const enemy3 = createEnemy('enemy-3', 350, 100) // farther but unhit
    heroes.set('enemy-1', enemy1)
    heroes.set('enemy-2', enemy2)
    heroes.set('enemy-3', enemy3)

    const proj = new ProjectileSchema()
    proj.id = 'bounce-excl'
    proj.x = 170
    proj.y = 100
    proj.dirX = 1
    proj.dirY = 0
    proj.speed = 1000
    proj.damage = 50
    proj.ownerId = 'caster'
    proj.team = 'blue'
    proj.mode = 'linear'
    proj.maxRange = 500
    proj.bounceRemaining = 2
    proj.bounceRange = 500
    proj.pierceRemaining = 0
    proj.radius = 5
    projectiles.set(proj.id, proj)

    // Pre-mark enemy2 as already hit
    tracker.getHitSet(proj.id).add('enemy-2')

    // Hit enemy1 → should bounce to enemy3 (not enemy2)
    processProjectiles(projectiles, heroes, towers, 0.05, tracker)

    expect(projectiles.size).toBe(1)
    // Direction should point toward enemy3, not enemy2
    const dx = enemy3.x - proj.x
    const dy = enemy3.y - proj.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    expect(proj.dirX).toBeCloseTo(dx / dist, 1)
  })

  it('should remove projectile when bounceRemaining reaches 0', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const projectiles = new MapSchema<ProjectileSchema>()

    const enemy1 = createEnemy('enemy-1', 200, 100)
    const enemy2 = createEnemy('enemy-2', 300, 100)
    heroes.set('enemy-1', enemy1)
    heroes.set('enemy-2', enemy2)

    const proj = new ProjectileSchema()
    proj.id = 'bounce-zero'
    proj.x = 170
    proj.y = 100
    proj.dirX = 1
    proj.dirY = 0
    proj.speed = 1000
    proj.damage = 50
    proj.ownerId = 'caster'
    proj.team = 'blue'
    proj.mode = 'linear'
    proj.maxRange = 500
    proj.bounceRemaining = 0 // no bounces left
    proj.bounceRange = 300
    proj.pierceRemaining = 0
    proj.radius = 5
    projectiles.set(proj.id, proj)

    const events = processProjectiles(projectiles, heroes, towers, 0.05, tracker)

    expect(events).toHaveLength(1)
    expect(projectiles.size).toBe(0) // removed — bounceRemaining was 0
  })

  it('should remove projectile when bounce target is out of bounceRange', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const projectiles = new MapSchema<ProjectileSchema>()

    const enemy1 = createEnemy('enemy-1', 200, 100)
    const enemy2 = createEnemy('enemy-2', 800, 100) // too far (600px away)
    heroes.set('enemy-1', enemy1)
    heroes.set('enemy-2', enemy2)

    const proj = new ProjectileSchema()
    proj.id = 'bounce-range'
    proj.x = 170
    proj.y = 100
    proj.dirX = 1
    proj.dirY = 0
    proj.speed = 1000
    proj.damage = 50
    proj.ownerId = 'caster'
    proj.team = 'blue'
    proj.mode = 'linear'
    proj.maxRange = 500
    proj.bounceRemaining = 2
    proj.bounceRange = 300 // enemy2 is 600px away, out of range
    proj.pierceRemaining = 0
    proj.radius = 5
    projectiles.set(proj.id, proj)

    processProjectiles(projectiles, heroes, towers, 0.05, tracker)

    expect(projectiles.size).toBe(0) // removed — no target in range
  })

  it('bounce should take priority over pierce when both are set', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const projectiles = new MapSchema<ProjectileSchema>()

    const enemy1 = createEnemy('enemy-1', 200, 100)
    const enemy2 = createEnemy('enemy-2', 300, 100)
    heroes.set('enemy-1', enemy1)
    heroes.set('enemy-2', enemy2)

    const proj = new ProjectileSchema()
    proj.id = 'bounce-priority'
    proj.x = 170
    proj.y = 100
    proj.dirX = 1
    proj.dirY = 0
    proj.speed = 1000
    proj.damage = 50
    proj.ownerId = 'caster'
    proj.team = 'blue'
    proj.mode = 'linear'
    proj.maxRange = 500
    proj.bounceRemaining = 2
    proj.bounceRange = 300
    proj.pierceRemaining = 3 // both set
    proj.radius = 5
    projectiles.set(proj.id, proj)

    processProjectiles(projectiles, heroes, towers, 0.05, tracker)

    // Bounce should have fired, not pierce
    expect(proj.bounceRemaining).toBe(1) // decremented by bounce
    expect(proj.pierceRemaining).toBe(3) // untouched — bounce took priority
    expect(projectiles.size).toBe(1) // still alive after bounce
  })
})

// ── Talent node ──

describe('BOLT talent tree — bolt-ricochet node', () => {
  it('should have bolt-ricochet node with correct properties', () => {
    const node = BOLT_TALENT_TREE.nodes.find(n => n.id === 'bolt-ricochet')
    expect(node).toBeDefined()
    expect(node!.cost).toBe(2)
    expect(node!.prerequisites).toEqual(['bolt-quickdraw'])
    expect(node!.effects).toEqual([{ type: 'grant_skill', skillId: 'bolt-ricochet' }])
  })
})
