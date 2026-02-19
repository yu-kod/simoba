import { Schema, type } from '@colyseus/schema'

/**
 * Colyseus state schema for a tower entity.
 */
export class TowerSchema extends Schema {
  @type('string') id: string = ''
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('int16') hp: number = 0
  @type('int16') maxHp: number = 0
  @type('boolean') dead: boolean = false
  @type('string') team: string = 'blue'
  @type('float32') radius: number = 0
  @type('float32') attackCooldown: number = 0
  @type('string') attackTargetId: string = ''
  @type('int16') attackDamage: number = 0
  @type('float32') attackRange: number = 0
  @type('float32') attackSpeed: number = 0
  @type('float32') projectileSpeed: number = 0
  @type('float32') projectileRadius: number = 0
}
