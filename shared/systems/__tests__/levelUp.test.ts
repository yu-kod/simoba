import { describe, it, expect } from 'vitest'
import { computeLevelUp } from '../levelUp'
import { MAX_LEVEL, XP_THRESHOLDS } from '@shared/constants'

describe('computeLevelUp', () => {
  it('returns no change when XP is below first threshold', () => {
    const result = computeLevelUp(0, XP_THRESHOLDS[0] - 1)
    expect(result).toEqual({ newLevel: 0, levelsGained: 0 })
  })

  it('levels up from level 0 to level 1 at first threshold', () => {
    const result = computeLevelUp(0, XP_THRESHOLDS[0])
    expect(result).toEqual({ newLevel: 1, levelsGained: 1 })
  })

  it('levels up at exact threshold (Lv1 → Lv2)', () => {
    const result = computeLevelUp(1, XP_THRESHOLDS[1])
    expect(result).toEqual({ newLevel: 2, levelsGained: 1 })
  })

  it('levels up at exact threshold (Lv2 → Lv3)', () => {
    const result = computeLevelUp(2, XP_THRESHOLDS[2])
    expect(result).toEqual({ newLevel: 3, levelsGained: 1 })
  })

  it('handles multi-level jump (Lv0 → Lv4)', () => {
    // XP above threshold[3] but below threshold[4]
    const xp = XP_THRESHOLDS[3] + 1
    const result = computeLevelUp(0, xp)
    expect(result).toEqual({ newLevel: 4, levelsGained: 4 })
  })

  it('caps at MAX_LEVEL', () => {
    const result = computeLevelUp(0, 99999)
    expect(result).toEqual({ newLevel: MAX_LEVEL, levelsGained: MAX_LEVEL })
  })

  it('returns no change when already at MAX_LEVEL', () => {
    const result = computeLevelUp(MAX_LEVEL, 99999)
    expect(result).toEqual({ newLevel: MAX_LEVEL, levelsGained: 0 })
  })

  it('does not level up when XP is 1 below threshold', () => {
    const result = computeLevelUp(0, XP_THRESHOLDS[0] - 1)
    expect(result).toEqual({ newLevel: 0, levelsGained: 0 })
  })

  it('handles XP exactly at MAX_LEVEL threshold', () => {
    const result = computeLevelUp(0, XP_THRESHOLDS[MAX_LEVEL - 1]!)
    expect(result).toEqual({ newLevel: MAX_LEVEL, levelsGained: MAX_LEVEL })
  })

  it('returns no change for 0 XP at level 0', () => {
    const result = computeLevelUp(0, 0)
    expect(result).toEqual({ newLevel: 0, levelsGained: 0 })
  })

  it('XP_THRESHOLDS has exactly MAX_LEVEL entries', () => {
    expect(XP_THRESHOLDS.length).toBe(MAX_LEVEL)
  })

  it('XP_THRESHOLDS is monotonically increasing', () => {
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      expect(XP_THRESHOLDS[i]!).toBeGreaterThan(XP_THRESHOLDS[i - 1]!)
    }
  })

  it('levels up correctly at mid-range (Lv10 → Lv11)', () => {
    const result = computeLevelUp(10, XP_THRESHOLDS[10])
    expect(result).toEqual({ newLevel: 11, levelsGained: 1 })
  })

  it('does not level up at Lv29 with XP just below Lv30 threshold', () => {
    const result = computeLevelUp(29, XP_THRESHOLDS[29] - 1)
    expect(result).toEqual({ newLevel: 29, levelsGained: 0 })
  })

  it('levels up to MAX_LEVEL (30) at exact threshold', () => {
    const result = computeLevelUp(29, XP_THRESHOLDS[29])
    expect(result).toEqual({ newLevel: 30, levelsGained: 1 })
  })
})
