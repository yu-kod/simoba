import { Schema, type } from '@colyseus/schema'

/**
 * Colyseus state schema for a hero entity.
 * Note: Colyseus schemas use mutable properties by design for binary diff sync.
 */
export class HeroSchema extends Schema {
  @type('string') id: string = ''
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('float32') facing: number = 0
  @type('int16') hp: number = 0
  @type('int16') maxHp: number = 0
  @type('boolean') dead: boolean = false
  @type('string') team: string = 'blue'
  @type('string') heroType: string = 'BLADE'
  @type('float32') attackCooldown: number = 0
  @type('string') attackTargetId: string = ''
  @type('float32') speed: number = 0
  @type('int16') attackDamage: number = 0
  @type('float32') attackRange: number = 0
  @type('float32') attackSpeed: number = 0
  @type('float32') radius: number = 0
  @type('float32') respawnTimer: number = 0
  @type('int16') lastProcessedSeq: number = 0
}
