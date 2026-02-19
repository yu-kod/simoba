import { Schema, type } from '@colyseus/schema'

/**
 * Colyseus state schema for a projectile entity.
 */
export class ProjectileSchema extends Schema {
  @type('string') id: string = ''
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('float32') targetX: number = 0
  @type('float32') targetY: number = 0
  @type('float32') speed: number = 0
  @type('int16') damage: number = 0
  @type('string') ownerId: string = ''
  @type('string') team: string = 'blue'
}
