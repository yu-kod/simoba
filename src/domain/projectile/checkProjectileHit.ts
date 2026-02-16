import type { Position } from '@/domain/types'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'

/**
 * Check whether a projectile has hit its target.
 * Hit occurs when distance between centres ≤ targetRadius + projectileRadius.
 * Pure function — no side effects.
 */
export function checkProjectileHit(
  projectile: ProjectileState,
  targetPosition: Position,
  targetRadius: number
): boolean {
  const dx = targetPosition.x - projectile.position.x
  const dy = targetPosition.y - projectile.position.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  return distance <= targetRadius + projectile.radius
}
