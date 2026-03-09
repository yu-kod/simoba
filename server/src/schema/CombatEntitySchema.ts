import { Schema, type } from '@colyseus/schema'

/**
 * Base schema for any entity that has HP and can die.
 * All damage should go through applyDamage() to guarantee
 * the dead flag is set when HP reaches 0.
 */
export abstract class CombatEntitySchema extends Schema {
  @type('string') id: string = ''
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('int16') hp: number = 0
  @type('int16') maxHp: number = 0
  @type('boolean') dead: boolean = false
  @type('string') team: string = 'blue'
  @type('float32') radius: number = 0

  /**
   * Apply damage to this entity. HP is clamped to 0 and
   * dead is automatically set to true when HP reaches 0.
   */
  applyDamage(amount: number): void {
    if (this.dead) return
    this.hp = Math.max(0, this.hp - amount)
    if (this.hp <= 0) {
      this.dead = true
    }
  }

  /** Restore HP, clamped to maxHp. Does nothing if dead or amount <= 0. */
  applyHeal(amount: number): void {
    if (this.dead) return
    if (amount <= 0) return
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }
}
