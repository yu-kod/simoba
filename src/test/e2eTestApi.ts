import type { EntityManager } from '@/scenes/EntityManager'
import type { CombatManager } from '@/scenes/CombatManager'

export interface E2ETestApi {
  getHeroType: () => string
  getHeroPosition: () => { x: number; y: number }
  getHeroHp: () => { current: number; max: number }
  getEnemyHp: () => { current: number; max: number }
  getEnemyPosition: () => { x: number; y: number }
  getProjectileCount: () => number
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
    getEnemyHp: () => ({
      current: entityManager.enemy.hp,
      max: entityManager.enemy.maxHp,
    }),
    getEnemyPosition: () => {
      const { x, y } = entityManager.enemy.position
      return { x, y }
    },
    getProjectileCount: () => combatManager.projectiles.length,
  }
}

export function unregisterTestApi(): void {
  delete window.__test__
}
