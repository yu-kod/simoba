import { describe, it, expect } from 'vitest'
import { EntityManager } from '@/scenes/EntityManager'
import { CombatManager } from '@/scenes/CombatManager'
import type { HeroState } from '@/domain/entities/Hero'
import { createMockCombatEntity, createMockTowerEntity } from '@/test/helpers/entityHelpers'
import { createMinionState, MELEE_MINION, RANGED_MINION } from '@shared/entities/Minion'

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
        hp: 100, maxHp: 100, heroType: 'BLADE', team: 'red', radius: 22,
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
        hp: 100, maxHp: 100, heroType: 'BOLT', team: 'red', radius: 18,
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
        hp: 100, maxHp: 100, heroType: 'BOLT', team: 'red', radius: 18,
      })
      cm.addRemoteProjectile({
        ownerId: 'remote-1', targetId: 'player-1',
        startPosition: { x: 0, y: 0 }, damage: 45, speed: 600,
      })
      cm.resetProjectiles()
      expect(cm.projectiles).toHaveLength(0)
    })
  })

  describe('processMinionAttacks', () => {
    it('returns empty events when no minions exist', () => {
      const { cm } = createManagers()
      const events = cm.processMinionAttacks(0.016)
      expect(events.damageEvents).toHaveLength(0)
      expect(events.projectileSpawnEvents).toHaveLength(0)
    })

    it('melee minion produces DamageEvent when target in range', () => {
      const { em, cm } = createManagers()
      const blueMinion = createMinionState({
        id: 'blue-minion',
        minionType: 'melee',
        team: 'blue',
        position: { x: 500, y: 360 },
      })
      const redMinion = createMinionState({
        id: 'red-minion',
        minionType: 'melee',
        team: 'red',
        position: { x: 500 + MELEE_MINION.stats.attackRange * 0.5, y: 360 },
      })
      em.registerEntity(blueMinion)
      em.registerEntity(redMinion)

      // Process enough frames for cooldown to allow an attack
      const events = cm.processMinionAttacks(10)
      expect(events.damageEvents.length).toBeGreaterThanOrEqual(1)
      expect(events.damageEvents[0]!.targetId).toBe('red-minion')
    })

    it('ranged minion produces ProjectileSpawnEvent when target in range', () => {
      const { em, cm } = createManagers()
      const blueRanged = createMinionState({
        id: 'blue-ranged',
        minionType: 'ranged',
        team: 'blue',
        position: { x: 500, y: 360 },
      })
      const redMinion = createMinionState({
        id: 'red-minion',
        minionType: 'melee',
        team: 'red',
        position: { x: 500 + RANGED_MINION.stats.attackRange * 0.5, y: 360 },
      })
      em.registerEntity(blueRanged)
      em.registerEntity(redMinion)

      const events = cm.processMinionAttacks(10)
      expect(events.projectileSpawnEvents.length).toBeGreaterThanOrEqual(1)
      expect(events.projectileSpawnEvents[0]!.targetId).toBe('red-minion')
    })

    it('dead minions are skipped', () => {
      const { em, cm } = createManagers()
      const deadMinion = createMinionState({
        id: 'dead-minion',
        minionType: 'melee',
        team: 'blue',
        position: { x: 500, y: 360 },
      })
      em.registerEntity({ ...deadMinion, dead: true })

      const events = cm.processMinionAttacks(10)
      expect(events.damageEvents).toHaveLength(0)
    })

    it('tower targets minion as enemy', () => {
      const { em, cm } = createManagers()
      const redMinion = createMinionState({
        id: 'red-minion',
        minionType: 'melee',
        team: 'red',
        position: { x: 100, y: 200 },
      })
      em.registerEntity(redMinion)

      // Move heroes far away so tower picks minion
      em.updateEntity<HeroState>('player-1', (h) => ({
        ...h,
        position: { x: 3000, y: 3000 },
      }))
      em.updateEntity<HeroState>('enemy-1', (h) => ({
        ...h,
        position: { x: 3000, y: 3000 },
      }))

      const blueTower = createMockTowerEntity({
        id: 'blue-tower',
        team: 'blue',
        position: { x: 100, y: 200 },
      })
      em.registerEntity(blueTower)

      const events = cm.processTowerAttacks(10)
      // Tower should target the red minion
      const hasMinionTarget = events.projectileSpawnEvents.some(
        (e) => e.targetId === 'red-minion',
      )
      expect(hasMinionTarget).toBe(true)
    })
  })
})
