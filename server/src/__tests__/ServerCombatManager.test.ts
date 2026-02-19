import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { processHeroCombat, resetProjectileIdCounter } from '../game/ServerCombatManager.js'
import type { InputMessage } from '@shared/messages'

function createHero(id: string, overrides: Partial<Record<keyof HeroSchema, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.id = id
  hero.x = 100
  hero.y = 100
  hero.hp = 650
  hero.maxHp = 650
  hero.dead = false
  hero.team = 'blue'
  hero.heroType = 'BLADE'
  hero.attackDamage = 60
  hero.attackRange = 60
  hero.attackSpeed = 0.8
  hero.attackCooldown = 0
  hero.attackTargetId = ''
  hero.radius = 22
  Object.assign(hero, overrides)
  return hero
}

function createInput(overrides: Partial<InputMessage> = {}): InputMessage {
  return {
    seq: 1,
    moveDir: { x: 0, y: 0 },
    attackTargetId: null,
    facing: 0,
    ...overrides,
  }
}

describe('ServerCombatManager', () => {
  let heroes: MapSchema<HeroSchema>
  let towers: MapSchema<TowerSchema>
  let projectiles: MapSchema<ProjectileSchema>

  beforeEach(() => {
    heroes = new MapSchema<HeroSchema>()
    towers = new MapSchema<TowerSchema>()
    projectiles = new MapSchema<ProjectileSchema>()
    resetProjectileIdCounter()
  })

  describe('processHeroCombat', () => {
    it('should clear attack state for dead hero', () => {
      const hero = createHero('hero-1', { dead: true, attackTargetId: 'enemy', attackCooldown: 1 })
      heroes.set('hero-1', hero)

      processHeroCombat(hero, 'hero-1', undefined, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(hero.attackTargetId).toBe('')
      expect(hero.attackCooldown).toBe(0)
    })

    it('should reduce cooldown over time', () => {
      const hero = createHero('hero-1', { attackCooldown: 1.0 })
      heroes.set('hero-1', hero)

      processHeroCombat(hero, 'hero-1', undefined, heroes, towers, projectiles, ProjectileSchema, 0.5)

      expect(hero.attackCooldown).toBeCloseTo(0.5, 2)
    })

    it('should set attack target when valid enemy is in range', () => {
      const attacker = createHero('attacker', { x: 100, y: 100, team: 'blue', radius: 22, attackRange: 60 })
      const target = createHero('target', { x: 160, y: 100, team: 'red', radius: 22 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(attacker.attackTargetId).toBe('target')
    })

    it('should clear attack target when enemy is out of range', () => {
      const attacker = createHero('attacker', { x: 100, y: 100, team: 'blue', radius: 22, attackRange: 60 })
      const target = createHero('target', { x: 500, y: 100, team: 'red', radius: 22 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(attacker.attackTargetId).toBe('')
    })

    it('should not target same-team heroes', () => {
      const attacker = createHero('attacker', { x: 100, y: 100, team: 'blue' })
      const ally = createHero('ally', { x: 120, y: 100, team: 'blue' })
      heroes.set('attacker', attacker)
      heroes.set('ally', ally)

      const input = createInput({ attackTargetId: 'ally' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(attacker.attackTargetId).toBe('')
    })

    it('should apply melee damage immediately (BLADE, projectileSpeed=0)', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 22,
        attackRange: 60, attackDamage: 60, attackSpeed: 0.8, attackCooldown: 0,
        heroType: 'BLADE',
      })
      const target = createHero('target', { x: 160, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(target.hp).toBe(590) // 650 - 60
      expect(attacker.attackCooldown).toBeCloseTo(1 / 0.8, 2)
    })

    it('should spawn projectile for ranged hero (BOLT, projectileSpeed>0)', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 18,
        attackRange: 300, attackDamage: 45, attackSpeed: 1.0, attackCooldown: 0,
        heroType: 'BOLT',
      })
      const target = createHero('target', { x: 350, y: 100, team: 'red', radius: 22 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(projectiles.size).toBe(1)
      const proj = Array.from(projectiles.values())[0]!
      expect(proj.ownerId).toBe('attacker')
      expect(proj.damage).toBe(45)
      expect(proj.x).toBe(100)
      expect(proj.y).toBe(100)
      expect(proj.targetX).toBe(350)
      expect(proj.targetY).toBe(100)
    })

    it('should not attack when cooldown is active', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 22,
        attackRange: 60, attackDamage: 60, attackSpeed: 0.8, attackCooldown: 0.5,
        heroType: 'BLADE',
      })
      const target = createHero('target', { x: 160, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(target.hp).toBe(650) // No damage
    })

    it('should clear target when no attack input', () => {
      const hero = createHero('hero-1', { attackTargetId: 'old-target' })
      heroes.set('hero-1', hero)

      const input = createInput({ attackTargetId: null })
      processHeroCombat(hero, 'hero-1', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(hero.attackTargetId).toBe('')
    })

    it('should attack tower targets', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 22,
        attackRange: 60, attackDamage: 60, attackSpeed: 0.8, attackCooldown: 0,
        heroType: 'BLADE',
      })
      heroes.set('attacker', attacker)

      const tower = new TowerSchema()
      tower.id = 'tower-red'
      tower.x = 160
      tower.y = 100
      tower.hp = 1500
      tower.maxHp = 1500
      tower.dead = false
      tower.team = 'red'
      tower.radius = 24
      towers.set('tower-red', tower)

      const input = createInput({ attackTargetId: 'tower-red' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(tower.hp).toBe(1440) // 1500 - 60
    })
  })
})
