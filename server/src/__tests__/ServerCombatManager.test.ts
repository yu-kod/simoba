import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { StatusEffectSchema } from '../schema/StatusEffectSchema.js'
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

    it('should continue auto-attack when same target sent on consecutive ticks', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 22,
        attackRange: 60, attackDamage: 60, attackSpeed: 0.8, attackCooldown: 0,
        heroType: 'BLADE',
      })
      const target = createHero('target', { x: 160, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      // Tick 1: first attack lands
      const input1 = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input1, heroes, towers, projectiles, ProjectileSchema, 0.016)
      expect(target.hp).toBe(590)
      expect(attacker.attackCooldown).toBeGreaterThan(0)

      // Ticks 2-N: cooldown ticking, same target sent each tick
      // cooldown = 1/0.8 = 1.25s, need ceil(1.25/0.016) = 79 ticks to expire
      for (let i = 0; i < 78; i++) {
        const input = createInput({ attackTargetId: 'target', seq: i + 2 })
        processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.016)
      }

      // Tick 80: cooldown expired, second attack lands
      const finalInput = createInput({ attackTargetId: 'target', seq: 80 })
      processHeroCombat(attacker, 'attacker', finalInput, heroes, towers, projectiles, ProjectileSchema, 0.016)
      expect(target.hp).toBe(530) // 590 - 60
    })

    it('should clear target when null is sent after previous target', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 22,
        attackRange: 60, attackCooldown: 0.5,
      })
      const target = createHero('target', { x: 160, y: 100, team: 'red', radius: 22 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      // First: set target
      const input1 = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input1, heroes, towers, projectiles, ProjectileSchema, 0.016)
      expect(attacker.attackTargetId).toBe('target')

      // Next: send null to clear
      const input2 = createInput({ attackTargetId: null, seq: 2 })
      processHeroCombat(attacker, 'attacker', input2, heroes, towers, projectiles, ProjectileSchema, 0.016)
      expect(attacker.attackTargetId).toBe('')
    })

    it('should reject dead target', () => {
      const attacker = createHero('attacker', { x: 100, y: 100, team: 'blue', radius: 22, attackRange: 60 })
      const target = createHero('target', { x: 160, y: 100, team: 'red', radius: 22, dead: true })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(attacker.attackTargetId).toBe('')
    })

    it('should reject non-existent target', () => {
      const attacker = createHero('attacker', { x: 100, y: 100, team: 'blue' })
      heroes.set('attacker', attacker)

      const input = createInput({ attackTargetId: 'nonexistent' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(attacker.attackTargetId).toBe('')
    })

    it('should allow both heroes to deal damage when attacking each other', () => {
      const heroA = createHero('heroA', {
        x: 100, y: 100, team: 'blue', radius: 22,
        attackRange: 60, attackDamage: 60, attackSpeed: 0.8, attackCooldown: 0,
        heroType: 'BLADE',
      })
      const heroB = createHero('heroB', {
        x: 160, y: 100, team: 'red', radius: 22,
        attackRange: 60, attackDamage: 60, attackSpeed: 0.8, attackCooldown: 0,
        heroType: 'BLADE',
      })
      heroes.set('heroA', heroA)
      heroes.set('heroB', heroB)

      const inputA = createInput({ attackTargetId: 'heroB' })
      const inputB = createInput({ attackTargetId: 'heroA' })

      // Simulate game loop: process both heroes in sequence (same tick)
      processHeroCombat(heroA, 'heroA', inputA, heroes, towers, projectiles, ProjectileSchema, 0.016)
      processHeroCombat(heroB, 'heroB', inputB, heroes, towers, projectiles, ProjectileSchema, 0.016)

      // Both heroes should have taken damage
      expect(heroA.hp).toBe(590) // 650 - 60 from heroB
      expect(heroB.hp).toBe(590) // 650 - 60 from heroA
    })

    it('should return AttackEvent and DamageEvent for melee attack', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 22,
        attackRange: 60, attackDamage: 60, attackSpeed: 0.8, attackCooldown: 0,
        heroType: 'BLADE', facing: 1.5,
      })
      const target = createHero('target', { x: 160, y: 100, team: 'red', radius: 22 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      const events = processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(events).toHaveLength(2)
      expect(events[0]).toEqual({
        kind: 'attack',
        event: { attackerId: 'attacker', targetId: 'target', attackType: 'melee', position: { x: 100, y: 100 }, facing: 1.5 },
      })
      expect(events[1]).toEqual({
        kind: 'damage',
        event: { targetId: 'target', amount: 60, sourceId: 'attacker' },
      })
    })

    it('should return AttackEvent (ranged) for BOLT without DamageEvent', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 18,
        attackRange: 300, attackDamage: 45, attackSpeed: 1.0, attackCooldown: 0,
        heroType: 'BOLT', facing: 0.5,
      })
      const target = createHero('target', { x: 350, y: 100, team: 'red', radius: 22 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      const events = processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({
        kind: 'attack',
        event: { attackerId: 'attacker', targetId: 'target', attackType: 'ranged', position: { x: 100, y: 100 }, facing: 0.5 },
      })
    })

    it('should use effective attackDamage with debuff applied (melee)', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 22,
        attackRange: 60, attackDamage: 50, attackSpeed: 0.8, attackCooldown: 0,
        heroType: 'BLADE',
      })
      // Apply attackDamage debuff
      const debuff = new StatusEffectSchema()
      debuff.id = 'aura-weaken'
      debuff.buffType = 'attackDamage'
      debuff.value = -15
      debuff.remainingDuration = 4
      debuff.isDebuff = true
      attacker.statusEffects.set('aura-weaken', debuff)

      const target = createHero('target', { x: 160, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      const events = processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(target.hp).toBe(615) // 650 - (50 - 15) = 650 - 35
      expect(events[1]).toEqual({
        kind: 'damage',
        event: { targetId: 'target', amount: 35, sourceId: 'attacker' },
      })
    })

    it('should clamp effective attackDamage to 0 when debuff exceeds base', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 22,
        attackRange: 60, attackDamage: 10, attackSpeed: 0.8, attackCooldown: 0,
        heroType: 'BLADE',
      })
      const debuff = new StatusEffectSchema()
      debuff.id = 'aura-weaken'
      debuff.buffType = 'attackDamage'
      debuff.value = -30
      debuff.remainingDuration = 4
      debuff.isDebuff = true
      attacker.statusEffects.set('aura-weaken', debuff)

      const target = createHero('target', { x: 160, y: 100, team: 'red', radius: 22, hp: 650 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(target.hp).toBe(650) // 0 damage
    })

    it('should use effective attackDamage for ranged projectile damage', () => {
      const attacker = createHero('attacker', {
        x: 100, y: 100, team: 'blue', radius: 18,
        attackRange: 300, attackDamage: 45, attackSpeed: 1.0, attackCooldown: 0,
        heroType: 'BOLT',
      })
      const debuff = new StatusEffectSchema()
      debuff.id = 'aura-weaken'
      debuff.buffType = 'attackDamage'
      debuff.value = -10
      debuff.remainingDuration = 4
      debuff.isDebuff = true
      attacker.statusEffects.set('aura-weaken', debuff)

      const target = createHero('target', { x: 350, y: 100, team: 'red', radius: 22 })
      heroes.set('attacker', attacker)
      heroes.set('target', target)

      const input = createInput({ attackTargetId: 'target' })
      processHeroCombat(attacker, 'attacker', input, heroes, towers, projectiles, ProjectileSchema, 0.1)

      expect(projectiles.size).toBe(1)
      const proj = Array.from(projectiles.values())[0]!
      expect(proj.damage).toBe(35) // 45 - 10
    })

    it('should return empty events when no attack fires', () => {
      const hero = createHero('hero-1', { attackCooldown: 1.0 })
      heroes.set('hero-1', hero)

      const events = processHeroCombat(hero, 'hero-1', undefined, heroes, towers, projectiles, ProjectileSchema, 0.5)
      expect(events).toHaveLength(0)
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
