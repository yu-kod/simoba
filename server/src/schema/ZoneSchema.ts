import { Schema, type } from '@colyseus/schema'

/**
 * Colyseus state schema for a persistent zone (ground-placed area effect).
 * Stored in GameRoomState.zones MapSchema, keyed by zone ID.
 */
export class ZoneSchema extends Schema {
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('float32') radius: number = 0
  @type('float32') remainingDuration: number = 0
  @type('string') team: string = ''
  @type('string') casterId: string = ''
  @type('string') skillId: string = ''
  /** Effect category ('speed', etc.) */
  @type('string') buffType: string = ''
  /** Effect amount (negative = debuff) */
  @type('float32') value: number = 0
  @type('boolean') isDebuff: boolean = false
  /** Who the zone affects: 'enemy', 'ally', or 'all' */
  @type('string') target: string = ''
}
