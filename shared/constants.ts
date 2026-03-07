// World
export const WORLD_WIDTH = 3200
export const WORLD_HEIGHT = 720

// Progression
export const MAX_LEVEL = 30
/** XP thresholds per level (cumulative). Index i = XP needed to reach level i+1.
 *  Segmented curve: early (Lv1-8) fast, mid (Lv9-20) linear, late (Lv21-30) steep. */
export const XP_THRESHOLDS = [
  // Early (Lv 1-8): increments 30-80
  30, 70, 120, 180, 250, 330, 420, 520,
  // Mid (Lv 9-20): increments 100-250
  620, 740, 880, 1040, 1220, 1420, 1640, 1880, 2140, 2420, 2720, 3040,
  // Late (Lv 21-30): increments 300-500
  3340, 3690, 4090, 4540, 5040, 5540, 6090, 6690, 7340, 8040,
] as const
export const ULTIMATE_UNLOCK_LEVEL = 3
export const ULTIMATE_ENHANCE_LEVEL = 5

// Dodge
export const DODGE_COOLDOWN = 10 // seconds

// Respawn
export const DEFAULT_RESPAWN_TIME = 5 // seconds (legacy fallback)
/** Respawn time per level (seconds). Index = level. Lv0=0s, Lv30=25s. */
export const RESPAWN_TIMES = [
  0,                                          // Lv0
  2, 2, 3, 3, 4, 4, 5, 5,                    // Lv1-8
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 15, 16, // Lv9-20
  17, 18, 19, 20, 21, 22, 23, 24, 24, 25,    // Lv21-30
] as const

// Map layout — base areas (the colored rectangles at each end)
export const BASE_WIDTH = 120
export const BASE_HEIGHT = 160
export const BASE_Y = (WORLD_HEIGHT - BASE_HEIGHT) / 2
export const BASES = {
  blue: { x: 0, y: BASE_Y, width: BASE_WIDTH, height: BASE_HEIGHT },
  red: { x: WORLD_WIDTH - BASE_WIDTH, y: BASE_Y, width: BASE_WIDTH, height: BASE_HEIGHT },
} as const

// Camera (client-only but harmless to share)
export const CAMERA_LERP = 0.1

// Entity
export const DEFAULT_ENTITY_RADIUS = 20

// Projectile
export const DEFAULT_PROJECTILE_RADIUS = 5

// Hero kill
export const HERO_KILL_XP_REWARD = 150 // XP granted to killer on hero kill

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
