import { Schema, type } from '@colyseus/schema'

/**
 * Colyseus state schema for a single buff/debuff effect.
 * Stored in HeroSchema.statusEffects MapSchema, keyed by skill ID.
 */
export class StatusEffectSchema extends Schema {
  @type('string') id: string = ''                    // skill ID (matches MapSchema key)
  @type('string') buffType: string = ''              // effect category ('speed', 'attackSpeed', etc.)
  @type('float32') value: number = 0                 // effect amount (positive = buff, negative = debuff)
  @type('float32') remainingDuration: number = 0     // seconds remaining
  @type('boolean') isDebuff: boolean = false          // true = debuff (for future dispel logic)
}
