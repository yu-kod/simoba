import type { EntityManager } from '@/scenes/EntityManager'
import type { CombatManager } from '@/scenes/CombatManager'

export interface TowerTestData {
  id: string
  team: string
  position: { x: number; y: number }
  hp: number
  maxHp: number
  dead: boolean
}

export interface E2ETestApi {
  getHeroType: () => string
  getHeroPosition: () => { x: number; y: number }
  getHeroHp: () => { current: number; max: number }
  getHeroDead: () => boolean
  getEnemyHp: () => { current: number; max: number }
  getEnemyPosition: () => { x: number; y: number }
  getEnemyDead: () => boolean
  getProjectileCount: () => number
  getHeroAttackTarget: () => string | null
  getTowers: () => TowerTestData[]
}

declare global {
  interface Window {
    __test__?: E2ETestApi
  }
}

export function registerTestApi(
  entityManager: EntityManager,
  combatManager: CombatManager
): void {
  window.__test__ = {
    getHeroType: () => entityManager.localHero.type,
    getHeroPosition: () => {
      const { x, y } = entityManager.localHero.position
      return { x, y }
    },
    getHeroHp: () => ({
      current: entityManager.localHero.hp,
      max: entityManager.localHero.maxHp,
    }),
    getHeroDead: () => entityManager.localHero.dead,
    getEnemyHp: () => ({
      current: entityManager.enemy.hp,
      max: entityManager.enemy.maxHp,
    }),
    getEnemyPosition: () => {
      const { x, y } = entityManager.enemy.position
      return { x, y }
    },
    getEnemyDead: () => entityManager.enemy.dead,
    getProjectileCount: () => combatManager.projectiles.length,
    getHeroAttackTarget: () => entityManager.localHero.attackTargetId,
    getTowers: () =>
      entityManager.registeredEntities
        .filter((e) => e.entityType === 'tower')
        .map((t) => ({
          id: t.id,
          team: t.team,
          position: { x: t.position.x, y: t.position.y },
          hp: t.hp,
          maxHp: t.maxHp,
          dead: t.dead,
        })),
  }
}

export function unregisterTestApi(): void {
  delete window.__test__
}
