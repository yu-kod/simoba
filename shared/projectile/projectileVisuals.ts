// ── Projectile visual types ─────────────────────────────────
// Separates "how it looks" from "how it flies" (mode).
// Add new entries here when introducing new projectile visuals.

export type ProjectileVisualType = 'circle' | 'diamond'

export interface ProjectileVisualDef {
  readonly type: ProjectileVisualType
  /** Whether this shape needs direction info (dirX/dirY) for rendering */
  readonly directional: boolean
}

/** Circle: small filled dot (auto-attack projectiles) */
export interface CircleVisualDef extends ProjectileVisualDef {
  readonly type: 'circle'
}

/** Diamond: elongated rhombus aligned to travel direction (skill projectiles) */
export interface DiamondVisualDef extends ProjectileVisualDef {
  readonly type: 'diamond'
  readonly halfLength: number   // px along travel direction
  readonly halfWidth: number    // px perpendicular
}

export type ProjectileVisual = CircleVisualDef | DiamondVisualDef

// ── Registry ────────────────────────────────────────────────

export const PROJECTILE_VISUALS: Record<ProjectileVisualType, ProjectileVisual> = {
  circle: {
    type: 'circle',
    directional: false,
  },
  diamond: {
    type: 'diamond',
    directional: true,
    halfLength: 10,
    halfWidth: 4,
  },
}
