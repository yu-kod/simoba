import type { MapSchema } from '@colyseus/schema'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { GameRoomState } from '../schema/GameRoomState.js'

/**
 * Check if any tower has been destroyed and end the match if so.
 * Pure function operating on state — no Room dependency.
 */
export function checkTowerDestroyed(
  towers: MapSchema<TowerSchema>,
  endMatch: (winnerTeam: string) => void,
): void {
  towers.forEach((tower) => {
    if (tower.dead) {
      const winner = tower.team === 'blue' ? 'red' : 'blue'
      endMatch(winner)
    }
  })
}

/**
 * End the match with a winner. Idempotent — subsequent calls are no-ops.
 * Pure function operating on state — no Room dependency.
 */
export function endMatch(state: GameRoomState, winnerTeam: string): void {
  if (state.matchPhase === 'finished') return
  state.matchPhase = 'finished'
  state.winnerTeam = winnerTeam
}
