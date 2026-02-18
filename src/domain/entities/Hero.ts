import type { StatBlock } from '@/domain/entities/StatBlock'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import type { CombatEntityState, HeroType, Position, Team } from '@/domain/types'

export interface HeroState extends CombatEntityState {
  readonly type: HeroType
  readonly level: number
  readonly xp: number
  /** Effective stats — may change during a match via buffs / level-ups */
  readonly stats: StatBlock
  /** Facing direction in radians (0 = right) */
  readonly facing: number
  /** Seconds remaining until next attack (0 or below = ready) */
  readonly attackCooldown: number
  /** Entity ID of the current attack target, or null if not attacking */
  readonly attackTargetId: string | null
  /** Whether the hero is currently dead */
  readonly dead: boolean
  /** Seconds remaining until respawn (0 = alive or ready to respawn) */
  readonly respawnTimer: number
  /** Position where the hero died (reserved for custom respawn logic — Issue #84) */
  readonly deathPosition: Position
}

interface CreateHeroParams {
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
    type: params.type,
    team: params.team,
    position: params.position,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    level: 1,
    xp: 0,
    stats,
    facing: 0,
    attackCooldown: 0,
    attackTargetId: null,
    dead: false,
    respawnTimer: 0,
    deathPosition: params.position,
  }
}
