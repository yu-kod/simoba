import type { AttackerEntityState, Position, StatBlock, Team } from '@shared/types'

/** Fixed per-type definition for tower entities (never changes during a match) */
export interface TowerDefinition {
  readonly stats: StatBlock
  readonly radius: number
  /** Projectile travel speed in px/sec. */
  readonly projectileSpeed: number
  /** Projectile collision/draw radius in px. */
  readonly projectileRadius: number
}

export const DEFAULT_TOWER: TowerDefinition = {
  stats: {
    maxHp: 1500,
    speed: 0,
    attackDamage: 80,
    attackRange: 350,
    attackSpeed: 0.8,
  },
  radius: 24,
  projectileSpeed: 400,
  projectileRadius: 5,
}

export interface TowerState extends AttackerEntityState {
  readonly entityType: 'tower'
  readonly projectileSpeed: number
  readonly projectileRadius: number
}

export interface CreateTowerParams {
  readonly id: string
  readonly team: Team
  readonly position: Position
  readonly definition: TowerDefinition
}

export function createTowerState(params: CreateTowerParams): TowerState {
  const { id, team, position, definition } = params
  return {
    id,
    entityType: 'tower',
    team,
    position,
    hp: definition.stats.maxHp,
    maxHp: definition.stats.maxHp,
    dead: false,
    radius: definition.radius,
    stats: { ...definition.stats },
    facing: 0,
    attackCooldown: 0,
    attackTargetId: null,
    projectileSpeed: definition.projectileSpeed,
    projectileRadius: definition.projectileRadius,
  }
}
