import type { Position } from '@/domain/types'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'

/**
 * Move a projectile toward the target's current position (homing).
 * Pure function — returns a new ProjectileState with updated position.
 */
export function updateProjectile(
  projectile: ProjectileState,
  targetPosition: Position,
  deltaTime: number
): ProjectileState {
  const dx = targetPosition.x - projectile.position.x
  const dy = targetPosition.y - projectile.position.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) return projectile

  const moveDistance = projectile.speed * deltaTime
  const nx = dx / distance
  const ny = dy / distance

  return {
    ...projectile,
    position: {
      x: projectile.position.x + nx * moveDistance,
      y: projectile.position.y + ny * moveDistance,
    },
  }
}
