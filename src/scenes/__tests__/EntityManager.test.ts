import { describe, it, expect } from 'vitest'
import { EntityManager } from '@/scenes/EntityManager'
import type { RemotePlayerState } from '@/network/GameMode'
import { createMockCombatEntity } from '@/test/helpers/entityHelpers'

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
  position: { x: 300, y: 200 },
}

function createManager() {
  return new EntityManager(LOCAL_HERO_PARAMS, ENEMY_PARAMS)
}

describe('EntityManager', () => {
  describe('initialization', () => {
    it('creates local hero with correct params', () => {
      const em = createManager()
      expect(em.localHero.id).toBe('player-1')
      expect(em.localHero.type).toBe('BLADE')
      expect(em.localHero.team).toBe('blue')
      expect(em.localHero.position).toEqual({ x: 100, y: 200 })
    })

    it('creates enemy with correct params', () => {
      const em = createManager()
      expect(em.enemy.id).toBe('enemy-1')
      expect(em.enemy.type).toBe('BLADE')
      expect(em.enemy.team).toBe('red')
    })
  })

  describe('getEntity', () => {
    it('returns local hero by id', () => {
      const em = createManager()
      expect(em.getEntity('player-1')).toBe(em.localHero)
    })

    it('returns enemy by id', () => {
      const em = createManager()
      expect(em.getEntity('enemy-1')).toBe(em.enemy)
    })

    it('returns null for unknown id', () => {
      const em = createManager()
      expect(em.getEntity('unknown')).toBeNull()
    })

    it('returns remote player by session id', () => {
      const em = createManager()
      const remote: RemotePlayerState = {
        sessionId: 'remote-1',
        x: 500, y: 300,
        facing: 0, hp: 100, maxHp: 100,
        heroType: 'BOLT', team: 'red',
      }
      em.addRemotePlayer(remote)
      const entity = em.getEntity('remote-1')
      expect(entity).not.toBeNull()
      expect(entity!.id).toBe('remote-1')
    })
  })

  describe('getEnemies', () => {
    it('returns array containing the enemy', () => {
      const em = createManager()
      const enemies = em.getEnemies()
      expect(enemies).toHaveLength(1)
      expect(enemies[0]!.id).toBe('enemy-1')
    })

    it('excludes dead enemy', () => {
      const em = createManager()
      em.updateEnemy((e) => ({ ...e, dead: true, respawnTimer: 5 }))
      expect(em.getEnemies()).toHaveLength(0)
    })

    it('includes enemy after respawn', () => {
      const em = createManager()
      em.updateEnemy((e) => ({ ...e, dead: true }))
      em.updateEnemy((e) => ({ ...e, dead: false }))
      expect(em.getEnemies()).toHaveLength(1)
    })
  })

  describe('getEntityRadius', () => {
    it('returns BLADE radius for local hero', () => {
      const em = createManager()
      expect(em.getEntityRadius('player-1')).toBe(22)
    })

    it('returns BLADE radius for enemy', () => {
      const em = createManager()
      expect(em.getEntityRadius('enemy-1')).toBe(22)
    })

    it('returns BOLT radius for remote BOLT player', () => {
      const em = createManager()
      em.addRemotePlayer({
        sessionId: 'r1', x: 0, y: 0, facing: 0,
        hp: 100, maxHp: 100, heroType: 'BOLT', team: 'blue',
      })
      expect(em.getEntityRadius('r1')).toBe(18)
    })

    it('returns default radius for unknown id', () => {
      const em = createManager()
      expect(em.getEntityRadius('unknown')).toBe(20)
    })
  })

  describe('updateLocalHero', () => {
    it('applies updater function immutably', () => {
      const em = createManager()
      const original = em.localHero
      em.updateLocalHero((h) => ({ ...h, facing: 1.5 }))
      expect(em.localHero.facing).toBe(1.5)
      expect(em.localHero).not.toBe(original)
    })
  })

  describe('updateEnemy', () => {
    it('applies updater function immutably', () => {
      const em = createManager()
      const original = em.enemy
      em.updateEnemy((e) => ({ ...e, hp: 50 }))
      expect(em.enemy.hp).toBe(50)
      expect(em.enemy).not.toBe(original)
    })
  })

  describe('resetLocalHero', () => {
    it('creates a fresh hero state', () => {
      const em = createManager()
      em.updateLocalHero((h) => ({ ...h, hp: 10 }))
      em.resetLocalHero({ ...LOCAL_HERO_PARAMS, type: 'BOLT' })
      expect(em.localHero.type).toBe('BOLT')
      expect(em.localHero.hp).toBe(em.localHero.maxHp)
    })
  })

  describe('remote player management', () => {
    const remote: RemotePlayerState = {
      sessionId: 'sess-1',
      x: 400, y: 300,
      facing: 1.0, hp: 80, maxHp: 100,
      heroType: 'AURA', team: 'red',
    }

    it('addRemotePlayer creates hero state and returns it', () => {
      const em = createManager()
      const state = em.addRemotePlayer(remote)
      expect(state.id).toBe('sess-1')
      expect(state.type).toBe('AURA')
      expect(state.team).toBe('red')
      expect(state.position).toEqual({ x: 400, y: 300 })
    })

    it('removeRemotePlayer returns true for existing player', () => {
      const em = createManager()
      em.addRemotePlayer(remote)
      expect(em.removeRemotePlayer('sess-1')).toBe(true)
      expect(em.getEntity('sess-1')).toBeNull()
    })

    it('removeRemotePlayer returns false for non-existing player', () => {
      const em = createManager()
      expect(em.removeRemotePlayer('unknown')).toBe(false)
    })

    it('updateRemotePlayer updates position, facing, hp', () => {
      const em = createManager()
      em.addRemotePlayer(remote)
      const updated = em.updateRemotePlayer({
        ...remote,
        x: 500, y: 400, facing: 2.0, hp: 60,
      })
      expect(updated).not.toBeNull()
      expect(updated!.position).toEqual({ x: 500, y: 400 })
      expect(updated!.facing).toBe(2.0)
      expect(updated!.hp).toBe(60)
    })

    it('updateRemotePlayer returns null for non-existing player', () => {
      const em = createManager()
      expect(em.updateRemotePlayer(remote)).toBeNull()
    })

    it('applyDamageToRemote reduces hp', () => {
      const em = createManager()
      em.addRemotePlayer(remote)
      const result = em.applyDamageToRemote('sess-1', 30)
      expect(result).not.toBeNull()
      // AURA base maxHp = 500, so 500 - 30 = 470
      expect(result!.hp).toBe(470)
    })

    it('applyDamageToRemote clamps hp to 0', () => {
      const em = createManager()
      em.addRemotePlayer(remote)
      const result = em.applyDamageToRemote('sess-1', 9999)
      expect(result!.hp).toBe(0)
    })

    it('applyDamageToRemote returns null for non-existing player', () => {
      const em = createManager()
      expect(em.applyDamageToRemote('unknown', 10)).toBeNull()
    })
  })

  describe('entity registry', () => {
    it('registerEntity adds entity to registry', () => {
      const em = createManager()
      const tower = createMockCombatEntity({
        id: 'tower-1',
        entityType: 'tower',
        team: 'red',
        hp: 500,
        maxHp: 500,
        radius: 30,
      })
      em.registerEntity(tower)
      expect(em.getEntity('tower-1')).toBe(tower)
    })

    it('removeEntity removes entity from registry', () => {
      const em = createManager()
      const tower = createMockCombatEntity({ id: 'tower-1' })
      em.registerEntity(tower)
      em.removeEntity('tower-1')
      expect(em.getEntity('tower-1')).toBeNull()
    })

    it('updateEntity applies updater immutably', () => {
      const em = createManager()
      const tower = createMockCombatEntity({ id: 'tower-1', hp: 500, maxHp: 500 })
      em.registerEntity(tower)
      em.updateEntity('tower-1', (e) => ({ ...e, hp: 400 }))
      const updated = em.getEntity('tower-1')
      expect(updated).not.toBe(tower)
      expect(updated!.hp).toBe(400)
    })

    it('updateEntity does nothing for unknown id', () => {
      const em = createManager()
      em.updateEntity('unknown', (e) => ({ ...e, hp: 0 }))
      expect(em.getEntity('unknown')).toBeNull()
    })

    it('getEntity searches heroes before registry', () => {
      const em = createManager()
      expect(em.getEntity('player-1')).toBe(em.localHero)
    })

    it('getEntity falls through to registry', () => {
      const em = createManager()
      const minion = createMockCombatEntity({ id: 'minion-1', entityType: 'minion' })
      em.registerEntity(minion)
      expect(em.getEntity('minion-1')).toBe(minion)
    })
  })

  describe('getEnemiesOf', () => {
    it('returns enemies of blue team', () => {
      const em = createManager()
      const enemies = em.getEnemiesOf('blue')
      expect(enemies).toHaveLength(1)
      expect(enemies[0]!.id).toBe('enemy-1')
    })

    it('returns enemies of red team (includes localHero)', () => {
      const em = createManager()
      const enemies = em.getEnemiesOf('red')
      // localHero is blue, so it IS an enemy of red
      expect(enemies).toHaveLength(1)
      expect(enemies[0]!.id).toBe('player-1')
    })

    it('includes registry entities as enemies', () => {
      const em = createManager()
      const tower = createMockCombatEntity({
        id: 'tower-1',
        entityType: 'tower',
        team: 'red',
        hp: 500,
        maxHp: 500,
      })
      em.registerEntity(tower)
      const enemies = em.getEnemiesOf('blue')
      expect(enemies.some((e) => e.id === 'tower-1')).toBe(true)
    })

    it('excludes dead registry entities', () => {
      const em = createManager()
      const tower = createMockCombatEntity({
        id: 'tower-1',
        team: 'red',
        dead: true,
      })
      em.registerEntity(tower)
      const enemies = em.getEnemiesOf('blue')
      expect(enemies.some((e) => e.id === 'tower-1')).toBe(false)
    })

    it('neutral entities are enemies of both teams', () => {
      const em = createManager()
      const boss = createMockCombatEntity({
        id: 'boss-1',
        entityType: 'boss',
        team: 'neutral',
        hp: 1000,
        maxHp: 1000,
      })
      em.registerEntity(boss)
      expect(em.getEnemiesOf('blue').some((e) => e.id === 'boss-1')).toBe(true)
      expect(em.getEnemiesOf('red').some((e) => e.id === 'boss-1')).toBe(true)
    })

    it('getEnemies delegates to getEnemiesOf(localHero.team)', () => {
      const em = createManager()
      expect(em.getEnemies()).toEqual(em.getEnemiesOf('blue'))
    })
  })

  describe('getEntityRadius (simplified)', () => {
    it('returns radius from entity state directly', () => {
      const em = createManager()
      const tower = createMockCombatEntity({ id: 'tower-1', radius: 30 })
      em.registerEntity(tower)
      expect(em.getEntityRadius('tower-1')).toBe(30)
    })

    it('returns default radius for unknown entity', () => {
      const em = createManager()
      expect(em.getEntityRadius('unknown')).toBe(20)
    })
  })
})
