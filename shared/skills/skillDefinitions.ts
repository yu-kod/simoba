// ── Effect-type-specific parameter blocks ─────────────────────

export interface DashEffectParams {
  readonly effectType: 'dash'
  readonly distance: number       // px traveled during dash
  readonly duration: number       // seconds
  readonly damage: number         // contact damage during dash
}

export interface ProjectileEffectParams {
  readonly effectType: 'projectile'
  readonly damage: number           // hit damage per target
  readonly speed: number            // px/sec
  readonly range: number            // max travel distance (px)
  readonly radius: number           // collision/render radius (px)
  readonly pierceCount: number      // max enemies to pierce (0 = single hit)
  readonly homing: boolean          // true = track target, false = straight line
  readonly visualType: string       // key into PROJECTILE_VISUALS (e.g. 'circle', 'diamond')
}

export interface HealEffectParams {
  readonly effectType: 'heal'
  readonly healAmount: number    // HP restored
}

export interface BuffEffectParams {
  readonly effectType: 'buff'
  readonly buffType: string      // effect category ('speed', 'attackSpeed', etc.)
  readonly value: number         // effect amount (positive = buff, negative = debuff)
  readonly duration: number      // duration in seconds
  readonly isDebuff: boolean     // true = debuff (for future dispel logic)
}

export interface AoEEffectParams {
  readonly effectType: 'aoe'
  readonly damage: number           // damage to enemies in radius
  readonly healAmount: number       // healing to allies in radius
  readonly radius: number           // effect radius (px)
}

export type SkillEffectParams = DashEffectParams | ProjectileEffectParams | HealEffectParams | BuffEffectParams | AoEEffectParams

// ── Common fields shared by ALL skills ────────────────────────

export type SkillTargeting = 'direction' | 'point' | 'self' | 'ally' | 'enemy'

export interface SkillDefinition {
  readonly id: string
  readonly targeting: SkillTargeting
  readonly cooldown: number       // seconds
  readonly range?: number         // target selection range (px) — used by ally/enemy-targeting skills
  readonly effect: SkillEffectParams
}

// ── Registry ──────────────────────────────────────────────────

export const SKILL_DEFINITIONS: Record<string, SkillDefinition> = {
  'blade-charge': {
    id: 'blade-charge',
    targeting: 'direction',
    cooldown: 8,
    effect: {
      effectType: 'dash',
      distance: 300,
      duration: 0.3,
      damage: 80,
    },
  },
  'bolt-dash': {
    id: 'bolt-dash',
    targeting: 'direction',
    cooldown: 6,
    effect: {
      effectType: 'dash',
      distance: 180,
      duration: 0.05,
      damage: 0,
    },
  },
  'bolt-pierce-shot': {
    id: 'bolt-pierce-shot',
    targeting: 'direction',
    cooldown: 5,
    effect: {
      effectType: 'projectile',
      damage: 60,
      speed: 800,
      range: 600,
      radius: 5,
      pierceCount: 3,
      homing: false,
      visualType: 'diamond',
    },
  },
  'aura-heal': {
    id: 'aura-heal',
    targeting: 'ally',
    cooldown: 10,
    range: 400,
    effect: {
      effectType: 'heal',
      healAmount: 120,
    },
  },
  'aura-haste': {
    id: 'aura-haste',
    targeting: 'ally',
    cooldown: 12,
    range: 400,
    effect: {
      effectType: 'buff',
      buffType: 'speed',
      value: 80,
      duration: 3,
      isDebuff: false,
    },
  },
  'aura-weaken': {
    id: 'aura-weaken',
    targeting: 'enemy',
    cooldown: 14,
    range: 500,
    effect: {
      effectType: 'buff',
      buffType: 'attackDamage',
      value: -15,
      duration: 4,
      isDebuff: true,
    },
  },
  'aura-nova': {
    id: 'aura-nova',
    targeting: 'point',
    cooldown: 16,
    effect: {
      effectType: 'aoe',
      damage: 80,
      healAmount: 60,
      radius: 200,
    },
  },
}

export function getSkillDefinition(skillId: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS[skillId]
}
