import { describe, it, expect } from 'vitest'
import { EntityManager } from '@/scenes/EntityManager'
import type { HeroState } from '@/domain/entities/Hero'
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
      const hero = em.getEntity('player-1') as HeroState
      expect(hero.id).toBe('player-1')
      expect(hero.type).toBe('BLADE')
      expect(hero.team).toBe('blue')
      expect(hero.position).toEqual({ x: 100, y: 200 })
    })

    it('creates enemy with correct params', () => {
      const em = createManager()
      const enemy = em.getEntity('enemy-1') as HeroState
      expect(enemy.id).toBe('enemy-1')
      expect(enemy.type).toBe('BLADE')
      expect(enemy.team).toBe('red')
    })

    it('sets localHeroId to the first hero', () => {
      const em = createManager()
      expect(em.localHeroId).toBe('player-1')
    })
  })

  describe('getEntity', () => {
    it('returns local hero by id', () => {
      const em = createManager()
      const hero = em.getEntity('player-1')
      expect(hero).not.toBeNull()
      expect(hero!.id).toBe('player-1')
    })

    it('returns enemy by id', () => {
      const em = createManager()
      const enemy = em.getEntity('enemy-1')
      expect(enemy).not.toBeNull()
      expect(enemy!.id).toBe('enemy-1')
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

  describe('getHeroes', () => {
    it('returns all heroes', () => {
      const em = createManager()
      const heroes = em.getHeroes()
      expect(heroes).toHaveLength(2)
      expect(heroes.map((h) => h.id).sort()).toEqual(['enemy-1', 'player-1'])
    })

    it('includes remote heroes', () => {
      const em = createManager()
      em.addRemotePlayer({
        sessionId: 'remote-1', x: 0, y: 0, facing: 0,
        hp: 100, maxHp: 100, heroType: 'BOLT', team: 'red',
      })
      const heroes = em.getHeroes()
      expect(heroes).toHaveLength(3)
    })

    it('does not include non-hero entities', () => {
      const em = createManager()
      em.registerEntity(createMockCombatEntity({ id: 'tower-1', entityType: 'tower' }))
      const heroes = em.getHeroes()
      expect(heroes).toHaveLength(2)
    })

    it('includes dead heroes', () => {
      const em = createManager()
      em.updateEntity<HeroState>('enemy-1', (e) => ({ ...e, dead: true, respawnTimer: 5 }))
      const heroes = em.getHeroes()
      expect(heroes).toHaveLength(2)
    })
  })

  describe('allEntities', () => {
    it('returns all registered entities', () => {
      const em = createManager()
      em.registerEntity(createMockCombatEntity({ id: 'tower-1', entityType: 'tower' }))
      const all = em.allEntities
      expect(all).toHaveLength(3) // 2 heroes + 1 tower
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

    it('excludes dead entities', () => {
      const em = createManager()
      em.updateEntity<HeroState>('enemy-1', (e) => ({ ...e, dead: true, respawnTimer: 5 }))
      expect(em.getEnemiesOf('blue')).toHaveLength(0)
    })

    it('includes after respawn', () => {
      const em = createManager()
      em.updateEntity<HeroState>('enemy-1', (e) => ({ ...e, dead: true }))
      em.updateEntity<HeroState>('enemy-1', (e) => ({ ...e, dead: false }))
      expect(em.getEnemiesOf('blue')).toHaveLength(1)
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

    it('excludes dead registry entities', () => {
      const em = createManager()
      const tower = createMockCombatEntity({
        id: 'tower-1',
        team: 'red',
        dead: true,
      })
      em.registerEntity(tower)
      expect(em.getEnemiesOf('blue').some((e) => e.id === 'tower-1')).toBe(false)
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

    it('returns radius from registered entity', () => {
      const em = createManager()
      const tower = createMockCombatEntity({ id: 'tower-1', radius: 30 })
      em.registerEntity(tower)
      expect(em.getEntityRadius('tower-1')).toBe(30)
    })
  })

  describe('updateEntity', () => {
    it('applies updater function immutably to hero', () => {
      const em = createManager()
      const original = em.getEntity('player-1')
      em.updateEntity<HeroState>('player-1', (h) => ({ ...h, facing: 1.5 }))
      const updated = em.getEntity('player-1') as HeroState
      expect(updated.facing).toBe(1.5)
      expect(updated).not.toBe(original)
    })

    it('applies updater function immutably to enemy', () => {
      const em = createManager()
      const original = em.getEntity('enemy-1')
      em.updateEntity<HeroState>('enemy-1', (e) => ({ ...e, hp: 50 }))
      const updated = em.getEntity('enemy-1')
      expect(updated!.hp).toBe(50)
      expect(updated).not.toBe(original)
    })

    it('applies updater to registry entities', () => {
      const em = createManager()
      const tower = createMockCombatEntity({ id: 'tower-1', hp: 500, maxHp: 500 })
      em.registerEntity(tower)
      em.updateEntity('tower-1', (e) => ({ ...e, hp: 400 }))
      const updated = em.getEntity('tower-1')
      expect(updated).not.toBe(tower)
      expect(updated!.hp).toBe(400)
    })

    it('does nothing for unknown id', () => {
      const em = createManager()
      em.updateEntity('unknown', (e) => ({ ...e, hp: 0 }))
      expect(em.getEntity('unknown')).toBeNull()
    })
  })

  describe('registerEntity / removeEntity', () => {
    it('registerEntity adds entity', () => {
      const em = createManager()
      const tower = createMockCombatEntity({ id: 'tower-1', entityType: 'tower', team: 'red' })
      em.registerEntity(tower)
      expect(em.getEntity('tower-1')).toBe(tower)
    })

    it('removeEntity removes entity', () => {
      const em = createManager()
      const tower = createMockCombatEntity({ id: 'tower-1' })
      em.registerEntity(tower)
      em.removeEntity('tower-1')
      expect(em.getEntity('tower-1')).toBeNull()
    })
  })

  describe('remote player management', () => {
    const remote: RemotePlayerState = {
      sessionId: 'sess-1',
      x: 400, y: 300,
      facing: 1.0, hp: 80, maxHp: 100,
      heroType: 'AURA', team: 'red',
    }

    it('addRemotePlayer creates hero state in single Map', () => {
      const em = createManager()
      const state = em.addRemotePlayer(remote)
      expect(state.id).toBe('sess-1')
      expect(state.type).toBe('AURA')
      expect(state.team).toBe('red')
      expect(state.position).toEqual({ x: 400, y: 300 })
      // Verify it's in the same Map via getEntity
      expect(em.getEntity('sess-1')).not.toBeNull()
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
  })
})
