import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { processProjectiles } from '../game/ServerProjectileSystem.js'

function createProjectile(overrides: Partial<Record<keyof ProjectileSchema, unknown>> = {}): ProjectileSchema {
  const proj = new ProjectileSchema()
  proj.id = 'proj-1'
  proj.x = 100
  proj.y = 100
  proj.targetX = 300
  proj.targetY = 100
  proj.speed = 400
  proj.damage = 60
  proj.ownerId = 'attacker'
  proj.team = 'blue'
  Object.assign(proj, overrides)
  return proj
}

function createHero(id: string, overrides: Partial<Record<keyof HeroSchema, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.id = id
  hero.x = 300
  hero.y = 100
  hero.hp = 650
  hero.maxHp = 650
  hero.dead = false
  hero.team = 'red'
  hero.radius = 22
  Object.assign(hero, overrides)
  return hero
}

describe('ServerProjectileSystem', () => {
  let heroes: MapSchema<HeroSchema>
  let towers: MapSchema<TowerSchema>
  let projectiles: MapSchema<ProjectileSchema>

  beforeEach(() => {
    heroes = new MapSchema<HeroSchema>()
    towers = new MapSchema<TowerSchema>()
    projectiles = new MapSchema<ProjectileSchema>()
  })

  describe('processProjectiles', () => {
    it('should move projectile toward target', () => {
      const proj = createProjectile({ x: 100, y: 100, targetX: 300, targetY: 100, speed: 400 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.25)

      expect(proj.x).toBeCloseTo(200, 0) // 100 + 400 * 0.25
      expect(proj.y).toBeCloseTo(100, 0)
      expect(projectiles.size).toBe(1) // Still alive
    })

    it('should remove projectile when it arrives at target position', () => {
      const proj = createProjectile({ x: 290, y: 100, targetX: 300, targetY: 100, speed: 400 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 1) // Overshoots

      expect(projectiles.size).toBe(0) // Removed
    })

    it('should apply damage on collision with enemy hero', () => {
      const target = createHero('enemy', { x: 200, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('enemy', target)

      // Place projectile very close to target
      const proj = createProjectile({ x: 195, y: 100, targetX: 300, targetY: 100, team: 'blue', damage: 60 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.01)

      expect(target.hp).toBe(590) // 650 - 60
      expect(projectiles.size).toBe(0) // Removed after hit
    })

    it('should not damage same-team entities', () => {
      const ally = createHero('ally', { x: 200, y: 100, team: 'blue', radius: 22, hp: 650 })
      heroes.set('ally', ally)

      const proj = createProjectile({ x: 195, y: 100, targetX: 300, targetY: 100, team: 'blue', damage: 60 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.01)

      expect(ally.hp).toBe(650) // No damage to ally
      expect(projectiles.size).toBe(1) // Not consumed
    })

    it('should not damage dead entities', () => {
      const target = createHero('enemy', { x: 200, y: 100, team: 'red', radius: 22, hp: 0, dead: true })
      heroes.set('enemy', target)

      const proj = createProjectile({ x: 195, y: 100, targetX: 300, targetY: 100, team: 'blue', damage: 60 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.01)

      expect(target.hp).toBe(0)
    })

    it('should apply damage to towers', () => {
      const tower = new TowerSchema()
      tower.id = 'tower-red'
      tower.x = 200
      tower.y = 100
      tower.hp = 1500
      tower.maxHp = 1500
      tower.dead = false
      tower.team = 'red'
      tower.radius = 24
      towers.set('tower-red', tower)

      const proj = createProjectile({ x: 195, y: 100, targetX: 300, targetY: 100, team: 'blue', damage: 45 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.01)

      expect(tower.hp).toBe(1455) // 1500 - 45
      expect(projectiles.size).toBe(0)
    })

    it('should handle multiple projectiles', () => {
      const target = createHero('enemy', { x: 300, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('enemy', target)

      const proj1 = createProjectile({ id: 'proj-1', x: 295, y: 100, targetX: 400, targetY: 100, damage: 30 })
      const proj2 = createProjectile({ id: 'proj-2', x: 100, y: 100, targetX: 400, targetY: 100, damage: 30 })
      projectiles.set(proj1.id, proj1)
      projectiles.set(proj2.id, proj2)

      processProjectiles(projectiles, heroes, towers, 0.01)

      // proj1 should hit, proj2 still alive
      expect(target.hp).toBe(620) // 650 - 30
      expect(projectiles.size).toBe(1)
    })
  })
})
