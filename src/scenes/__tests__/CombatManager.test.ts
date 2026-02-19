import { describe, it, expect } from 'vitest'
import { EntityManager } from '@/scenes/EntityManager'
import { CombatManager } from '@/scenes/CombatManager'
import type { HeroState } from '@/domain/entities/Hero'
import { createMockCombatEntity, createMockTowerEntity } from '@/test/helpers/entityHelpers'

const LOCAL_HERO_PARAMS = {
  id: 'player-1',
  type: 'BLADE' as const,
  team: 'blue' as const,
  position: { x: 100, y: 200 },
}

const ENEMY_PARAMS = {
  id: 'enemy-1',
  type: 'BLADE' as const,
  team: 'red' as const,
  position: { x: 140, y: 200 },
}

function createManagers() {
  const em = new EntityManager(LOCAL_HERO_PARAMS, ENEMY_PARAMS)
  const cm = new CombatManager(em)
  return { em, cm }
}

describe('CombatManager', () => {
  describe('processAttack', () => {
    it('returns empty events when no target is set', () => {
      const { cm } = createManagers()
      const events = cm.processAttack(0.016)
      expect(events.damageEvents).toHaveLength(0)
      expect(events.projectileSpawnEvents).toHaveLength(0)
      expect(events.meleeSwings).toHaveLength(0)
    })

    it('produces melee damage event when BLADE attacks in range', () => {
      const { em, cm } = createManagers()
      em.updateEntity<HeroState>('player-1', (h) => ({ ...h, attackTargetId: 'enemy-1', attackCooldown: 0 }))

      const events = cm.processAttack(0.016)
      expect(events.damageEvents).toHaveLength(1)
      expect(events.damageEvents[0]!.targetId).toBe('enemy-1')
      expect(events.damageEvents[0]!.damage).toBe(60) // BLADE base attackDamage
      expect(events.meleeSwings).toHaveLength(1)
    })

    it('applies damage to enemy through EntityManager', () => {
      const { em, cm } = createManagers()
      em.updateEntity<HeroState>('player-1', (h) => ({ ...h, attackTargetId: 'enemy-1', attackCooldown: 0 }))

      cm.processAttack(0.016)
      const enemy = em.getEntity('enemy-1')!
      expect(enemy.hp).toBe(650 - 60) // BLADE maxHp - BLADE attackDamage
    })

    it('produces projectile spawn for BOLT hero', () => {
      const em = new EntityManager(
        { ...LOCAL_HERO_PARAMS, type: 'BOLT' },
        { ...ENEMY_PARAMS, position: { x: 200, y: 200 } }
      )
      const cm = new CombatManager(em)

      em.updateEntity<HeroState>('player-1', (h) => ({ ...h, attackTargetId: 'enemy-1', attackCooldown: 0 }))
      const events = cm.processAttack(0.016)

      expect(events.projectileSpawnEvents).toHaveLength(1)
      expect(events.projectileSpawnEvents[0]!.targetId).toBe('enemy-1')
      expect(events.damageEvents).toHaveLength(0)
    })
  })

  describe('processProjectiles', () => {
    it('returns empty events when no projectiles exist', () => {
      const { cm } = createManagers()
      const events = cm.processProjectiles(0.016)
      expect(events.damageEvents).toHaveLength(0)
    })

    it('tracks projectiles list', () => {
      const { cm } = createManagers()
      expect(cm.projectiles).toHaveLength(0)
    })
  })

  describe('handleAttackInput', () => {
    it('sets attack target when clicking enemy in range', () => {
      const { em, cm } = createManagers()
      cm.handleAttackInput({ x: 140, y: 200 })
      const hero = em.getEntity('player-1') as HeroState
      expect(hero.attackTargetId).toBe('enemy-1')
    })

    it('faces click direction on ground click', () => {
      const { em, cm } = createManagers()
      cm.handleAttackInput({ x: 1000, y: 200 })
      const hero = em.getEntity('player-1') as HeroState
      expect(hero.attackTargetId).toBeNull()
      expect(hero.facing).toBeCloseTo(0)
    })

    it('faces enemy when clicking out of range enemy', () => {
      const em = new EntityManager(
        LOCAL_HERO_PARAMS,
        { ...ENEMY_PARAMS, position: { x: 500, y: 200 } }
      )
      const cm = new CombatManager(em)

      cm.handleAttackInput({ x: 500, y: 200 })
      const hero = em.getEntity('player-1') as HeroState
      expect(hero.attackTargetId).toBeNull()
      expect(hero.facing).toBeCloseTo(0)
    })
  })

  describe('applyLocalDamage', () => {
    it('reduces enemy HP via unified path', () => {
      const { em, cm } = createManagers()
      cm.applyLocalDamage('enemy-1', 50)
      expect(em.getEntity('enemy-1')!.hp).toBe(600)
    })

    it('reduces local hero HP via unified path', () => {
      const { em, cm } = createManagers()
      cm.applyLocalDamage('player-1', 50)
      expect(em.getEntity('player-1')!.hp).toBe(600)
    })

    it('reduces remote player HP via unified path', () => {
      const { em, cm } = createManagers()
      em.addRemotePlayer({
        sessionId: 'remote-1', x: 0, y: 0, facing: 0,
        hp: 100, maxHp: 100, heroType: 'BLADE', team: 'red',
      })
      cm.applyLocalDamage('remote-1', 50)
      const remote = em.getEntity('remote-1')
      expect(remote!.hp).toBe(600) // BLADE maxHp 650 - 50
    })

    it('reduces registry entity HP via unified path', () => {
      const { em, cm } = createManagers()
      const tower = createMockCombatEntity({
        id: 'tower-1',
        entityType: 'tower',
        team: 'red',
        hp: 500,
        maxHp: 500,
        radius: 30,
      })
      em.registerEntity(tower)
      cm.applyLocalDamage('tower-1', 100)
      const updated = em.getEntity('tower-1')
      expect(updated!.hp).toBe(400)
    })
  })

  describe('addRemoteProjectile', () => {
    it('adds a projectile to the pool', () => {
      const { em, cm } = createManagers()
      em.addRemotePlayer({
        sessionId: 'remote-1', x: 0, y: 0, facing: 0,
        hp: 100, maxHp: 100, heroType: 'BOLT', team: 'red',
      })
      cm.addRemoteProjectile({
        ownerId: 'remote-1',
        targetId: 'player-1',
        startPosition: { x: 0, y: 0 },
        damage: 45,
        speed: 600,
      })
      expect(cm.projectiles).toHaveLength(1)
      expect(cm.projectiles[0]!.ownerId).toBe('remote-1')
    })
  })

  describe('processTowerAttacks', () => {
    it('returns empty events when no towers are registered', () => {
      const { cm } = createManagers()
      const events = cm.processTowerAttacks(0.016)
      expect(events.damageEvents).toHaveLength(0)
      expect(events.projectileSpawnEvents).toHaveLength(0)
    })

    it('spawns projectile when tower has enemy in range', () => {
      const { em, cm } = createManagers()
      const tower = createMockTowerEntity({
        id: 'tower-red',
        team: 'red',
        position: { x: 300, y: 200 },
      })
      em.registerEntity(tower)

      const events = cm.processTowerAttacks(0.016)
      expect(events.projectileSpawnEvents).toHaveLength(1)
      expect(events.projectileSpawnEvents[0]!.ownerId).toBe('tower-red')
    })

    it('skips dead towers', () => {
      const { em, cm } = createManagers()
      const deadTower = createMockTowerEntity({
        id: 'tower-dead',
        team: 'red',
        position: { x: 300, y: 200 },
        hp: 0,
        dead: true,
      })
      em.registerEntity(deadTower)

      const events = cm.processTowerAttacks(0.016)
      expect(events.projectileSpawnEvents).toHaveLength(0)
      expect(events.damageEvents).toHaveLength(0)
    })

    it('returns empty events when enemy is out of tower range', () => {
      const { em, cm } = createManagers()
      const tower = createMockTowerEntity({
        id: 'tower-far',
        team: 'red',
        position: { x: 2600, y: 360 },
      })
      em.registerEntity(tower)

      const events = cm.processTowerAttacks(0.016)
      expect(events.projectileSpawnEvents).toHaveLength(0)
    })
  })

  describe('resetProjectiles', () => {
    it('clears all projectiles', () => {
      const { em, cm } = createManagers()
      em.addRemotePlayer({
        sessionId: 'remote-1', x: 0, y: 0, facing: 0,
        hp: 100, maxHp: 100, heroType: 'BOLT', team: 'red',
      })
      cm.addRemoteProjectile({
        ownerId: 'remote-1', targetId: 'player-1',
        startPosition: { x: 0, y: 0 }, damage: 45, speed: 600,
      })
      cm.resetProjectiles()
      expect(cm.projectiles).toHaveLength(0)
    })
  })
})
