import type { StatBlock } from '@/domain/entities/StatBlock'
import type { HeroType } from '@/domain/types'

/** Fixed per-type definition (never changes during a match) */
export interface HeroDefinition {
  readonly base: StatBlock
  /** Per-level stat growth (added per level-up). Uses StatBlock so base + growth share the same shape. */
  readonly growth: StatBlock
  readonly radius: number
  /** Whether the hero can move while performing basic attacks */
  readonly canMoveWhileAttacking: boolean
  /** Projectile travel speed in px/sec. 0 = melee (instant damage). */
  readonly projectileSpeed: number
  /** Projectile collision/draw radius in px. 0 for melee heroes. */
  readonly projectileRadius: number
}

export const HERO_DEFINITIONS: Record<HeroType, HeroDefinition> = {
  BLADE: {
    base: {
      maxHp: 650,
      speed: 170,
      attackDamage: 60,
      attackRange: 60,
      attackSpeed: 0.8,
    },
    growth: {
      maxHp: 80,
      speed: 5,
      attackDamage: 8,
      attackRange: 0,
      attackSpeed: 0.05,
    },
    radius: 22,
    canMoveWhileAttacking: true,
    projectileSpeed: 0,
    projectileRadius: 0,
  },
  BOLT: {
    base: {
      maxHp: 400,
      speed: 220,
      attackDamage: 45,
      attackRange: 300,
      attackSpeed: 1.0,
    },
    growth: {
      maxHp: 50,
      speed: 5,
      attackDamage: 5,
      attackRange: 0,
      attackSpeed: 0.05,
    },
    radius: 18,
    canMoveWhileAttacking: false,
    projectileSpeed: 600,
    projectileRadius: 4,
  },
  AURA: {
    base: {
      maxHp: 500,
      speed: 190,
      attackDamage: 30,
      attackRange: 200,
      attackSpeed: 0.7,
    },
    growth: {
      maxHp: 60,
      speed: 5,
      attackDamage: 3,
      attackRange: 0,
      attackSpeed: 0.03,
    },
    radius: 20,
    canMoveWhileAttacking: false,
    projectileSpeed: 400,
    projectileRadius: 5,
  },
}
