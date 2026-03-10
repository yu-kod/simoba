import { Schema, type, MapSchema } from '@colyseus/schema'
import { HeroSchema } from './HeroSchema.js'
import { TowerSchema } from './TowerSchema.js'
import { ProjectileSchema } from './ProjectileSchema.js'
import { MinionSchema } from './MinionSchema.js'
import { ZoneSchema } from './ZoneSchema.js'

/**
 * Root state schema for a game room.
 * Server-authoritative: all entities are managed here.
 */
export class GameRoomState extends Schema {
  @type({ map: HeroSchema })
  heroes = new MapSchema<HeroSchema>()

  @type({ map: TowerSchema })
  towers = new MapSchema<TowerSchema>()

  @type({ map: MinionSchema })
  minions = new MapSchema<MinionSchema>()

  @type({ map: ProjectileSchema })
  projectiles = new MapSchema<ProjectileSchema>()

  @type({ map: ZoneSchema })
  zones = new MapSchema<ZoneSchema>()

  @type('string')
  matchPhase: 'waiting' | 'playing' | 'finished' = 'waiting'

  @type('string')
  winnerTeam: string = ''

  @type('string')
  matchEndReason: string = ''

  @type('float32')
  matchTime = 0
}
