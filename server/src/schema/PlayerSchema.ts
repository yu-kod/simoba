import { Schema, type } from '@colyseus/schema'

/**
 * Colyseus state schema for a player.
 * Note: Colyseus schemas use mutable properties by design for binary diff sync.
 */
export class PlayerSchema extends Schema {
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('float32') facing: number = 0
  @type('int16') hp: number = 100
  @type('int16') maxHp: number = 100
  @type('string') heroType: string = 'BLADE'
  @type('string') team: string = 'blue'
}
