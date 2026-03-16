import { type } from '@colyseus/schema'
import { CombatEntitySchema } from './CombatEntitySchema.js'

/**
 * Colyseus state schema for a tower entity.
 * Inherits id, x, y, hp, maxHp, dead, team, radius, applyDamage() from CombatEntitySchema.
 */
export class TowerSchema extends CombatEntitySchema {
  @type('float32') attackCooldown: number = 0
  @type('string') attackTargetId: string = ''
  @type('int16') attackDamage: number = 0
  @type('float32') attackRange: number = 0
  @type('float32') attackSpeed: number = 0
  @type('float32') projectileSpeed: number = 0
  @type('float32') projectileRadius: number = 0

  // ── Summoned turret fields ────────────────────────────
  /** Remaining lifetime in seconds (0 = permanent map tower) */
  @type('float32') remainingDuration: number = 0
  /** Session ID of the hero that summoned this turret ('' = map tower) */
  @type('string') ownerId: string = ''
}
