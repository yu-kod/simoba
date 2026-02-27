import { MAX_LEVEL, XP_THRESHOLDS } from '@shared/constants'

export interface LevelUpResult {
  readonly newLevel: number
  readonly levelsGained: number
}

/**
 * Compute the new level based on current level and total XP.
 * Iterates through XP_THRESHOLDS to find the highest level the XP qualifies for.
 * Caps at MAX_LEVEL.
 */
export function computeLevelUp(currentLevel: number, xp: number): LevelUpResult {
  const clamped = Math.max(1, Math.min(currentLevel, MAX_LEVEL))
  let newLevel = clamped
  for (let i = clamped; i < MAX_LEVEL; i++) {
    if (xp >= XP_THRESHOLDS[i]) {
      newLevel = i + 1
    } else {
      break
    }
  }
  return {
    newLevel,
    levelsGained: newLevel - clamped,
  }
}
