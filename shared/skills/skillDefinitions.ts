// ── Effect-type-specific parameter blocks ─────────────────────

export interface DashEffectParams {
  readonly effectType: 'dash'
  readonly distance: number       // px traveled during dash
  readonly duration: number       // seconds
  readonly damage: number         // contact damage during dash
  readonly invulnerable?: boolean // true = invulnerable during dash
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
  readonly additionalBuffs?: readonly {
    readonly buffType: string
    readonly value: number
  }[]
}

export interface AoEEffectParams {
  readonly effectType: 'aoe'
  readonly damage: number           // damage to enemies in radius
  readonly healAmount: number       // healing to allies in radius
  readonly radius: number           // effect radius (px)
}

export interface ZoneEffectParams {
  readonly effectType: 'zone'
  readonly zoneRadius: number       // zone radius (px)
  readonly zoneDuration: number     // zone duration (seconds)
  readonly triggerDamage?: number   // damage on trigger (0 = no trigger damage)
  readonly triggerOnce?: boolean    // true = zone removed after first trigger
  readonly zoneEffect: {
    readonly buffType: string       // effect category ('speed', etc.)
    readonly value: number          // effect amount (negative = debuff)
    readonly isDebuff: boolean
    readonly target: 'enemy' | 'ally' | 'all'
    readonly duration?: number      // debuff duration (seconds) — used by trigger zones
  }
}

export type SkillEffectParams = DashEffectParams | ProjectileEffectParams | HealEffectParams | BuffEffectParams | AoEEffectParams | ZoneEffectParams

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
    range: 600,
    effect: {
      effectType: 'aoe',
      damage: 80,
      healAmount: 60,
      radius: 200,
    },
  },
  'aura-slow-field': {
    id: 'aura-slow-field',
    targeting: 'point',
    cooldown: 14,
    range: 600,
    effect: {
      effectType: 'zone',
      zoneRadius: 200,
      zoneDuration: 4,
      zoneEffect: {
        buffType: 'speed',
        value: -60,
        isDebuff: true,
        target: 'enemy',
      },
    },
  },
  'bolt-trap': {
    id: 'bolt-trap',
    targeting: 'point',
    cooldown: 10,
    range: 500,
    effect: {
      effectType: 'zone',
      zoneRadius: 80,
      zoneDuration: 30,
      triggerDamage: 70,
      triggerOnce: true,
      zoneEffect: {
        buffType: 'speed',
        value: -50,
        isDebuff: true,
        target: 'enemy',
        duration: 2,
      },
    },
  },
  'blade-dodge': {
    id: 'blade-dodge',
    targeting: 'direction',
    cooldown: 8,
    effect: {
      effectType: 'dash',
      distance: 150,
      duration: 0.15,
      damage: 0,
      invulnerable: true,
    },
  },
  'blade-block': {
    id: 'blade-block',
    targeting: 'self',
    cooldown: 10,
    effect: {
      effectType: 'buff',
      buffType: 'blockAmount',
      value: 30,
      duration: 3,
      isDebuff: false,
    },
  },
  'blade-fortify': {
    id: 'blade-fortify',
    targeting: 'self',
    cooldown: 14,
    effect: {
      effectType: 'buff',
      buffType: 'damageReduction',
      value: 0.3,
      duration: 4,
      isDebuff: false,
    },
  },
  'blade-fury': {
    id: 'blade-fury',
    targeting: 'self',
    cooldown: 18,
    effect: {
      effectType: 'buff',
      buffType: 'attackDamage',
      value: 25,
      duration: 5,
      isDebuff: false,
      additionalBuffs: [
        { buffType: 'attackSpeed', value: 0.5 },
      ],
    },
  },
}

export function getSkillDefinition(skillId: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS[skillId]
}
