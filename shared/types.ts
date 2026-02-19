import type { StatBlock } from '@/domain/entities/StatBlock'

export interface Position {
  readonly x: number
  readonly y: number
}

export type Team = 'blue' | 'red' | 'neutral'

export type HeroType = 'BLADE' | 'BOLT' | 'AURA'

export type EntityType = 'hero' | 'tower' | 'minion' | 'boss' | 'structure'

export interface EntityState {
  readonly id: string
  readonly position: Position
  readonly team: Team
}

/** Common state for all HP-bearing entities (hero, minion, structure, boss) */
export interface CombatEntityState extends EntityState {
  readonly entityType: EntityType
  readonly hp: number
  readonly maxHp: number
  readonly dead: boolean
  readonly radius: number
}

/** Common state for entities that can perform attacks (hero, tower, minion, boss) */
export interface AttackerEntityState extends CombatEntityState {
  readonly stats: StatBlock
  readonly attackCooldown: number
  readonly attackTargetId: string | null
  readonly facing: number
}
