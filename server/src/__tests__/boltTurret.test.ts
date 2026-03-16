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
import { processTurretLifetime } from '../game/ServerTurretLifetime.js'
import { BOLT_TALENT_TREE } from '@shared/talents/boltTalents'
import { checkTowerDestroyed } from '../game/ServerMatchSystem.js'

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
  hero.skillSlotQ = 'bolt-turret'
  Object.assign(hero, overrides)
  return hero
}

beforeEach(() => {
  registerAllEffectHandlers()
  tracker = new ProjectileTracker()
})

// ── Skill definition ──

describe('getSkillDefinition — bolt-turret', () => {
  it('should return bolt-turret definition with correct params', () => {
    const def = getSkillDefinition('bolt-turret')
    expect(def).toBeDefined()
    expect(def!.id).toBe('bolt-turret')
    expect(def!.targeting).toBe('point')
    expect(def!.cooldown).toBe(20)
    expect(def!.range).toBe(400)
    expect(def!.effect.effectType).toBe('turret')
    if (def!.effect.effectType === 'turret') {
      expect(def!.effect.hp).toBe(200)
      expect(def!.effect.duration).toBe(10)
      expect(def!.effect.attackDamage).toBe(25)
      expect(def!.effect.attackSpeed).toBe(1.5)
      expect(def!.effect.attackRange).toBe(250)
      expect(def!.effect.radius).toBe(18)
      expect(def!.effect.projectileSpeed).toBe(600)
    }
  })
})

// ── Turret spawning ──

describe('executeSkill — bolt-turret', () => {
  it('should spawn a turret at target position', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const projectiles = new MapSchema<ProjectileSchema>()
    const zones = new MapSchema<ZoneSchema>()
    const towers = new MapSchema<TowerSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 350 }, projectiles, heroes, tracker, zones, towers)

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('bolt-turret')
    expect(towers.size).toBe(1)

    const turret = [...towers.values()][0]
    expect(turret.x).toBe(500)
    expect(turret.y).toBe(350)
    expect(turret.hp).toBe(200)
    expect(turret.maxHp).toBe(200)
    expect(turret.attackDamage).toBe(25)
    expect(turret.attackSpeed).toBe(1.5)
    expect(turret.attackRange).toBe(250)
    expect(turret.radius).toBe(18)
    expect(turret.projectileSpeed).toBe(600)
    expect(turret.remainingDuration).toBe(10)
    expect(turret.ownerId).toBe('caster-1')
  })

  it('should inherit caster team', () => {
    const caster = createHero({ team: 'red' })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const towers = new MapSchema<TowerSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 350 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>(), towers)

    const turret = [...towers.values()][0]
    expect(turret.team).toBe('red')
  })

  it('should set cooldown to 20 seconds', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const towers = new MapSchema<TowerSchema>()

    executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 350 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>(), towers)

    expect(caster.cooldownQ).toBe(20)
  })

  it('should reject activation while dashing', () => {
    const caster = createHero({ dashTimer: 0.2 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const towers = new MapSchema<TowerSchema>()

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 500, y: 350 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>(), towers)

    expect(event).toBeNull()
    expect(towers.size).toBe(0)
  })

  it('should reject activation when target is out of range', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    const towers = new MapSchema<TowerSchema>()

    // Target at 900, 300 — 500px away, range is 400
    const event = executeSkill(caster, 'caster-1', 'Q', { x: 900, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>(), towers)

    expect(event).toBeNull()
    expect(towers.size).toBe(0)
  })
})

// ── Turret lifetime ──

describe('processTurretLifetime', () => {
  it('should decrement remainingDuration each tick', () => {
    const towers = new MapSchema<TowerSchema>()
    const turret = new TowerSchema()
    turret.remainingDuration = 10
    turret.ownerId = 'caster-1'
    towers.set('turret-1', turret)

    processTurretLifetime(towers, 1)

    expect(turret.remainingDuration).toBeCloseTo(9, 1)
    expect(towers.size).toBe(1) // still alive
  })

  it('should remove turret when duration expires', () => {
    const towers = new MapSchema<TowerSchema>()
    const turret = new TowerSchema()
    turret.remainingDuration = 0.5
    turret.ownerId = 'caster-1'
    towers.set('turret-1', turret)

    processTurretLifetime(towers, 1)

    expect(turret.dead).toBe(true)
    expect(towers.size).toBe(0) // removed
  })

  it('should not affect permanent map towers', () => {
    const towers = new MapSchema<TowerSchema>()
    const mapTower = new TowerSchema()
    mapTower.remainingDuration = 0 // permanent
    mapTower.hp = 1000
    towers.set('tower-1', mapTower)

    processTurretLifetime(towers, 100)

    expect(mapTower.dead).toBe(false)
    expect(towers.size).toBe(1) // still alive
  })

  it('should clean up damage-killed turrets', () => {
    const towers = new MapSchema<TowerSchema>()
    const turret = new TowerSchema()
    turret.hp = 0
    turret.maxHp = 200
    turret.dead = true
    turret.remainingDuration = 8
    turret.ownerId = 'caster-1'
    towers.set('turret-1', turret)

    processTurretLifetime(towers, 0.016)

    expect(towers.size).toBe(0) // removed because dead
  })
})

// ── Match system integration ──

describe('checkTowerDestroyed — turret safety', () => {
  it('should NOT end match when a summoned turret dies', () => {
    const towers = new MapSchema<TowerSchema>()

    // Permanent map tower (alive)
    const mapTower = new TowerSchema()
    mapTower.team = 'blue'
    mapTower.hp = 1000
    mapTower.maxHp = 1000
    towers.set('tower-blue', mapTower)

    // Dead summoned turret
    const turret = new TowerSchema()
    turret.team = 'blue'
    turret.hp = 0
    turret.dead = true
    turret.remainingDuration = 5
    turret.ownerId = 'caster-1'
    towers.set('turret-1', turret)

    let matchEnded = false
    checkTowerDestroyed(towers, () => { matchEnded = true })
    expect(matchEnded).toBe(false)
  })
})

// ── Talent node ──

describe('BOLT talent tree — bolt-turret node', () => {
  it('should have bolt-turret node with correct properties', () => {
    const node = BOLT_TALENT_TREE.nodes.find(n => n.id === 'bolt-turret')
    expect(node).toBeDefined()
    expect(node!.cost).toBe(2)
    expect(node!.prerequisites).toEqual(['bolt-minefield'])
    expect(node!.effects).toEqual([{ type: 'grant_skill', skillId: 'bolt-turret' }])
  })
})
