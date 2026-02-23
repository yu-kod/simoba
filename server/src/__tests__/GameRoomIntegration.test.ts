import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import { DEFAULT_TOWER } from '@shared/entities/Tower'
import { WORLD_HEIGHT } from '@shared/constants'
import type { InputMessage } from '@shared/messages'
import { processMovement } from '../game/ServerMovementSystem.js'
import { processHeroCombat, resetProjectileIdCounter } from '../game/ServerCombatManager.js'
import { processProjectiles } from '../game/ServerProjectileSystem.js'
import { processTowerCombat, resetTowerProjectileIdCounter } from '../game/ServerTowerSystem.js'
import { processDeathAndRespawn } from '../game/ServerDeathSystem.js'

const BLUE_SPAWN = { x: 320, y: 360 }
const RED_SPAWN = { x: 2880, y: 360 }

function getSpawnPosition(team: string): { x: number; y: number } {
  return team === 'blue' ? BLUE_SPAWN : RED_SPAWN
}

function createHero(
  id: string,
  team: string,
  spawn: { x: number; y: number }
): HeroSchema {
  const hero = new HeroSchema()
  const def = HERO_DEFINITIONS.BLADE
  hero.id = id
  hero.x = spawn.x
  hero.y = spawn.y
  hero.facing = 0
  hero.team = team
  hero.heroType = 'BLADE'
  hero.hp = def.base.maxHp
  hero.maxHp = def.base.maxHp
  hero.speed = def.base.speed
  hero.attackDamage = def.base.attackDamage
  hero.attackRange = def.base.attackRange
  hero.attackSpeed = def.base.attackSpeed
  hero.radius = def.radius
  hero.dead = false
  hero.attackCooldown = 0
  hero.attackTargetId = ''
  hero.respawnTimer = 0
  hero.lastProcessedSeq = 0
  return hero
}

function createTower(
  id: string,
  team: string,
  pos: { x: number; y: number }
): TowerSchema {
  const tower = new TowerSchema()
  tower.id = id
  tower.x = pos.x
  tower.y = pos.y
  tower.team = team
  tower.hp = DEFAULT_TOWER.stats.maxHp
  tower.maxHp = DEFAULT_TOWER.stats.maxHp
  tower.dead = false
  tower.radius = DEFAULT_TOWER.radius
  tower.attackDamage = DEFAULT_TOWER.stats.attackDamage
  tower.attackRange = DEFAULT_TOWER.stats.attackRange
  tower.attackSpeed = DEFAULT_TOWER.stats.attackSpeed
  tower.attackCooldown = 0
  tower.attackTargetId = ''
  tower.projectileSpeed = DEFAULT_TOWER.projectileSpeed
  tower.projectileRadius = DEFAULT_TOWER.projectileRadius
  return tower
}

/**
 * Simulates one tick of the GameRoom.gameUpdate loop.
 * Runs all systems in the same order as the real GameRoom.
 */
function runGameTick(
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  projectiles: MapSchema<ProjectileSchema>,
  playerInputs: Map<string, InputMessage>,
  deltaTime: number
): void {
  // 1. Movement
  heroes.forEach((hero, sessionId) => {
    const input = playerInputs.get(sessionId)
    processMovement(hero, input, deltaTime)
    if (input) {
      hero.lastProcessedSeq = input.seq
    }
  })

  // 2. Hero combat
  heroes.forEach((hero, heroId) => {
    const input = playerInputs.get(heroId)
    processHeroCombat(hero, heroId, input, heroes, towers, projectiles, ProjectileSchema, deltaTime)
  })

  // 3. Tower combat
  towers.forEach((tower, towerId) => {
    processTowerCombat(tower, towerId, heroes, projectiles, ProjectileSchema, deltaTime)
  })

  // 4. Projectiles
  processProjectiles(projectiles, heroes, towers, deltaTime)

  // 5. Death and respawn
  processDeathAndRespawn(heroes, getSpawnPosition, deltaTime)

  // Clear inputs
  playerInputs.clear()
}

