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
  let found = false
  towers.forEach((tower) => {
    if (found) return
    // Skip summoned turrets — only permanent map towers trigger match end
    if (tower.dead && tower.ownerId === '') {
      found = true
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
  state.matchEndReason = 'tower_destroyed'
}

/**
 * End the match due to a player disconnect.
 * The disconnected player's opposing team wins.
 * Idempotent — subsequent calls are no-ops.
 */
export function endMatchByDisconnect(state: GameRoomState, disconnectedTeam: string): void {
  if (state.matchPhase === 'finished') return
  state.matchPhase = 'finished'
  state.winnerTeam = disconnectedTeam === 'blue' ? 'red' : 'blue'
  state.matchEndReason = 'player_disconnected'
}
