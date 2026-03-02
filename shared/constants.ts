// World
export const WORLD_WIDTH = 3200
export const WORLD_HEIGHT = 720

// Match
export const MATCH_DURATION = 300 // seconds (5 minutes)
export const MINION_BUFF_TIME = 180 // seconds (3:00)
export const BOSS_SPAWN_TIME = 240 // seconds (4:00)
export const SUDDEN_DEATH_TIME = 300 // seconds (5:00)

// Progression
export const MAX_LEVEL = 5
/** XP thresholds per level (cumulative). Level 1→2 needs 100, 2→3 needs 200, etc. */
export const XP_THRESHOLDS = [0, 100, 300, 600, 1000] as const
export const ULTIMATE_UNLOCK_LEVEL = 3
export const ULTIMATE_ENHANCE_LEVEL = 5

// Dodge
export const DODGE_COOLDOWN = 10 // seconds

// Respawn
export const DEFAULT_RESPAWN_TIME = 5 // seconds (legacy fallback)
/** Respawn time per level (seconds). Index = level. Lv1=3s … Lv5=15s. */
export const RESPAWN_TIMES = [0, 3, 5, 8, 12, 15] as const

// Camera (client-only but harmless to share)
export const CAMERA_LERP = 0.1

// Entity
export const DEFAULT_ENTITY_RADIUS = 20

// Projectile
export const DEFAULT_PROJECTILE_RADIUS = 5

// Minion
export const MINION_WAVE_INTERVAL = 30 // seconds between waves
export const MINION_XP_REWARD = 20 // total XP per minion kill
export const XP_GRANT_RANGE = 500 // px radius for proximity XP
export const MINION_DEATH_CLEANUP_DELAY = 200 // ms before removing dead minion
export const MINION_DETECTION_RANGE = 200 // px — range to detect enemies and start chasing

// Minion spawn positions
export const BLUE_MELEE_X = 150
export const BLUE_RANGED_X = 120
export const RED_MELEE_X = 3050
export const RED_RANGED_X = 3080
export const MELEE_Y_OFFSETS = [340, 360, 380] as const
export const RANGED_Y = 360

export interface MinionWaveConfig {
  readonly interval: number
  readonly meleeCount: number
  readonly rangedCount: number
  readonly statMultiplier: number
}

const DEFAULT_WAVE_CONFIG: MinionWaveConfig = {
  interval: MINION_WAVE_INTERVAL,
  meleeCount: 3,
  rangedCount: 1,
  statMultiplier: 1.0,
}

/** Returns wave config for the given match time. Currently always returns the default. */
export function getWaveConfig(_matchTime: number): MinionWaveConfig {
  return DEFAULT_WAVE_CONFIG
}
