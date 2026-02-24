import { describe, it, expect } from 'vitest'
import {
  createMinionState,
  MELEE_MINION,
  RANGED_MINION,
} from '@shared/entities/Minion'
import { isMinion, isHero, isTower } from '@/domain/entities/typeGuards'
import { getWaveConfig } from '@shared/constants'

describe('createMinionState', () => {
  const blueMelee = createMinionState({
    id: 'minion-1',
    minionType: 'melee',
    team: 'blue',
    position: { x: 150, y: 360 },
  })

  const redRanged = createMinionState({
    id: 'minion-2',
    minionType: 'ranged',
    team: 'red',
    position: { x: 3080, y: 360 },
  })

  it('should set entityType to minion', () => {
    expect(blueMelee.entityType).toBe('minion')
    expect(redRanged.entityType).toBe('minion')
  })

  it('should set minionType correctly', () => {
    expect(blueMelee.minionType).toBe('melee')
    expect(redRanged.minionType).toBe('ranged')
  })

  it('should set team and position from params', () => {
    expect(blueMelee.team).toBe('blue')
    expect(blueMelee.position).toEqual({ x: 150, y: 360 })
    expect(redRanged.team).toBe('red')
    expect(redRanged.position).toEqual({ x: 3080, y: 360 })
  })

  it('should initialize hp to maxHp from definition', () => {
    expect(blueMelee.hp).toBe(MELEE_MINION.stats.maxHp)
    expect(blueMelee.maxHp).toBe(MELEE_MINION.stats.maxHp)
    expect(redRanged.hp).toBe(RANGED_MINION.stats.maxHp)
  })

  it('should start alive', () => {
    expect(blueMelee.dead).toBe(false)
  })

  it('should set radius from definition', () => {
    expect(blueMelee.radius).toBe(MELEE_MINION.radius)
    expect(redRanged.radius).toBe(RANGED_MINION.radius)
  })

  it('should set melee projectileSpeed to 0', () => {
    expect(blueMelee.projectileSpeed).toBe(0)
    expect(blueMelee.projectileRadius).toBe(0)
  })

  it('should set ranged projectileSpeed > 0', () => {
    expect(redRanged.projectileSpeed).toBeGreaterThan(0)
    expect(redRanged.projectileRadius).toBeGreaterThan(0)
  })

  it('should set facing based on team', () => {
    expect(blueMelee.facing).toBe(0)
    expect(redRanged.facing).toBe(Math.PI)
  })

  it('should start with no attack target and zero cooldown', () => {
    expect(blueMelee.attackCooldown).toBe(0)
    expect(blueMelee.attackTargetId).toBeNull()
  })

  it('should have melee maxHp greater than ranged maxHp', () => {
    expect(MELEE_MINION.stats.maxHp).toBeGreaterThan(RANGED_MINION.stats.maxHp)
  })

  it('should apply statMultiplier', () => {
    const buffed = createMinionState({
      id: 'buffed-1',
      minionType: 'melee',
      team: 'blue',
      position: { x: 150, y: 360 },
      statMultiplier: 1.5,
    })
    expect(buffed.hp).toBe(Math.round(MELEE_MINION.stats.maxHp * 1.5))
    expect(buffed.stats.attackDamage).toBe(
      Math.round(MELEE_MINION.stats.attackDamage * 1.5),
    )
    expect(buffed.stats.speed).toBe(MELEE_MINION.stats.speed)
  })
})

describe('isMinion', () => {
  const minion = createMinionState({
    id: 'minion-1',
    minionType: 'melee',
    team: 'blue',
    position: { x: 0, y: 0 },
  })

  it('should return true for minion entity', () => {
    expect(isMinion(minion)).toBe(true)
  })

  it('should return false for non-minion entities', () => {
    expect(isHero(minion)).toBe(false)
    expect(isTower(minion)).toBe(false)
  })
})

describe('getWaveConfig', () => {
  it('should return default config at matchTime 0', () => {
    const config = getWaveConfig(0)
    expect(config.interval).toBe(30)
    expect(config.meleeCount).toBe(3)
    expect(config.rangedCount).toBe(1)
    expect(config.statMultiplier).toBe(1.0)
  })

  it('should return same config at matchTime 180 (buff not implemented)', () => {
    const config = getWaveConfig(180)
    expect(config.statMultiplier).toBe(1.0)
  })
})
