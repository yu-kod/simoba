import { type } from '@colyseus/schema'
import { CombatEntitySchema } from './CombatEntitySchema.js'

/**
 * Colyseus state schema for a minion entity.
 * Inherits id, x, y, hp, maxHp, dead, team, radius, applyDamage() from CombatEntitySchema.
 */
export class MinionSchema extends CombatEntitySchema {
  @type('string') minionType: string = 'melee'
  // Server-only fields (not synced to clients)
  attackCooldown: number = 0
  attackTargetId: string = ''
  @type('int16') attackDamage: number = 0
  @type('float32') attackRange: number = 0
  @type('float32') attackSpeed: number = 0
  @type('float32') facing: number = 0
  @type('float32') speed: number = 0
  @type('float32') projectileSpeed: number = 0
  @type('float32') projectileRadius: number = 0
}
