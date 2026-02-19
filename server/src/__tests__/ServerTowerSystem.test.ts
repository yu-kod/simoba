import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { processTowerCombat, resetTowerProjectileIdCounter } from '../game/ServerTowerSystem.js'

function createTower(id: string, overrides: Partial<Record<keyof TowerSchema, unknown>> = {}): TowerSchema {
  const tower = new TowerSchema()
  tower.id = id
  tower.x = 600
  tower.y = 360
  tower.hp = 1500
  tower.maxHp = 1500
  tower.dead = false
  tower.team = 'blue'
  tower.radius = 24
  tower.attackDamage = 80
  tower.attackRange = 350
  tower.attackSpeed = 0.8
  tower.attackCooldown = 0
  tower.attackTargetId = ''
  tower.projectileSpeed = 400
  tower.projectileRadius = 5
  Object.assign(tower, overrides)
  return tower
}

function createHero(id: string, overrides: Partial<Record<keyof HeroSchema, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.id = id
  hero.x = 700
  hero.y = 360
  hero.hp = 650
  hero.maxHp = 650
  hero.dead = false
  hero.team = 'red'
  hero.radius = 22
  Object.assign(hero, overrides)
  return hero
}

describe('ServerTowerSystem', () => {
  let heroes: MapSchema<HeroSchema>
  let projectiles: MapSchema<ProjectileSchema>

  beforeEach(() => {
    heroes = new MapSchema<HeroSchema>()
    projectiles = new MapSchema<ProjectileSchema>()
    resetTowerProjectileIdCounter()
  })

  describe('processTowerCombat', () => {
    it('should skip dead towers', () => {
      const tower = createTower('tower-1', { dead: true, attackTargetId: 'old' })
      const enemy = createHero('enemy', { team: 'red' })
      heroes.set('enemy', enemy)

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.1)

      expect(tower.attackTargetId).toBe('')
      expect(projectiles.size).toBe(0)
    })

    it('should auto-target nearest enemy in range', () => {
      const tower = createTower('tower-1', { x: 600, y: 360, team: 'blue' })
      const enemy = createHero('enemy-1', { x: 700, y: 360, team: 'red' })
      heroes.set('enemy-1', enemy)

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.1)

      expect(tower.attackTargetId).toBe('enemy-1')
    })

    it('should not target allies', () => {
      const tower = createTower('tower-1', { team: 'blue' })
      const ally = createHero('ally', { x: 700, y: 360, team: 'blue' })
      heroes.set('ally', ally)

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.1)

      expect(tower.attackTargetId).toBe('')
    })

    it('should not target enemies out of range', () => {
      const tower = createTower('tower-1', { x: 600, y: 360, team: 'blue', attackRange: 350 })
      const enemy = createHero('enemy', { x: 2000, y: 360, team: 'red' })
      heroes.set('enemy', enemy)

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.1)

      expect(tower.attackTargetId).toBe('')
    })

    it('should spawn projectile when cooldown is ready', () => {
      const tower = createTower('tower-1', { attackCooldown: 0 })
      const enemy = createHero('enemy', { x: 700, y: 360, team: 'red' })
      heroes.set('enemy', enemy)

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.1)

      expect(projectiles.size).toBe(1)
      const proj = Array.from(projectiles.values())[0]!
      expect(proj.x).toBe(600)
      expect(proj.y).toBe(360)
      expect(proj.targetX).toBe(700)
      expect(proj.targetY).toBe(360)
      expect(proj.damage).toBe(80)
      expect(proj.speed).toBe(400)
      expect(proj.team).toBe('blue')
      expect(proj.ownerId).toBe('tower-1')
    })

    it('should not spawn projectile when cooldown is active', () => {
      const tower = createTower('tower-1', { attackCooldown: 0.5 })
      const enemy = createHero('enemy', { x: 700, y: 360, team: 'red' })
      heroes.set('enemy', enemy)

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.1)

      expect(projectiles.size).toBe(0)
    })

    it('should reduce cooldown over time', () => {
      const tower = createTower('tower-1', { attackCooldown: 1.0 })
      heroes.set('enemy', createHero('enemy', { team: 'red' }))

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.5)

      expect(tower.attackCooldown).toBeCloseTo(0.5, 2)
    })

    it('should set cooldown after firing', () => {
      const tower = createTower('tower-1', { attackCooldown: 0, attackSpeed: 0.8 })
      const enemy = createHero('enemy', { x: 700, y: 360, team: 'red' })
      heroes.set('enemy', enemy)

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.1)

      expect(tower.attackCooldown).toBeCloseTo(1 / 0.8, 2)
    })

    it('should not target dead enemies', () => {
      const tower = createTower('tower-1')
      const enemy = createHero('enemy', { x: 700, y: 360, team: 'red', dead: true, hp: 0 })
      heroes.set('enemy', enemy)

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.1)

      expect(tower.attackTargetId).toBe('')
    })

    it('should select closest enemy when multiple in range', () => {
      const tower = createTower('tower-1', { x: 600, y: 360, team: 'blue' })
      const farEnemy = createHero('far', { x: 900, y: 360, team: 'red' })
      const closeEnemy = createHero('close', { x: 650, y: 360, team: 'red' })
      heroes.set('far', farEnemy)
      heroes.set('close', closeEnemy)

      processTowerCombat(tower, 'tower-1', heroes, projectiles, ProjectileSchema, 0.1)

      expect(tower.attackTargetId).toBe('close')
    })
  })
})
