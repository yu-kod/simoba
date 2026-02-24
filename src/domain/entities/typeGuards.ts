import type { CombatEntityState } from '@/domain/types'
import type { HeroState } from '@/domain/entities/Hero'
import type { TowerState } from '@/domain/entities/Tower'
import type { MinionState } from '@shared/entities/Minion'

export function isHero(entity: CombatEntityState): entity is HeroState {
  return entity.entityType === 'hero'
}

export function isTower(entity: CombatEntityState): entity is TowerState {
  return entity.entityType === 'tower'
}

export function isMinion(entity: CombatEntityState): entity is MinionState {
  return entity.entityType === 'minion'
}
