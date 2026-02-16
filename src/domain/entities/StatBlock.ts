/** Combat stats shared by base values, growth rates, and effective values */
export interface StatBlock {
  readonly maxHp: number
  readonly speed: number
  readonly attackDamage: number
  readonly attackRange: number
  /** Attacks per second */
  readonly attackSpeed: number
}
