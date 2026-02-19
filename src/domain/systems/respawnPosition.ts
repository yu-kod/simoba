import type { HeroState } from '@/domain/entities/Hero'
import type { Position } from '@/domain/types'
import { MAP_LAYOUT } from '@/domain/mapLayout'

export type RespawnPositionResolver = (hero: HeroState) => Position

export const baseRespawn: RespawnPositionResolver = (hero) => {
  const teamKey = hero.team as 'blue' | 'red'
  const base = MAP_LAYOUT.bases[teamKey]
  return { x: base.x + base.width / 2, y: base.y + base.height / 2 }
}
