import type { Position } from '@/domain/types'

/**
 * Check whether the attacker is within attack range of the target.
 * Effective distance = center-to-center distance - attacker radius - target radius.
 * Attack is possible when effective distance <= attackRange.
 */
export function isInAttackRange(
  attackerPos: Position,
  targetPos: Position,
  attackerRadius: number,
  targetRadius: number,
  attackRange: number
): boolean {
  const dx = targetPos.x - attackerPos.x
  const dy = targetPos.y - attackerPos.y
  const centerDist = Math.sqrt(dx * dx + dy * dy)
  const effectiveDist = centerDist - attackerRadius - targetRadius
  return effectiveDist <= attackRange
}
