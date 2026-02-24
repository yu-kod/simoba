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
export const ULTIMATE_UNLOCK_LEVEL = 3
export const ULTIMATE_ENHANCE_LEVEL = 5

// Dodge
export const DODGE_COOLDOWN = 10 // seconds

// Respawn
export const DEFAULT_RESPAWN_TIME = 5 // seconds

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
