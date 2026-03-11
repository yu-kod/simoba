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
  /** Damage applied when a hero triggers this zone (0 = no trigger damage) */
  @type('float32') triggerDamage: number = 0
  /** If true, zone is removed after first trigger */
  @type('boolean') triggerOnce: boolean = false
  /** Duration for the applied status effect (seconds). Used by trigger zones. */
  @type('float32') effectDuration: number = 0
  /** Session ID of the hero this zone follows (empty = fixed position). Synced to clients for rendering. */
  @type('string') followHeroId: string = ''
  // Server-only fields (not synced to clients)
  /** Damage per tick for sustained damage zones (0 = no tick damage) */
  tickDamage: number = 0
  /** Seconds between tick damage applications */
  tickInterval: number = 0
  /** Countdown timer for next tick damage application */
  tickTimer: number = 0
}
