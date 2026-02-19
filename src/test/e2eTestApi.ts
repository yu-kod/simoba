import type { HeroState } from '@/domain/entities/Hero'
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

function getLocalHero(entityManager: EntityManager): HeroState {
  return entityManager.getEntity(entityManager.localHeroId) as HeroState
}

function getEnemyHero(entityManager: EntityManager): HeroState {
  const heroes = entityManager.getHeroes()
  return heroes.find((h) => h.id !== entityManager.localHeroId)!
}

export function registerTestApi(
  entityManager: EntityManager,
  combatManager: CombatManager
): void {
  window.__test__ = {
    getHeroType: () => getLocalHero(entityManager).type,
    getHeroPosition: () => {
      const { x, y } = getLocalHero(entityManager).position
      return { x, y }
    },
    getHeroHp: () => {
      const hero = getLocalHero(entityManager)
      return { current: hero.hp, max: hero.maxHp }
    },
    getHeroDead: () => getLocalHero(entityManager).dead,
    getEnemyHp: () => {
      const enemy = getEnemyHero(entityManager)
      return { current: enemy.hp, max: enemy.maxHp }
    },
    getEnemyPosition: () => {
      const { x, y } = getEnemyHero(entityManager).position
      return { x, y }
    },
    getEnemyDead: () => getEnemyHero(entityManager).dead,
    getProjectileCount: () => combatManager.projectiles.length,
    getHeroAttackTarget: () => getLocalHero(entityManager).attackTargetId,
    getTowers: () =>
      entityManager.allEntities
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
