import { describe, it, expect } from 'vitest'
import { selectTowerTarget } from '@/domain/systems/towerTargeting'
import { createTowerState, type TowerState } from '@/domain/entities/Tower'
import { DEFAULT_TOWER } from '@/domain/entities/towerDefinitions'
import type { CombatEntityState } from '@/domain/types'

function makeTower(overrides: Partial<TowerState> = {}): TowerState {
  return {
    ...createTowerState({
      id: 'tower-blue',
      team: 'blue',
      position: { x: 600, y: 360 },
      definition: DEFAULT_TOWER,
    }),
    ...overrides,
  }
}

function makeEnemy(overrides: Partial<CombatEntityState> = {}): CombatEntityState {
  return {
    id: 'enemy-1',
    entityType: 'hero',
    team: 'red',
    position: { x: 800, y: 360 },
    hp: 500,
    maxHp: 500,
    dead: false,
    radius: 20,
    ...overrides,
  }
}

describe('selectTowerTarget', () => {
  it('should select an enemy within attack range', () => {
    const tower = makeTower()
    // distance: 200, effective: 200 - 24 - 20 = 156, range: 350
    const enemy = makeEnemy({ position: { x: 800, y: 360 } })

    const target = selectTowerTarget(tower, [enemy])
    expect(target).toBe(enemy)
  })

  it('should return null when no enemies are in range', () => {
    const tower = makeTower()
    // distance: 1000, effective: 1000 - 24 - 20 = 956, range: 350
    const enemy = makeEnemy({ position: { x: 1600, y: 360 } })

    const target = selectTowerTarget(tower, [enemy])
    expect(target).toBeNull()
  })

  it('should select the nearest enemy when multiple are in range', () => {
    const tower = makeTower()
    const nearEnemy = makeEnemy({ id: 'near', position: { x: 700, y: 360 } })
    const farEnemy = makeEnemy({ id: 'far', position: { x: 900, y: 360 } })

    const target = selectTowerTarget(tower, [farEnemy, nearEnemy])
    expect(target?.id).toBe('near')
  })

  it('should exclude dead enemies', () => {
    const tower = makeTower()
    const deadEnemy = makeEnemy({ id: 'dead', position: { x: 700, y: 360 }, dead: true, hp: 0 })
    const aliveEnemy = makeEnemy({ id: 'alive', position: { x: 800, y: 360 } })

    const target = selectTowerTarget(tower, [deadEnemy, aliveEnemy])
    expect(target?.id).toBe('alive')
  })

  it('should return null when all enemies are dead', () => {
    const tower = makeTower()
    const deadEnemy = makeEnemy({ dead: true, hp: 0 })

    const target = selectTowerTarget(tower, [deadEnemy])
    expect(target).toBeNull()
  })

  it('should return null when enemies list is empty', () => {
    const tower = makeTower()

    const target = selectTowerTarget(tower, [])
    expect(target).toBeNull()
  })

  it('should account for both tower and enemy radius in range check', () => {
    const tower = makeTower()
    // tower radius: 24, enemy radius: 20, range: 350
    // max center-to-center distance for attack: 350 + 24 + 20 = 394
    const justInRange = makeEnemy({ id: 'in', position: { x: 600 + 394, y: 360 } })
    const justOutOfRange = makeEnemy({ id: 'out', position: { x: 600 + 395, y: 360 } })

    expect(selectTowerTarget(tower, [justInRange])).toBe(justInRange)
    expect(selectTowerTarget(tower, [justOutOfRange])).toBeNull()
  })
})
