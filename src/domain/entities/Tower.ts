import type { TowerDefinition } from '@/domain/entities/towerDefinitions'
import type { AttackerEntityState, Position, Team } from '@/domain/types'

export interface TowerState extends AttackerEntityState {
  readonly entityType: 'tower'
}

interface CreateTowerParams {
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
  }
}
