import { describe, it, expect } from 'vitest'
import { computeLevelUp } from '../levelUp'
import { MAX_LEVEL, XP_THRESHOLDS } from '@shared/constants'

describe('computeLevelUp', () => {
  it('returns no change when XP is below first threshold', () => {
    const result = computeLevelUp(0, 20)
    expect(result).toEqual({ newLevel: 0, levelsGained: 0 })
  })

  it('levels up from level 0 to level 1 at 50 XP', () => {
    const result = computeLevelUp(0, 50)
    expect(result).toEqual({ newLevel: 1, levelsGained: 1 })
  })

  it('levels up at exact threshold (Lv1 → Lv2 at 150 XP)', () => {
    const result = computeLevelUp(1, 150)
    expect(result).toEqual({ newLevel: 2, levelsGained: 1 })
  })

  it('levels up at exact threshold (Lv2 → Lv3 at 350 XP)', () => {
    const result = computeLevelUp(2, 350)
    expect(result).toEqual({ newLevel: 3, levelsGained: 1 })
  })

  it('handles multi-level jump (Lv0 → Lv4)', () => {
    // XP_THRESHOLDS = [50, 150, 350, 650, 1050]
    // 700 XP >= threshold[3]=650, so level 4
    const result = computeLevelUp(0, 700)
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
    const result = computeLevelUp(0, XP_THRESHOLDS[MAX_LEVEL - 1])
    expect(result).toEqual({ newLevel: MAX_LEVEL, levelsGained: MAX_LEVEL })
  })

  it('returns no change for 0 XP at level 0', () => {
    const result = computeLevelUp(0, 0)
    expect(result).toEqual({ newLevel: 0, levelsGained: 0 })
  })
})
