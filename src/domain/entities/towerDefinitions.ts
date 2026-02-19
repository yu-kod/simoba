import type { StatBlock } from '@/domain/entities/StatBlock'

/** Fixed per-type definition for tower entities (never changes during a match) */
export interface TowerDefinition {
  readonly stats: StatBlock
  readonly radius: number
  /** Projectile travel speed in px/sec. */
  readonly projectileSpeed: number
  /** Projectile collision/draw radius in px. */
  readonly projectileRadius: number
}

export const DEFAULT_TOWER: TowerDefinition = {
  stats: {
    maxHp: 1500,
    speed: 0,
    attackDamage: 80,
    attackRange: 350,
    attackSpeed: 0.8,
  },
  radius: 24,
  projectileSpeed: 400,
  projectileRadius: 5,
}
