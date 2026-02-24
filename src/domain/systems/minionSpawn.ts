import { createMinionState, type MinionState } from '@shared/entities/Minion'
import type { MinionWaveConfig } from '@shared/constants'
import type { Team } from '@/domain/types'

const BLUE_MELEE_X = 150
const BLUE_RANGED_X = 120
const RED_MELEE_X = 3050
const RED_RANGED_X = 3080
const MELEE_Y_OFFSETS = [340, 360, 380] as const
const RANGED_Y = 360

let _waveCounter = 0

export function spawnWave(
  team: Team,
  _matchTime: number,
  waveConfig: MinionWaveConfig,
): readonly MinionState[] {
  const minions: MinionState[] = []
  const meleeX = team === 'blue' ? BLUE_MELEE_X : RED_MELEE_X
  const rangedX = team === 'blue' ? BLUE_RANGED_X : RED_RANGED_X
  const waveId = _waveCounter++

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
