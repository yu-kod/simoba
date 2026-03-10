import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { MinionSchema } from '../schema/MinionSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { processProjectiles } from '../game/ServerProjectileSystem.js'
import { ProjectileTracker } from '../game/ProjectileTracker.js'

function createProjectile(overrides: Partial<Record<keyof ProjectileSchema, unknown>> = {}): ProjectileSchema {
  const proj = new ProjectileSchema()
  proj.id = 'proj-1'
  proj.x = 100
  proj.y = 100
  proj.targetX = 300
  proj.targetY = 100
  proj.targetId = 'enemy'
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
  let tracker: ProjectileTracker

  beforeEach(() => {
    heroes = new MapSchema<HeroSchema>()
    towers = new MapSchema<TowerSchema>()
    projectiles = new MapSchema<ProjectileSchema>()
    tracker = new ProjectileTracker()
  })

  describe('processProjectiles — homing', () => {
    it('should move projectile toward target entity position', () => {
      const target = createHero('enemy', { x: 300, y: 100, team: 'red' })
      heroes.set('enemy', target)

      const proj = createProjectile({ x: 100, y: 100, targetId: 'enemy', speed: 400 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.25, tracker)

      expect(proj.x).toBeCloseTo(200, 0) // 100 + 400 * 0.25
      expect(proj.y).toBeCloseTo(100, 0)
      expect(projectiles.size).toBe(1)
    })

    it('should home toward moving target', () => {
      const target = createHero('enemy', { x: 300, y: 100, team: 'red' })
      heroes.set('enemy', target)

      const proj = createProjectile({ x: 100, y: 100, targetId: 'enemy', speed: 400 })
      projectiles.set(proj.id, proj)

      // First tick: target at (300, 100)
      processProjectiles(projectiles, heroes, towers, 0.1, tracker)
      const x1 = proj.x

      // Target moves up
      target.y = 200

      // Second tick: projectile should now home toward (300, 200)
      processProjectiles(projectiles, heroes, towers, 0.1, tracker)

      // Projectile should have a y component now (moving toward new target position)
      expect(proj.y).toBeGreaterThan(100)
      expect(proj.x).toBeGreaterThan(x1)
    })

    it('should update targetX/targetY for client interpolation', () => {
      const target = createHero('enemy', { x: 300, y: 100, team: 'red' })
      heroes.set('enemy', target)

      const proj = createProjectile({ x: 100, y: 100, targetId: 'enemy' })
      projectiles.set(proj.id, proj)

      // Move target
      target.x = 400
      target.y = 200

      processProjectiles(projectiles, heroes, towers, 0.1, tracker)

      expect(proj.targetX).toBe(400)
      expect(proj.targetY).toBe(200)
    })

    it('should only damage designated target, not other enemies on path', () => {
      const bystander = createHero('bystander', { x: 150, y: 100, team: 'red', radius: 22, hp: 650 })
      const target = createHero('enemy', { x: 300, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('bystander', bystander)
      heroes.set('enemy', target)

      // Projectile flies through bystander toward enemy
      const proj = createProjectile({ x: 145, y: 100, targetId: 'enemy', team: 'blue', damage: 60 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.01, tracker)

      expect(bystander.hp).toBe(650) // No damage to bystander
      expect(projectiles.size).toBe(1) // Projectile not consumed
    })

    it('should apply damage when reaching designated target', () => {
      const target = createHero('enemy', { x: 200, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('enemy', target)

      const proj = createProjectile({ x: 195, y: 100, targetId: 'enemy', team: 'blue', damage: 60 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.01, tracker)

      expect(target.hp).toBe(590) // 650 - 60
      expect(projectiles.size).toBe(0) // Removed after hit
    })

    it('should remove projectile if target dies', () => {
      const target = createHero('enemy', { x: 300, y: 100, team: 'red', hp: 0, dead: true })
      heroes.set('enemy', target)

      const proj = createProjectile({ x: 100, y: 100, targetId: 'enemy' })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.1, tracker)

      expect(projectiles.size).toBe(0)
    })

    it('should remove projectile if target entity disappears', () => {
      // No target entity in the map
      const proj = createProjectile({ x: 100, y: 100, targetId: 'nonexistent' })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.1, tracker)

      expect(projectiles.size).toBe(0)
    })

    it('should not damage same-team entities even if designated', () => {
      const ally = createHero('ally', { x: 200, y: 100, team: 'blue', radius: 22, hp: 650 })
      heroes.set('ally', ally)

      // Edge case: targetId points to an ally (shouldn't happen normally)
      const proj = createProjectile({ x: 195, y: 100, targetId: 'ally', team: 'blue', damage: 60 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.01, tracker)

      // Friendly fire guard: no damage applied, projectile removed
      expect(ally.hp).toBe(650)
      expect(projectiles.size).toBe(0)
    })

    it('should apply damage when projectile is exactly at target position', () => {
      const target = createHero('enemy', { x: 200, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('enemy', target)

      // Projectile spawned exactly at target position (distToTarget === 0)
      const proj = createProjectile({ x: 200, y: 100, targetId: 'enemy', team: 'blue', damage: 60 })
      projectiles.set(proj.id, proj)

      const events = processProjectiles(projectiles, heroes, towers, 0.01, tracker)

      expect(target.hp).toBe(590)
      expect(projectiles.size).toBe(0)
      expect(events).toHaveLength(1)
    })

    it('should return DamageEvent on hit', () => {
      const target = createHero('enemy', { x: 200, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('enemy', target)

      const proj = createProjectile({ x: 195, y: 100, targetId: 'enemy', team: 'blue', damage: 60, ownerId: 'shooter' })
      projectiles.set(proj.id, proj)

      const events = processProjectiles(projectiles, heroes, towers, 0.01, tracker)

      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({
        kind: 'damage',
        event: { targetId: 'enemy', amount: 60, sourceId: 'shooter' },
      })
    })

    it('should return empty events when no collision', () => {
      const target = createHero('enemy', { x: 500, y: 100, team: 'red' })
      heroes.set('enemy', target)

      const proj = createProjectile({ x: 100, y: 100, targetId: 'enemy' })
      projectiles.set(proj.id, proj)

      const events = processProjectiles(projectiles, heroes, towers, 0.01, tracker)
      expect(events).toHaveLength(0)
    })

    it('should handle multiple projectiles with different targets', () => {
      const enemy1 = createHero('enemy1', { x: 200, y: 100, team: 'red', radius: 22, hp: 650 })
      const enemy2 = createHero('enemy2', { x: 400, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('enemy1', enemy1)
      heroes.set('enemy2', enemy2)

      const proj1 = createProjectile({ id: 'proj-1', x: 195, y: 100, targetId: 'enemy1', damage: 30 })
      const proj2 = createProjectile({ id: 'proj-2', x: 100, y: 100, targetId: 'enemy2', damage: 30 })
      projectiles.set(proj1.id, proj1)
      projectiles.set(proj2.id, proj2)

      processProjectiles(projectiles, heroes, towers, 0.01, tracker)

      expect(enemy1.hp).toBe(620) // hit by proj1
      expect(enemy2.hp).toBe(650) // proj2 still in flight
      expect(projectiles.size).toBe(1) // proj2 still alive
    })

    it('should apply damage to towers when targeted', () => {
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

      const proj = createProjectile({ x: 195, y: 100, targetId: 'tower-red', team: 'blue', damage: 45 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.01, tracker)

      expect(tower.hp).toBe(1455)
      expect(projectiles.size).toBe(0)
    })

    it('should home toward minion target', () => {
      const minions = new MapSchema<MinionSchema>()
      const minion = new MinionSchema()
      minion.id = 'minion-1'
      minion.x = 300
      minion.y = 100
      minion.hp = 100
      minion.maxHp = 100
      minion.dead = false
      minion.team = 'red'
      minion.radius = 12
      minions.set('minion-1', minion)

      const proj = createProjectile({ x: 295, y: 100, targetId: 'minion-1', damage: 50 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.01, tracker, minions)

      expect(minion.hp).toBe(50)
      expect(projectiles.size).toBe(0)
    })
  })

  describe('processProjectiles — linear', () => {
    function createLinearProjectile(overrides: Partial<Record<string, unknown>> = {}): ProjectileSchema {
      const proj = new ProjectileSchema()
      proj.id = 'linear-1'
      proj.x = 100
      proj.y = 200
      proj.speed = 800
      proj.damage = 60
      proj.ownerId = 'shooter'
      proj.team = 'blue'
      proj.mode = 'linear'
      proj.dirX = 1
      proj.dirY = 0
      proj.maxRange = 600
      proj.pierceRemaining = 3
      Object.assign(proj, overrides)
      return proj
    }

    it('should move in a straight line based on dirX/dirY', () => {
      const proj = createLinearProjectile()
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.016, tracker)

      expect(proj.x).toBeCloseTo(100 + 800 * 0.016) // 112.8
      expect(proj.y).toBeCloseTo(200)
      expect(projectiles.size).toBe(1)
    })

    it('should remove when maxRange exceeded', () => {
      const proj = createLinearProjectile({ speed: 800, maxRange: 100 })
      projectiles.set(proj.id, proj)

      // One big tick that exceeds maxRange
      processProjectiles(projectiles, heroes, towers, 0.2, tracker) // 800*0.2 = 160 > 100

      expect(projectiles.size).toBe(0)
    })

    it('should continue within range', () => {
      const proj = createLinearProjectile({ maxRange: 600 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.1, tracker) // 80px traveled

      expect(projectiles.size).toBe(1)
    })

    it('should hit enemy in path', () => {
      const enemy = createHero('enemy-a', { x: 120, y: 200, team: 'red', radius: 22, hp: 500 })
      heroes.set('enemy-a', enemy)

      const proj = createLinearProjectile({ x: 100, y: 200 })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.016, tracker)

      expect(enemy.hp).toBe(440) // 500 - 60
      expect(proj.pierceRemaining).toBe(2)
      expect(projectiles.size).toBe(1) // still alive (pierce)
    })

    it('should pierce through multiple enemies', () => {
      // Place enemies far apart so projectile reaches each on separate ticks
      const enemy1 = createHero('e1', { x: 200, y: 200, team: 'red', radius: 22, hp: 500 })
      const enemy2 = createHero('e2', { x: 350, y: 200, team: 'red', radius: 22, hp: 500 })
      heroes.set('e1', enemy1)
      heroes.set('e2', enemy2)

      const proj = createLinearProjectile({ x: 100, y: 200, pierceRemaining: 3 })
      projectiles.set(proj.id, proj)

      // Tick 1: proj moves to 180 — within 27px of enemy1 at 200? dist=20 < 27, hit!
      processProjectiles(projectiles, heroes, towers, 0.1, tracker)
      expect(enemy1.hp).toBe(440)
      expect(proj.pierceRemaining).toBe(2)

      // Tick 2-3: proj moves further, reaches enemy2
      processProjectiles(projectiles, heroes, towers, 0.1, tracker) // x=260
      processProjectiles(projectiles, heroes, towers, 0.1, tracker) // x=340, dist to enemy2=10 < 27, hit!
      expect(enemy2.hp).toBe(440)
      expect(proj.pierceRemaining).toBe(1)
      expect(projectiles.size).toBe(1) // still alive
    })

    it('should remove after exhausting pierce count', () => {
      const enemy1 = createHero('e1', { x: 200, y: 200, team: 'red', radius: 22, hp: 500 })
      const enemy2 = createHero('e2', { x: 350, y: 200, team: 'red', radius: 22, hp: 500 })
      heroes.set('e1', enemy1)
      heroes.set('e2', enemy2)

      // pierceRemaining=1 means remove after 1st hit
      const proj = createLinearProjectile({ x: 100, y: 200, pierceRemaining: 1 })
      projectiles.set(proj.id, proj)

      // Tick: proj moves to 180 — hits enemy1, pierceRemaining becomes 0, removed
      processProjectiles(projectiles, heroes, towers, 0.1, tracker)

      expect(enemy1.hp).toBe(440)
      expect(enemy2.hp).toBe(500) // not hit — projectile removed after 1st
      expect(projectiles.size).toBe(0)
    })

    it('should not hit same enemy twice', () => {
      const enemy = createHero('e1', { x: 115, y: 200, team: 'red', radius: 22, hp: 500 })
      heroes.set('e1', enemy)

      const proj = createLinearProjectile({ x: 100, y: 200, pierceRemaining: 3 })
      projectiles.set(proj.id, proj)

      // First tick — hits enemy
      processProjectiles(projectiles, heroes, towers, 0.005, tracker)
      expect(enemy.hp).toBe(440)

      // Second tick — still overlapping, but should NOT hit again
      processProjectiles(projectiles, heroes, towers, 0.005, tracker)
      expect(enemy.hp).toBe(440) // unchanged
    })

    it('should not hit allies', () => {
      const ally = createHero('ally', { x: 120, y: 200, team: 'blue', radius: 22, hp: 500 })
      heroes.set('ally', ally)

      const proj = createLinearProjectile({ x: 100, y: 200, team: 'blue' })
      projectiles.set(proj.id, proj)

      processProjectiles(projectiles, heroes, towers, 0.016, tracker)

      expect(ally.hp).toBe(500)
    })

    it('should return damage events for each hit', () => {
      const enemy = createHero('e1', { x: 115, y: 200, team: 'red', radius: 22, hp: 500 })
      heroes.set('e1', enemy)

      const proj = createLinearProjectile({ x: 100, y: 200, ownerId: 'shooter' })
      projectiles.set(proj.id, proj)

      const events = processProjectiles(projectiles, heroes, towers, 0.016, tracker)

      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({
        kind: 'damage',
        event: { targetId: 'e1', amount: 60, sourceId: 'shooter' },
      })
    })

    it('should not break existing homing projectiles', () => {
      // Homing projectile alongside linear
      const target = createHero('enemy', { x: 300, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('enemy', target)

      const homing = createProjectile({ id: 'homing-1', x: 295, y: 100, targetId: 'enemy', team: 'blue', damage: 50 })
      const linear = createLinearProjectile({ id: 'linear-1', x: 100, y: 500 }) // far from any enemy
      projectiles.set(homing.id, homing)
      projectiles.set(linear.id, linear)

      const events = processProjectiles(projectiles, heroes, towers, 0.01, tracker)

      // Homing should hit its target
      expect(target.hp).toBe(600)
      expect(events).toHaveLength(1)
      // Linear should still be flying
      expect(projectiles.has('linear-1')).toBe(true)
    })
  })
})
