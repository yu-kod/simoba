import type { CombatEntityState } from '@/domain/types'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'
import type { DamageEvent } from '@/domain/systems/updateAttackState'
import { updateProjectile } from '@/domain/projectile/updateProjectile'
import { checkProjectileHit } from '@/domain/projectile/checkProjectileHit'

export interface UpdateProjectilesResult {
  readonly projectiles: readonly ProjectileState[]
  readonly damageEvents: readonly DamageEvent[]
}

/**
 * Update the entire projectile pool for one frame.
 *
 * For each projectile:
 * 1. If its target no longer exists (HP ≤ 0 or missing), remove it.
 * 2. Move it toward the target's current position (homing).
 * 3. Check for collision — on hit, emit a DamageEvent and remove the projectile.
 *
 * Pure function — returns new arrays, no mutation.
 */
export function updateProjectiles(
  projectiles: readonly ProjectileState[],
  targets: readonly CombatEntityState[],
  deltaTime: number,
  targetRadiusLookup: (targetId: string) => number
): UpdateProjectilesResult {
  const surviving: ProjectileState[] = []
  const damageEvents: DamageEvent[] = []

  for (const projectile of projectiles) {
    const target = targets.find((t) => t.id === projectile.targetId)

    // Target gone or dead — remove projectile silently
    if (!target || target.hp <= 0) {
      continue
    }

    // Move toward target
    const moved = updateProjectile(projectile, target.position, deltaTime)

    // Check hit
    const targetRadius = targetRadiusLookup(target.id)
    if (checkProjectileHit(moved, target.position, targetRadius)) {
      damageEvents.push({
        attackerId: projectile.ownerId,
        targetId: projectile.targetId,
        damage: projectile.damage,
      })
      continue
    }

    surviving.push(moved)
  }

  return { projectiles: surviving, damageEvents }
}
