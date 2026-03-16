import type { MapSchema } from '@colyseus/schema'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'

interface ProjectileSource {
  readonly x: number
  readonly y: number
  readonly team: string
}

interface ProjectileTarget {
  readonly id: string
  readonly x: number
  readonly y: number
}

/**
 * Create a homing projectile from source toward target.
 * Shared by hero combat, minion combat, and tower combat.
 */
export function createHomingProjectile(
  ProjectileSchemaClass: new () => ProjectileSchema,
  id: string,
  source: ProjectileSource,
  target: ProjectileTarget,
  speed: number,
  damage: number,
  ownerId: string,
  projectiles: MapSchema<ProjectileSchema>,
): void {
  const proj = new ProjectileSchemaClass()
  proj.id = id
  proj.x = source.x
  proj.y = source.y
  proj.targetX = target.x
  proj.targetY = target.y
  proj.targetId = target.id
  proj.speed = speed
  proj.damage = damage
  proj.ownerId = ownerId
  proj.team = source.team
  projectiles.set(proj.id, proj)
}
