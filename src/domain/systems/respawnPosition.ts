import type { HeroState } from '@/domain/entities/Hero'
import type { Position } from '@/domain/types'
import { MAP_LAYOUT } from '@/domain/mapLayout'

export type RespawnPositionResolver = (hero: HeroState) => Position

export const baseRespawn: RespawnPositionResolver = (hero) => {
  const { team } = hero
  if (team !== 'blue' && team !== 'red') {
    throw new Error(`No base defined for team: ${team}`)
  }
  const base = MAP_LAYOUT.bases[team]
  return { x: base.x + base.width / 2, y: base.y + base.height / 2 }
}
