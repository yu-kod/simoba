import { describe, it, expect } from 'vitest'
import { selectMinionTarget } from '@/domain/systems/minionTargeting'
import { createMinionState, MELEE_MINION } from '@shared/entities/Minion'
import { createMockCombatEntity } from '@/test/helpers/entityHelpers'

function createTestMinion() {
  return createMinionState({
    id: 'minion-attacker',
    minionType: 'melee',
    team: 'blue',
    position: { x: 500, y: 360 },
  })
}

describe('selectMinionTarget', () => {
  it('selects minion over tower (higher priority)', () => {
    const attacker = createTestMinion()
    const range = MELEE_MINION.stats.attackRange

    const enemyMinion = createMockCombatEntity({
      id: 'enemy-minion',
      entityType: 'minion',
      team: 'red',
      position: { x: 500 + range * 0.8, y: 360 },
      radius: 12,
    })
    const enemyTower = createMockCombatEntity({
      id: 'enemy-tower',
      entityType: 'tower',
      team: 'red',
      position: { x: 500 + range * 0.6, y: 360 },
      radius: 30,
    })

    const target = selectMinionTarget(attacker, [enemyTower, enemyMinion])
    expect(target?.id).toBe('enemy-minion')
  })

  it('selects tower over hero (higher priority)', () => {
    const attacker = createTestMinion()
    const range = MELEE_MINION.stats.attackRange

    const enemyTower = createMockCombatEntity({
      id: 'enemy-tower',
      entityType: 'tower',
      team: 'red',
      position: { x: 500 + range * 0.8, y: 360 },
      radius: 30,
    })
    const enemyHero = createMockCombatEntity({
      id: 'enemy-hero',
      entityType: 'hero',
      team: 'red',
      position: { x: 500 + range * 0.5, y: 360 },
      radius: 22,
    })

    const target = selectMinionTarget(attacker, [enemyHero, enemyTower])
    expect(target?.id).toBe('enemy-tower')
  })

  it('selects closest within same priority category', () => {
    const attacker = createTestMinion()
    const range = MELEE_MINION.stats.attackRange

    const farMinion = createMockCombatEntity({
      id: 'far-minion',
      entityType: 'minion',
      team: 'red',
      position: { x: 500 + range * 0.8, y: 360 },
      radius: 12,
    })
    const closeMinion = createMockCombatEntity({
      id: 'close-minion',
      entityType: 'minion',
      team: 'red',
      position: { x: 500 + range * 0.5, y: 360 },
      radius: 12,
    })

    const target = selectMinionTarget(attacker, [farMinion, closeMinion])
    expect(target?.id).toBe('close-minion')
  })

  it('excludes dead entities', () => {
    const attacker = createTestMinion()
    const range = MELEE_MINION.stats.attackRange

    const deadMinion = createMockCombatEntity({
      id: 'dead-minion',
      entityType: 'minion',
      team: 'red',
      dead: true,
      position: { x: 500 + range * 0.5, y: 360 },
      radius: 12,
    })

    const target = selectMinionTarget(attacker, [deadMinion])
    expect(target).toBeNull()
  })

  it('returns null when no enemy in range', () => {
    const attacker = createTestMinion()

    const farEnemy = createMockCombatEntity({
      id: 'far-enemy',
      entityType: 'minion',
      team: 'red',
      position: { x: 2000, y: 360 },
      radius: 12,
    })

    const target = selectMinionTarget(attacker, [farEnemy])
    expect(target).toBeNull()
  })

  it('returns null for empty enemies list', () => {
    const attacker = createTestMinion()
    const target = selectMinionTarget(attacker, [])
    expect(target).toBeNull()
  })

  it('falls back to hero when no minion or tower in range', () => {
    const attacker = createTestMinion()
    const range = MELEE_MINION.stats.attackRange

    const enemyHero = createMockCombatEntity({
      id: 'enemy-hero',
      entityType: 'hero',
      team: 'red',
      position: { x: 500 + range * 0.5, y: 360 },
      radius: 22,
    })

    const target = selectMinionTarget(attacker, [enemyHero])
    expect(target?.id).toBe('enemy-hero')
  })
})
