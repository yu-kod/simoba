import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { registerTestApi, unregisterTestApi } from '@/test/e2eTestApi'
import { EntityManager } from '@/scenes/EntityManager'
import { CombatManager } from '@/scenes/CombatManager'
import { createTowerState } from '@/domain/entities/Tower'
import { DEFAULT_TOWER } from '@/domain/entities/towerDefinitions'

describe('e2eTestApi', () => {
  let em: EntityManager
  let cm: CombatManager

  beforeEach(() => {
    em = new EntityManager(
      { id: 'player-1', type: 'BLADE', team: 'blue', position: { x: 100, y: 200 } },
      { id: 'enemy-1', type: 'BOLT', team: 'red', position: { x: 500, y: 300 } }
    )
    cm = new CombatManager(em)
    registerTestApi(em, cm)
  })

  afterEach(() => {
    unregisterTestApi()
  })

  it('should register window.__test__', () => {
    expect(window.__test__).toBeDefined()
  })

  it('should unregister window.__test__', () => {
    unregisterTestApi()
    expect(window.__test__).toBeUndefined()
  })

  describe('getHeroType', () => {
    it('should return current hero type', () => {
      expect(window.__test__!.getHeroType()).toBe('BLADE')
    })

    it('should reflect hero type changes', () => {
      em.resetLocalHero({ id: 'player-1', type: 'BOLT', team: 'blue', position: { x: 0, y: 0 } })
      expect(window.__test__!.getHeroType()).toBe('BOLT')
    })
  })

  describe('getHeroPosition', () => {
    it('should return current hero position', () => {
      const pos = window.__test__!.getHeroPosition()
      expect(pos.x).toBe(100)
      expect(pos.y).toBe(200)
    })

    it('should reflect position changes', () => {
      em.updateLocalHero((h) => ({ ...h, position: { x: 300, y: 400 } }))
      const pos = window.__test__!.getHeroPosition()
      expect(pos.x).toBe(300)
      expect(pos.y).toBe(400)
    })
  })

  describe('getHeroHp', () => {
    it('should return current and max HP', () => {
      const hp = window.__test__!.getHeroHp()
      expect(hp.current).toBe(hp.max)
      expect(hp.max).toBeGreaterThan(0)
    })
  })

  describe('getEnemyHp', () => {
    it('should return current and max HP', () => {
      const hp = window.__test__!.getEnemyHp()
      expect(hp.current).toBe(hp.max)
      expect(hp.max).toBeGreaterThan(0)
    })

    it('should reflect damage', () => {
      em.updateEnemy((e) => ({ ...e, hp: e.hp - 50 }))
      const hp = window.__test__!.getEnemyHp()
      expect(hp.current).toBe(hp.max - 50)
    })
  })

  describe('getEnemyPosition', () => {
    it('should return enemy position', () => {
      const pos = window.__test__!.getEnemyPosition()
      expect(pos.x).toBe(500)
      expect(pos.y).toBe(300)
    })
  })

  describe('getProjectileCount', () => {
    it('should return 0 when no projectiles', () => {
      expect(window.__test__!.getProjectileCount()).toBe(0)
    })
  })

  describe('getTowers', () => {
    it('should return empty array when no towers registered', () => {
      expect(window.__test__!.getTowers()).toEqual([])
    })

    it('should return registered towers', () => {
      const tower = createTowerState({
        id: 'tower-blue',
        team: 'blue',
        position: { x: 600, y: 360 },
        definition: DEFAULT_TOWER,
      })
      em.registerEntity(tower)
      const towers = window.__test__!.getTowers()
      expect(towers).toHaveLength(1)
      expect(towers[0].id).toBe('tower-blue')
      expect(towers[0].team).toBe('blue')
      expect(towers[0].position).toEqual({ x: 600, y: 360 })
      expect(towers[0].hp).toBe(towers[0].maxHp)
      expect(towers[0].dead).toBe(false)
    })
  })
})
