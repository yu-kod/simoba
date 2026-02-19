import { Schema, type, MapSchema } from '@colyseus/schema'
import { HeroSchema } from './HeroSchema.js'
import { TowerSchema } from './TowerSchema.js'
import { ProjectileSchema } from './ProjectileSchema.js'

/**
 * Root state schema for a game room.
 * Server-authoritative: all entities are managed here.
 */
export class GameRoomState extends Schema {
  @type({ map: HeroSchema })
  heroes = new MapSchema<HeroSchema>()

  @type({ map: TowerSchema })
  towers = new MapSchema<TowerSchema>()

  @type({ map: ProjectileSchema })
  projectiles = new MapSchema<ProjectileSchema>()

  @type('boolean')
  gameStarted = false

  @type('float32')
  matchTime = 0
}
