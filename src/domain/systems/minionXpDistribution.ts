import type { HeroState } from '@shared/entities/Hero'
import type { Position, Team } from '@/domain/types'
import { MINION_XP_REWARD, XP_GRANT_RANGE } from '@shared/constants'
import { grantXp } from '@/domain/systems/grantXp'

function distanceSq(a: Position, b: Position): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

export interface XpUpdate {
  readonly heroId: string
  readonly xpGained: number
}

export function distributeMinionXp(
  deathPosition: Position,
  minionTeam: Team,
  heroes: readonly HeroState[],
): readonly XpUpdate[] {
  const rangeSq = XP_GRANT_RANGE * XP_GRANT_RANGE
  const allyTeam = minionTeam === 'blue' ? 'red' : 'blue'

  const eligibleHeroes = heroes.filter(
    (h) => !h.dead && h.team === allyTeam && distanceSq(h.position, deathPosition) <= rangeSq,
  )

  if (eligibleHeroes.length === 0) return []

  const xpPerHero = Math.floor(MINION_XP_REWARD / eligibleHeroes.length)

  return eligibleHeroes.map((h) => ({
    heroId: h.id,
    xpGained: xpPerHero,
  }))
}

export function applyXpUpdates(
  heroes: readonly HeroState[],
  updates: readonly XpUpdate[],
): readonly HeroState[] {
  const updateMap = new Map(updates.map((u) => [u.heroId, u.xpGained]))

  return heroes.map((hero) => {
    const xp = updateMap.get(hero.id)
    if (xp === undefined) return hero
    return grantXp(hero, xp)
  })
}
