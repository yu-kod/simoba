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
  readonly projectileCount?: number // number of projectiles to spawn (default 1)
  readonly spreadAngle?: number     // total fan spread angle in radians (used when projectileCount > 1)
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
    readonly isDebuff?: boolean  // override parent isDebuff for this specific buff
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
  readonly tickDamage?: number     // damage per tick (0 = no tick damage)
  readonly tickHeal?: number       // healing per tick to allies (0 = no tick heal)
  readonly tickInterval?: number   // seconds between tick damage/heal applications
  readonly followCaster?: boolean  // true = zone follows caster position each tick
  readonly zoneEffect: {
    readonly buffType: string       // effect category ('speed', etc.)
    readonly value: number          // effect amount (negative = debuff)
    readonly isDebuff: boolean
    readonly target: 'enemy' | 'ally' | 'all'
    readonly duration?: number      // debuff duration (seconds) — used by trigger zones
  }
}

export interface StrikeEffectParams {
  readonly effectType: 'strike'
  readonly damage: number               // base melee damage
  readonly executeThreshold?: number    // HP ratio (0-1) below which bonus damage applies (omit for plain strikes)
  readonly executeBonusDamage?: number  // additional damage when target HP% ≤ threshold
}

export type SkillEffectParams = DashEffectParams | ProjectileEffectParams | HealEffectParams | BuffEffectParams | AoEEffectParams | ZoneEffectParams | StrikeEffectParams

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
  'aura-barrier': {
    id: 'aura-barrier',
    targeting: 'point',
    cooldown: 14,
    range: 500,
    effect: {
      effectType: 'zone',
      zoneRadius: 180,
      zoneDuration: 4,
      zoneEffect: {
        buffType: 'damageReduction',
        value: 0.3,
        isDebuff: false,
        target: 'ally',
      },
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
  'blade-whirlwind': {
    id: 'blade-whirlwind',
    targeting: 'self',
    cooldown: 12,
    effect: {
      effectType: 'zone',
      zoneRadius: 120,
      zoneDuration: 3,
      tickDamage: 30,
      tickInterval: 0.5,
      followCaster: true,
      zoneEffect: {
        buffType: 'speed',
        value: -40,
        isDebuff: true,
        target: 'enemy',
      },
    },
  },
  'aura-sanctuary': {
    id: 'aura-sanctuary',
    targeting: 'self',
    cooldown: 20,
    effect: {
      effectType: 'zone',
      zoneRadius: 160,
      zoneDuration: 5,
      tickHeal: 15,
      tickInterval: 1.0,
      followCaster: true,
      zoneEffect: {
        buffType: 'damageReduction',
        value: 0.25,
        isDebuff: false,
        target: 'ally',
      },
    },
  },
  'bolt-barrage': {
    id: 'bolt-barrage',
    targeting: 'direction',
    cooldown: 10,
    effect: {
      effectType: 'projectile',
      damage: 25,
      speed: 700,
      range: 450,
      radius: 4,
      pierceCount: 0,
      homing: false,
      visualType: 'circle',
      projectileCount: 5,
      spreadAngle: 0.436, // ~25 degrees in radians
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
  'blade-execute': {
    id: 'blade-execute',
    targeting: 'enemy',
    cooldown: 20,
    range: 150,
    effect: {
      effectType: 'strike',
      damage: 100,
      executeThreshold: 0.3,
      executeBonusDamage: 150,
    },
  },
  'bolt-snipe': {
    id: 'bolt-snipe',
    targeting: 'self',
    cooldown: 16,
    effect: {
      effectType: 'buff',
      buffType: 'attackDamage',
      value: 20,
      duration: 5,
      isDebuff: false,
      additionalBuffs: [
        { buffType: 'attackSpeed', value: 0.4 },
        { buffType: 'speed', value: -60, isDebuff: true },
      ],
    },
  },
}

export function getSkillDefinition(skillId: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS[skillId]
}
