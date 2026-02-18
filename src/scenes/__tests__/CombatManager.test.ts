import { describe, it, expect } from 'vitest'
import { EntityManager } from '@/scenes/EntityManager'
import { CombatManager } from '@/scenes/CombatManager'

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
      // Set attack target
      em.updateLocalHero((h) => ({ ...h, attackTargetId: 'enemy-1', attackCooldown: 0 }))

      const events = cm.processAttack(0.016)
      expect(events.damageEvents).toHaveLength(1)
      expect(events.damageEvents[0]!.targetId).toBe('enemy-1')
      expect(events.damageEvents[0]!.damage).toBe(60) // BLADE base attackDamage
      expect(events.meleeSwings).toHaveLength(1)
    })

    it('applies damage to enemy through EntityManager', () => {
      const { em, cm } = createManagers()
      em.updateLocalHero((h) => ({ ...h, attackTargetId: 'enemy-1', attackCooldown: 0 }))

      cm.processAttack(0.016)
      expect(em.enemy.hp).toBe(650 - 60) // BLADE maxHp - BLADE attackDamage
    })

    it('produces projectile spawn for BOLT hero', () => {
      const em = new EntityManager(
        { ...LOCAL_HERO_PARAMS, type: 'BOLT' },
        { ...ENEMY_PARAMS, position: { x: 200, y: 200 } }
      )
      const cm = new CombatManager(em)

      em.updateLocalHero((h) => ({ ...h, attackTargetId: 'enemy-1', attackCooldown: 0 }))
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
      // Enemy is at (140, 200), within BLADE attack range
      cm.handleAttackInput({ x: 140, y: 200 })
      expect(em.localHero.attackTargetId).toBe('enemy-1')
    })

    it('faces click direction on ground click', () => {
      const { em, cm } = createManagers()
      // Click far from enemy (ground click)
      cm.handleAttackInput({ x: 1000, y: 200 })
      expect(em.localHero.attackTargetId).toBeNull()
      expect(em.localHero.facing).toBeCloseTo(0) // Right direction
    })

    it('faces enemy when clicking out of range enemy', () => {
      const em = new EntityManager(
        LOCAL_HERO_PARAMS,
        { ...ENEMY_PARAMS, position: { x: 500, y: 200 } }
      )
      const cm = new CombatManager(em)

      cm.handleAttackInput({ x: 500, y: 200 })
      expect(em.localHero.attackTargetId).toBeNull()
      expect(em.localHero.facing).toBeCloseTo(0) // Facing right toward enemy
    })
  })

  describe('applyLocalDamage', () => {
    it('reduces enemy HP', () => {
      const { em, cm } = createManagers()
      cm.applyLocalDamage('enemy-1', 50)
      expect(em.enemy.hp).toBe(600)
    })

    it('reduces remote player HP', () => {
      const { em, cm } = createManagers()
      em.addRemotePlayer({
        sessionId: 'remote-1', x: 0, y: 0, facing: 0,
        hp: 100, maxHp: 100, heroType: 'BLADE', team: 'red',
      })
      cm.applyLocalDamage('remote-1', 50)
      const remote = em.getRemotePlayer('remote-1')
      expect(remote!.hp).toBe(600) // BLADE maxHp 650 - 50
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
