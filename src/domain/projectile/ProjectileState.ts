import type { Position, Team } from '@/domain/types'

export interface ProjectileState {
  readonly id: string
  readonly ownerId: string
  readonly ownerTeam: Team
  readonly targetId: string
  readonly position: Position
  readonly damage: number
  readonly speed: number
  readonly radius: number
}

let nextProjectileId = 0

export function createProjectile(params: {
  readonly ownerId: string
  readonly ownerTeam: Team
  readonly targetId: string
  readonly startPosition: Position
  readonly damage: number
  readonly speed: number
  readonly radius: number
}): ProjectileState {
  return {
    id: `projectile-${nextProjectileId++}`,
    ownerId: params.ownerId,
    ownerTeam: params.ownerTeam,
    targetId: params.targetId,
    position: params.startPosition,
    damage: params.damage,
    speed: params.speed,
    radius: params.radius,
  }
}
