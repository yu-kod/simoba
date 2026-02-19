import type { CombatEntityState, AttackerEntityState } from '@/domain/types'
import type { TowerState } from '@/domain/entities/Tower'

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
