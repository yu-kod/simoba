import { describe, it, expect } from 'vitest'
import { computeLevelUp } from '../levelUp'
import { MAX_LEVEL, XP_THRESHOLDS } from '@shared/constants'

describe('computeLevelUp', () => {
  it('returns no change when XP is below threshold', () => {
    const result = computeLevelUp(1, 50)
    expect(result).toEqual({ newLevel: 1, levelsGained: 0 })
  })

  it('levels up at exact threshold (Lv1 → Lv2 at 100 XP)', () => {
    const result = computeLevelUp(1, 100)
    expect(result).toEqual({ newLevel: 2, levelsGained: 1 })
  })

  it('levels up at exact threshold (Lv2 → Lv3 at 300 XP)', () => {
    const result = computeLevelUp(2, 300)
    expect(result).toEqual({ newLevel: 3, levelsGained: 1 })
  })

  it('handles multi-level jump (Lv1 → Lv4)', () => {
    // XP_THRESHOLDS = [0, 100, 300, 600, 1000]
    // 700 XP >= threshold[3]=600, so level 4
    const result = computeLevelUp(1, 700)
    expect(result).toEqual({ newLevel: 4, levelsGained: 3 })
  })

  it('caps at MAX_LEVEL', () => {
    const result = computeLevelUp(1, 99999)
    expect(result).toEqual({ newLevel: MAX_LEVEL, levelsGained: MAX_LEVEL - 1 })
  })

  it('returns no change when already at MAX_LEVEL', () => {
    const result = computeLevelUp(MAX_LEVEL, 99999)
    expect(result).toEqual({ newLevel: MAX_LEVEL, levelsGained: 0 })
  })

  it('does not level up when XP is 1 below threshold', () => {
    const result = computeLevelUp(1, XP_THRESHOLDS[1] - 1)
    expect(result).toEqual({ newLevel: 1, levelsGained: 0 })
  })

  it('handles XP exactly at MAX_LEVEL threshold', () => {
    const result = computeLevelUp(1, XP_THRESHOLDS[MAX_LEVEL - 1])
    expect(result).toEqual({ newLevel: MAX_LEVEL, levelsGained: MAX_LEVEL - 1 })
  })

  it('returns no change for 0 XP at level 1', () => {
    const result = computeLevelUp(1, 0)
    expect(result).toEqual({ newLevel: 1, levelsGained: 0 })
  })
})
