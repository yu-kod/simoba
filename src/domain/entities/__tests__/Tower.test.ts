import { describe, it, expect } from 'vitest'
import { createTowerState } from '@/domain/entities/Tower'
import { DEFAULT_TOWER } from '@/domain/entities/towerDefinitions'

describe('createTowerState', () => {
  const blueTower = createTowerState({
    id: 'tower-blue',
    team: 'blue',
    position: { x: 600, y: 360 },
    definition: DEFAULT_TOWER,
  })

  it('should set entityType to tower', () => {
    expect(blueTower.entityType).toBe('tower')
  })

  it('should set team and position from params', () => {
    expect(blueTower.team).toBe('blue')
    expect(blueTower.position).toEqual({ x: 600, y: 360 })
  })

  it('should initialize hp to maxHp from definition', () => {
    expect(blueTower.hp).toBe(DEFAULT_TOWER.stats.maxHp)
    expect(blueTower.maxHp).toBe(DEFAULT_TOWER.stats.maxHp)
  })

  it('should start alive', () => {
    expect(blueTower.dead).toBe(false)
  })

  it('should set radius from definition', () => {
    expect(blueTower.radius).toBe(DEFAULT_TOWER.radius)
  })

  it('should copy stats from definition', () => {
    expect(blueTower.stats.speed).toBe(0)
    expect(blueTower.stats.attackDamage).toBe(DEFAULT_TOWER.stats.attackDamage)
    expect(blueTower.stats.attackRange).toBe(DEFAULT_TOWER.stats.attackRange)
    expect(blueTower.stats.attackSpeed).toBe(DEFAULT_TOWER.stats.attackSpeed)
  })

  it('should set facing to 0', () => {
    expect(blueTower.facing).toBe(0)
  })

  it('should set projectile properties from definition', () => {
    expect(blueTower.projectileSpeed).toBe(DEFAULT_TOWER.projectileSpeed)
    expect(blueTower.projectileRadius).toBe(DEFAULT_TOWER.projectileRadius)
  })

  it('should start with no attack target and zero cooldown', () => {
    expect(blueTower.attackCooldown).toBe(0)
    expect(blueTower.attackTargetId).toBeNull()
  })

  it('should produce immutable state (stats copy)', () => {
    const tower1 = createTowerState({
      id: 'tower-1',
      team: 'blue',
      position: { x: 0, y: 0 },
      definition: DEFAULT_TOWER,
    })
    const tower2 = createTowerState({
      id: 'tower-2',
      team: 'red',
      position: { x: 100, y: 100 },
      definition: DEFAULT_TOWER,
    })
    expect(tower1.stats).not.toBe(tower2.stats)
    expect(tower1.stats).toEqual(tower2.stats)
  })

  it('should create red team tower correctly', () => {
    const redTower = createTowerState({
      id: 'tower-red',
      team: 'red',
      position: { x: 2600, y: 360 },
      definition: DEFAULT_TOWER,
    })
    expect(redTower.team).toBe('red')
    expect(redTower.position).toEqual({ x: 2600, y: 360 })
  })
})
