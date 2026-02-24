import type { AttackerEntityState, Position, StatBlock, Team } from '@shared/types'

export type MinionType = 'melee' | 'ranged'

/** Fixed per-type definition for minion entities (never changes during a match) */
export interface MinionDefinition {
  readonly stats: StatBlock
  readonly radius: number
  /** Projectile travel speed in px/sec. 0 = melee (instant damage). */
  readonly projectileSpeed: number
  /** Projectile collision/draw radius in px. 0 for melee minions. */
  readonly projectileRadius: number
}

export const MELEE_MINION: MinionDefinition = {
  stats: {
    maxHp: 120,
    speed: 80,
    attackDamage: 14,
    attackRange: 50,
    attackSpeed: 0.75,
  },
  radius: 12,
  projectileSpeed: 0,
  projectileRadius: 0,
}

export const RANGED_MINION: MinionDefinition = {
  stats: {
    maxHp: 70,
    speed: 80,
    attackDamage: 20,
    attackRange: 200,
    attackSpeed: 0.6,
  },
  radius: 10,
  projectileSpeed: 350,
  projectileRadius: 4,
}

export interface MinionState extends AttackerEntityState {
  readonly entityType: 'minion'
  readonly minionType: MinionType
  readonly projectileSpeed: number
  readonly projectileRadius: number
}

export interface CreateMinionParams {
  readonly id: string
  readonly minionType: MinionType
  readonly team: Team
  readonly position: Position
  readonly statMultiplier?: number
}

export function createMinionState(params: CreateMinionParams): MinionState {
  const definition = params.minionType === 'melee' ? MELEE_MINION : RANGED_MINION
  const multiplier = params.statMultiplier ?? 1.0
  const scaledStats: StatBlock = {
    maxHp: Math.round(definition.stats.maxHp * multiplier),
    speed: definition.stats.speed,
    attackDamage: Math.round(definition.stats.attackDamage * multiplier),
    attackRange: definition.stats.attackRange,
    attackSpeed: definition.stats.attackSpeed,
  }
  return {
    id: params.id,
    entityType: 'minion',
    minionType: params.minionType,
    team: params.team,
    position: params.position,
    hp: scaledStats.maxHp,
    maxHp: scaledStats.maxHp,
    dead: false,
    radius: definition.radius,
    stats: scaledStats,
    facing: params.team === 'blue' ? 0 : Math.PI,
    attackCooldown: 0,
    attackTargetId: null,
    projectileSpeed: definition.projectileSpeed,
    projectileRadius: definition.projectileRadius,
  }
}
