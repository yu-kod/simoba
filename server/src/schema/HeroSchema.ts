import { ArraySchema, type } from '@colyseus/schema'
import { CombatEntitySchema } from './CombatEntitySchema.js'

/**
 * Colyseus state schema for a hero entity.
 * Inherits id, x, y, hp, maxHp, dead, team, radius, applyDamage() from CombatEntitySchema.
 */
export class HeroSchema extends CombatEntitySchema {
  @type('float32') facing: number = 0
  @type('string') heroType: string = 'BLADE'
  @type('float32') attackCooldown: number = 0
  // Convention: '' means "no target" (empty string, not null) for Colyseus schema compat
  @type('string') attackTargetId: string = ''
  @type('float32') speed: number = 0
  @type('int16') attackDamage: number = 0
  @type('float32') attackRange: number = 0
  @type('float32') attackSpeed: number = 0
  @type('float32') respawnTimer: number = 0
  @type('uint32') lastProcessedSeq: number = 0
  @type('uint32') xp: number = 0
  @type('uint8') level: number = 1
  @type('uint8') talentPoints: number = 0
  @type(['string']) acquiredTalents: ArraySchema<string> = new ArraySchema<string>()
  @type(['string']) ownedSkills: ArraySchema<string> = new ArraySchema<string>()
  @type('string') skillSlotQ: string = ''
  @type('string') skillSlotE: string = ''
  @type('string') skillSlotR: string = ''
  @type('boolean') isBot: boolean = false
  // Server-only: not synced to clients (no @type decorator)
  lastAttackerSessionId: string = ''
}
