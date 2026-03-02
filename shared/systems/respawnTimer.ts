import { MAX_LEVEL, RESPAWN_TIMES } from '@shared/constants'

/**
 * Compute respawn time in seconds based on hero level.
 * Clamps level to [1, MAX_LEVEL] range.
 */
export function computeRespawnTime(level: number): number {
  const clamped = Math.max(1, Math.min(level, MAX_LEVEL))
  return RESPAWN_TIMES[clamped]
}
