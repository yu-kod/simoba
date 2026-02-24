import { createMinionState, type MinionState } from '@shared/entities/Minion'
import {
  BLUE_MELEE_X,
  BLUE_RANGED_X,
  RED_MELEE_X,
  RED_RANGED_X,
  MELEE_Y_OFFSETS,
  RANGED_Y,
  type MinionWaveConfig,
} from '@shared/constants'
import type { Team } from '@/domain/types'

export interface MinionSpawnContext {
  waveCounter: number
}

export function createMinionSpawnContext(): MinionSpawnContext {
  return { waveCounter: 0 }
}

export function spawnWave(
  ctx: MinionSpawnContext,
  team: Team,
  _matchTime: number,
  waveConfig: MinionWaveConfig,
): readonly MinionState[] {
  const minions: MinionState[] = []
  const meleeX = team === 'blue' ? BLUE_MELEE_X : RED_MELEE_X
  const rangedX = team === 'blue' ? BLUE_RANGED_X : RED_RANGED_X
  const waveId = ctx.waveCounter++

  for (let i = 0; i < waveConfig.meleeCount; i++) {
    const y = MELEE_Y_OFFSETS[i] ?? 360
    minions.push(
      createMinionState({
        id: `minion-${team}-${waveId}-melee-${i}`,
        minionType: 'melee',
        team,
        position: { x: meleeX, y },
        statMultiplier: waveConfig.statMultiplier,
      }),
    )
  }

  for (let i = 0; i < waveConfig.rangedCount; i++) {
    minions.push(
      createMinionState({
        id: `minion-${team}-${waveId}-ranged-${i}`,
        minionType: 'ranged',
        team,
        position: { x: rangedX, y: RANGED_Y },
        statMultiplier: waveConfig.statMultiplier,
      }),
    )
  }

  return minions
}
