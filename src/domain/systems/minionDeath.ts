import type { MinionState } from '@shared/entities/Minion'
import type { HeroState } from '@shared/entities/Hero'
import { distributeMinionXp, type XpUpdate } from '@/domain/systems/minionXpDistribution'

export interface MinionDeathResult {
  readonly xpUpdates: readonly XpUpdate[]
  readonly deadMinionIds: readonly string[]
}

export function processMinionDeaths(
  minions: readonly MinionState[],
  heroes: readonly HeroState[],
): MinionDeathResult {
  const xpUpdates: XpUpdate[] = []
  const deadMinionIds: string[] = []

  for (const minion of minions) {
    if (!minion.dead) continue

    deadMinionIds.push(minion.id)

    const updates = distributeMinionXp(minion.position, minion.team, heroes)
    for (const update of updates) {
      xpUpdates.push(update)
    }
  }

  return { xpUpdates, deadMinionIds }
}
