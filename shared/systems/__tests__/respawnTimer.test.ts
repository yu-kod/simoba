import { describe, it, expect } from 'vitest'
import { computeRespawnTime } from '../respawnTimer'
import { RESPAWN_TIMES, MAX_LEVEL } from '@shared/constants'

describe('computeRespawnTime', () => {
  it('returns 0s for level 0 (instant respawn)', () => {
    expect(computeRespawnTime(0)).toBe(0)
  })

  it('returns 3s for level 1', () => {
    expect(computeRespawnTime(1)).toBe(3)
  })

  it('returns 5s for level 2', () => {
    expect(computeRespawnTime(2)).toBe(5)
  })

  it('returns 8s for level 3', () => {
    expect(computeRespawnTime(3)).toBe(8)
  })

  it('returns 12s for level 4', () => {
    expect(computeRespawnTime(4)).toBe(12)
  })

  it('returns 15s for level 5 (MAX_LEVEL)', () => {
    expect(computeRespawnTime(5)).toBe(15)
  })

  it('clamps negative level to level 0', () => {
    expect(computeRespawnTime(-5)).toBe(RESPAWN_TIMES[0])
  })

  it('clamps level above MAX_LEVEL to MAX_LEVEL', () => {
    expect(computeRespawnTime(10)).toBe(RESPAWN_TIMES[MAX_LEVEL])
  })

  it('increases monotonically with level', () => {
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      expect(computeRespawnTime(lvl)).toBeGreaterThan(computeRespawnTime(lvl - 1))
    }
  })
})
