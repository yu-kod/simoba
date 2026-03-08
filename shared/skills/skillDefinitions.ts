// ── Effect-type-specific parameter blocks ─────────────────────

export interface DashEffectParams {
  readonly effectType: 'dash'
  readonly distance: number       // px traveled during dash
  readonly duration: number       // seconds
  readonly damage: number         // contact damage during dash
}

// Future effect types:
// export interface ProjectileEffectParams { effectType: 'projectile'; ... }
// export interface AoeEffectParams { effectType: 'aoe'; ... }
// export interface BuffEffectParams { effectType: 'buff'; ... }

export type SkillEffectParams = DashEffectParams
// Union expands as new effect types are added:
// export type SkillEffectParams = DashEffectParams | ProjectileEffectParams | AoeEffectParams | ...

// ── Common fields shared by ALL skills ────────────────────────

export type SkillTargeting = 'direction' | 'point' | 'self' | 'ally'

export interface SkillDefinition {
  readonly id: string
  readonly targeting: SkillTargeting
  readonly cooldown: number       // seconds
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
}

export function getSkillDefinition(skillId: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS[skillId]
}