describe('GameRoom integration', () => {
  let heroes: MapSchema<HeroSchema>
  let towers: MapSchema<TowerSchema>
  let projectiles: MapSchema<ProjectileSchema>
  let playerInputs: Map<string, InputMessage>

  beforeEach(() => {
    resetProjectileIdCounter()
    resetTowerProjectileIdCounter()
    heroes = new MapSchema<HeroSchema>()
    towers = new MapSchema<TowerSchema>()
    projectiles = new MapSchema<ProjectileSchema>()
    playerInputs = new Map()

    heroes.set('p1', createHero('p1', 'blue', BLUE_SPAWN))
    heroes.set('p2', createHero('p2', 'red', RED_SPAWN))
  })

  describe('input -> movement', () => {
    it('should move hero based on input moveDir', () => {
      const p1 = heroes.get('p1')!
      const startX = p1.x

      playerInputs.set('p1', {
        seq: 1,
        moveDir: { x: 1, y: 0 },
        attackTargetId: null,
        facing: 0,
      })

      runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)

      expect(p1.x).toBeGreaterThan(startX)
      expect(p1.lastProcessedSeq).toBe(1)
    })

    it('should not move hero without input', () => {
      const p1 = heroes.get('p1')!
      const startX = p1.x

      runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)

      expect(p1.x).toBe(startX)
    })

    it('should track lastProcessedSeq incrementally', () => {
      playerInputs.set('p1', {
        seq: 5,
        moveDir: { x: 1, y: 0 },
        attackTargetId: null,
        facing: 0,
      })
      runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      expect(heroes.get('p1')!.lastProcessedSeq).toBe(5)

      playerInputs.set('p1', {
        seq: 10,
        moveDir: { x: 0, y: 1 },
        attackTargetId: null,
        facing: 0,
      })
      runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      expect(heroes.get('p1')!.lastProcessedSeq).toBe(10)
    })

    it('should clamp hero position to world bounds', () => {
      const p1 = heroes.get('p1')!
      p1.x = 5
      p1.y = 5

      playerInputs.set('p1', {
        seq: 1,
        moveDir: { x: -1, y: -1 },
        attackTargetId: null,
        facing: 0,
      })

      runGameTick(heroes, towers, projectiles, playerInputs, 1)

      expect(p1.x).toBeGreaterThanOrEqual(0)
      expect(p1.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('input -> attack -> damage', () => {
    it('should deal melee damage when in range with attack input', () => {
      const p1 = heroes.get('p1')!
      const p2 = heroes.get('p2')!
      const initialHp = p2.hp

      // Place p2 in melee range of p1
      p2.x = p1.x + 30
      p2.y = p1.y

      playerInputs.set('p1', {
        seq: 1,
        moveDir: { x: 0, y: 0 },
        attackTargetId: 'p2',
        facing: 0,
      })

      runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)

      // First tick sets up attack target, may not deal damage yet (cooldown starts)
      // Run a few more ticks to allow cooldown to pass and damage to be dealt
      for (let i = 0; i < 60; i++) {
        playerInputs.set('p1', {
          seq: i + 2,
          moveDir: { x: 0, y: 0 },
          attackTargetId: 'p2',
          facing: 0,
        })
        runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      }

      expect(p2.hp).toBeLessThan(initialHp)
    })

    it('should not deal damage to same-team hero', () => {
      const p1 = heroes.get('p1')!

      // Create a second blue hero
      const ally = createHero('ally', 'blue', { x: p1.x + 30, y: p1.y })
      heroes.set('ally', ally)
      const initialHp = ally.hp

      playerInputs.set('p1', {
        seq: 1,
        moveDir: { x: 0, y: 0 },
        attackTargetId: 'ally',
        facing: 0,
      })

      for (let i = 0; i < 120; i++) {
        playerInputs.set('p1', {
          seq: i + 1,
          moveDir: { x: 0, y: 0 },
          attackTargetId: 'ally',
          facing: 0,
        })
        runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      }

      expect(ally.hp).toBe(initialHp)
    })
  })

  describe('death and respawn cycle', () => {
    it('should mark hero as dead when hp reaches 0', () => {
      const p2 = heroes.get('p2')!
      p2.hp = 1

      const p1 = heroes.get('p1')!
      p2.x = p1.x + 30
      p2.y = p1.y

      // Attack until dead
      for (let i = 0; i < 120; i++) {
        playerInputs.set('p1', {
          seq: i + 1,
          moveDir: { x: 0, y: 0 },
          attackTargetId: 'p2',
          facing: 0,
        })
        runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
        if (p2.dead) break
      }

      expect(p2.dead).toBe(true)
      expect(p2.respawnTimer).toBeGreaterThan(0)
    })

    it('should respawn hero after timer expires', () => {
      const p2 = heroes.get('p2')!
      p2.hp = 0
      p2.dead = true
      p2.respawnTimer = 0.5

      // Run ticks until respawn timer expires
      for (let i = 0; i < 60; i++) {
        runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      }

      expect(p2.dead).toBe(false)
      expect(p2.hp).toBe(p2.maxHp)
      expect(p2.x).toBe(RED_SPAWN.x)
      expect(p2.y).toBe(RED_SPAWN.y)
    })

    it('should not move dead heroes', () => {
      const p1 = heroes.get('p1')!
      p1.dead = true
      p1.respawnTimer = 10
      const startX = p1.x

      playerInputs.set('p1', {
        seq: 1,
        moveDir: { x: 1, y: 0 },
        attackTargetId: null,
        facing: 0,
      })

      runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      expect(p1.x).toBe(startX)
    })
  })

  describe('tower combat', () => {
    it('should fire projectile at nearby enemy hero', () => {
      const towerDist = 600
      towers.set('tower-blue', createTower('tower-blue', 'blue', { x: towerDist, y: WORLD_HEIGHT / 2 }))

      // Move red hero near blue tower
      const p2 = heroes.get('p2')!
      p2.x = towerDist + 100
      p2.y = WORLD_HEIGHT / 2

      // Run enough ticks for tower to fire
      for (let i = 0; i < 120; i++) {
        runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      }

      // Tower should have created a projectile or dealt damage
      expect(p2.hp).toBeLessThan(p2.maxHp)
    })

    it('should not target same-team hero', () => {
      const towerDist = 600
      towers.set('tower-blue', createTower('tower-blue', 'blue', { x: towerDist, y: WORLD_HEIGHT / 2 }))

      // Move blue hero near blue tower
      const p1 = heroes.get('p1')!
      p1.x = towerDist + 100
      p1.y = WORLD_HEIGHT / 2
      const initialHp = p1.hp

      for (let i = 0; i < 120; i++) {
        runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      }

      expect(p1.hp).toBe(initialHp)
    })
  })

  describe('tick loop ordering', () => {
    it('should clear inputs after each tick', () => {
      playerInputs.set('p1', {
        seq: 1,
        moveDir: { x: 1, y: 0 },
        attackTargetId: null,
        facing: 0,
      })

      runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      expect(playerInputs.size).toBe(0)
    })

    it('should process both heroes in a single tick', () => {
      const p1 = heroes.get('p1')!
      const p2 = heroes.get('p2')!
      const startX1 = p1.x
      const startX2 = p2.x

      playerInputs.set('p1', {
        seq: 1,
        moveDir: { x: 1, y: 0 },
        attackTargetId: null,
        facing: 0,
      })
      playerInputs.set('p2', {
        seq: 1,
        moveDir: { x: -1, y: 0 },
        attackTargetId: null,
        facing: 0,
      })

      runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)

      expect(p1.x).toBeGreaterThan(startX1)
      expect(p2.x).toBeLessThan(startX2)
    })

    it('should handle projectile lifecycle within tick loop', () => {
      towers.set('tower-blue', createTower('tower-blue', 'blue', { x: 600, y: WORLD_HEIGHT / 2 }))

      // Place red hero very close to tower so projectile hits quickly
      const p2 = heroes.get('p2')!
      p2.x = 620
      p2.y = WORLD_HEIGHT / 2

      // Run ticks — tower should fire projectile, which should travel and hit
      for (let i = 0; i < 180; i++) {
        runGameTick(heroes, towers, projectiles, playerInputs, 1 / 60)
      }

      // Projectile should have hit and dealt damage
      expect(p2.hp).toBeLessThan(p2.maxHp)
    })
  })
})
