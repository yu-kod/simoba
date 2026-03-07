import type { MapSchema } from '@colyseus/schema'
import type { HeroType } from '@shared/types'
import type { TalentTreeDefinition } from '@shared/talents/types'
import type { HeroSchema } from '../schema/HeroSchema.js'
import { acquireTalent } from './ServerTalentSystem.js'

/**
 * Find all acquirable talent node IDs for a hero:
 * - not already acquired
 * - all prerequisites acquired
 */
function findAcquirableNodeIds(
  hero: HeroSchema,
  treeDef: TalentTreeDefinition,
): string[] {
  const acquired = new Set<string>()
  for (let i = 0; i < hero.acquiredTalents.length; i++) {
    acquired.add(hero.acquiredTalents.at(i)!)
  }

  return treeDef.nodes
    .filter(
      (node) =>
        !acquired.has(node.id) &&
        node.cost <= hero.talentPoints &&
        node.prerequisites.every((prereq) => acquired.has(prereq)),
    )
    .map((node) => node.id)
}

/**
 * Spend all available talent points for bot heroes.
 * Picks a random acquirable node each iteration until points run out
 * or no more nodes are available.
 */
export function spendBotTalents(
  heroes: MapSchema<HeroSchema>,
  talentTrees: Partial<Record<HeroType, TalentTreeDefinition>>,
): void {
  heroes.forEach((hero) => {
    if (!hero.isBot || hero.dead || hero.talentPoints <= 0) return

    const treeDef = talentTrees[hero.heroType as HeroType]
    if (!treeDef) return

    while (hero.talentPoints > 0) {
      const candidates = findAcquirableNodeIds(hero, treeDef)
      if (candidates.length === 0) break

      const randomIndex = Math.floor(Math.random() * candidates.length)
      const talentId = candidates[randomIndex]
      acquireTalent(hero, talentId, treeDef)
    }
  })
}
