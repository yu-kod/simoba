import type { EntityState, HeroType, Position, Team } from '@/domain/types'

export interface HeroState extends EntityState {
  readonly type: HeroType
  readonly hp: number
  readonly maxHp: number
  readonly level: number
  readonly xp: number
}

interface CreateHeroParams {
  readonly id: string
  readonly type: HeroType
  readonly team: Team
  readonly position: Position
}

const BASE_HP: Record<HeroType, number> = {
  BLADE: 600,
  BOLT: 400,
  AURA: 450,
}

export function createHeroState(params: CreateHeroParams): HeroState {
  const maxHp = BASE_HP[params.type]
  return {
    id: params.id,
    type: params.type,
    team: params.team,
    position: params.position,
    hp: maxHp,
    maxHp,
    level: 1,
    xp: 0,
  }
}
