import { describe, it, expect } from 'vitest'
import { computeRespawnTime } from '../respawnTimer'
import { RESPAWN_TIMES, MAX_LEVEL } from '@shared/constants'

describe('computeRespawnTime', () => {
  it('returns 0s for level 0 (instant respawn)', () => {
    expect(computeRespawnTime(0)).toBe(0)
  })

  it('returns correct time for level 1', () => {
    expect(computeRespawnTime(1)).toBe(RESPAWN_TIMES[1])
  })

  it('returns correct time for mid level', () => {
    expect(computeRespawnTime(15)).toBe(RESPAWN_TIMES[15])
  })

  it('returns correct time for MAX_LEVEL', () => {
    expect(computeRespawnTime(MAX_LEVEL)).toBe(RESPAWN_TIMES[MAX_LEVEL])
  })

  it('clamps negative level to level 0', () => {
    expect(computeRespawnTime(-5)).toBe(RESPAWN_TIMES[0])
  })

  it('clamps level above MAX_LEVEL to MAX_LEVEL', () => {
    expect(computeRespawnTime(MAX_LEVEL + 10)).toBe(RESPAWN_TIMES[MAX_LEVEL])
  })

  it('increases monotonically with level', () => {
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      expect(computeRespawnTime(lvl)).toBeGreaterThanOrEqual(computeRespawnTime(lvl - 1))
    }
  })

  it('RESPAWN_TIMES has MAX_LEVEL + 1 entries (Lv0 through Lv MAX_LEVEL)', () => {
    expect(RESPAWN_TIMES.length).toBe(MAX_LEVEL + 1)
  })
})
