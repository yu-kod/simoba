import { Schema, type, MapSchema } from '@colyseus/schema'
import { PlayerSchema } from './PlayerSchema.js'

/**
 * Root state schema for a game room.
 * Contains a map of player session IDs to their state.
 */
export class GameRoomState extends Schema {
  @type({ map: PlayerSchema })
  players = new MapSchema<PlayerSchema>()

  @type('boolean')
  gameStarted = false
}
