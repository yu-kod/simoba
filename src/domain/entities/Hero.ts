import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import type { AttackerEntityState, HeroType, Position, Team } from '@/domain/types'

export interface HeroState extends AttackerEntityState {
  readonly entityType: 'hero'
  readonly type: HeroType
  readonly level: number
  readonly xp: number
  /** Seconds remaining until respawn (0 = alive or ready to respawn) */
  readonly respawnTimer: number
  /** Position where the hero died (reserved for custom respawn logic — Issue #84) */
  readonly deathPosition: Position
}

export interface CreateHeroParams {
  readonly id: string
  readonly type: HeroType
  readonly team: Team
  readonly position: Position
}

export function createHeroState(params: CreateHeroParams): HeroState {
  const definition = HERO_DEFINITIONS[params.type]
  const stats = { ...definition.base }
  return {
    id: params.id,
    entityType: 'hero',
    type: params.type,
    team: params.team,
    position: params.position,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    dead: false,
    radius: definition.radius,
    level: 1,
    xp: 0,
    stats,
    facing: 0,
    attackCooldown: 0,
    attackTargetId: null,
    respawnTimer: 0,
    deathPosition: params.position,
  }
}
