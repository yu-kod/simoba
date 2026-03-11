// ── Zone visual definitions ─────────────────────────────────
// Separates "how it looks" from zone behavior.
// Add new entries here when introducing new zone skills.

export interface ZoneVisualDef {
  readonly color: number       // fill color (hex)
  readonly alpha: number       // fill alpha (0-1)
  readonly borderColor: number // stroke color
  readonly borderAlpha: number // stroke alpha
  readonly borderWidth: number // stroke width (px)
  readonly allyOnly?: boolean  // true = only visible to the caster's team
}

// ── Registry ────────────────────────────────────────────────

export const ZONE_VISUALS: Record<string, ZoneVisualDef> = {
  'aura-slow-field': {
    color: 0x9b59b6,
    alpha: 0.2,
    borderColor: 0x9b59b6,
    borderAlpha: 0.6,
    borderWidth: 2,
  },
  'blade-whirlwind': {
    color: 0xe74c3c,
    alpha: 0.25,
    borderColor: 0xf39c12,
    borderAlpha: 0.7,
    borderWidth: 2,
  },
  'aura-sanctuary': {
    color: 0x3498db,
    alpha: 0.2,
    borderColor: 0xf1c40f,
    borderAlpha: 0.6,
    borderWidth: 2,
  },
  'bolt-trap': {
    color: 0xf1c40f,
    alpha: 0.15,
    borderColor: 0xf1c40f,
    borderAlpha: 0.5,
    borderWidth: 1,
    allyOnly: true,
  },
}

export const DEFAULT_ZONE_VISUAL: ZoneVisualDef = {
  color: 0x95a5a6,
  alpha: 0.2,
  borderColor: 0x95a5a6,
  borderAlpha: 0.5,
  borderWidth: 1,
}

export function getZoneVisual(skillId: string): ZoneVisualDef {
  return ZONE_VISUALS[skillId] ?? DEFAULT_ZONE_VISUAL
}
