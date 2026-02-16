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

export function createProjectile(params: {
  readonly id: string
  readonly ownerId: string
  readonly ownerTeam: Team
  readonly targetId: string
  readonly startPosition: Position
  readonly damage: number
  readonly speed: number
  readonly radius: number
}): ProjectileState {
  return {
    id: params.id,
    ownerId: params.ownerId,
    ownerTeam: params.ownerTeam,
    targetId: params.targetId,
    position: params.startPosition,
    damage: params.damage,
    speed: params.speed,
    radius: params.radius,
  }
}
