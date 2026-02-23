import type { CombatEntityState, AttackerEntityState, HeroType, Team, Position } from '@/domain/types'
import type { TowerState } from '@/domain/entities/Tower'
import { EntityManager } from '@/scenes/EntityManager'
import { CombatManager } from '@/scenes/CombatManager'

interface CreateTestEntityManagerOptions {
  readonly localHeroId?: string
  readonly localHeroType?: HeroType
  readonly localTeam?: Team
  readonly localPosition?: Position
  readonly enemyId?: string
  readonly enemyType?: HeroType
  readonly enemyTeam?: Team
  readonly enemyPosition?: Position
}

export function createTestEntityManager(options: CreateTestEntityManagerOptions = {}) {
  const em = new EntityManager(
    {
      id: options.localHeroId ?? 'player-1',
      type: options.localHeroType ?? 'BLADE',
      team: options.localTeam ?? 'blue',
      position: options.localPosition ?? { x: 100, y: 200 },
    },
    {
      id: options.enemyId ?? 'enemy-1',
      type: options.enemyType ?? 'BLADE',
      team: options.enemyTeam ?? 'red',
      position: options.enemyPosition ?? { x: 300, y: 200 },
    }
  )
  const cm = new CombatManager(em)
  return { em, cm }
}

export function createMockCombatEntity(
  overrides: Partial<CombatEntityState> = {}
): CombatEntityState {
  return {
    id: 'entity-1',
    entityType: 'hero',
    position: { x: 0, y: 0 },
    team: 'red',
    hp: 100,
    maxHp: 100,
    dead: false,
    radius: 20,
    ...overrides,
  }
}

export function createMockAttackerEntity(
  overrides: Partial<AttackerEntityState> = {}
): AttackerEntityState {
  return {
    id: 'attacker-1',
    entityType: 'hero',
    position: { x: 0, y: 0 },
    team: 'red',
    hp: 100,
    maxHp: 100,
    dead: false,
    radius: 20,
    stats: {
      maxHp: 100,
      speed: 170,
      attackDamage: 60,
      attackRange: 60,
      attackSpeed: 0.8,
    },
    attackCooldown: 0,
    attackTargetId: null,
    facing: 0,
    ...overrides,
  }
}

export function createMockTowerEntity(
  overrides: Partial<TowerState> = {}
): TowerState {
  return {
    id: 'tower-1',
    entityType: 'tower',
    position: { x: 0, y: 0 },
    team: 'red',
    hp: 1500,
    maxHp: 1500,
    dead: false,
    radius: 24,
    stats: {
      maxHp: 1500,
      speed: 0,
      attackDamage: 80,
      attackRange: 350,
      attackSpeed: 0.8,
    },
    attackCooldown: 0,
    attackTargetId: null,
    facing: 0,
    projectileSpeed: 400,
    projectileRadius: 5,
    ...overrides,
  }
}
