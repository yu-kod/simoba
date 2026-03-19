import type { Team, HeroType } from '@/domain/types'

/** Team colors used for towers, minions, projectiles, and other team-affiliated entities. */
export const TEAM_COLORS: Record<Team, number> = {
  blue: 0x3498db,
  red: 0xe74c3c,
  neutral: 0x95a5a6,
}

/** Hero type body colors (not team colors — used for hero body and talent tree). */
export const HERO_COLORS: Record<HeroType, number> = {
  BLADE: 0xe74c3c,
  BOLT: 0x3498db,
  AURA: 0x2ecc71,
}

/** Shared flash constants for hit feedback across all renderers. */
export const FLASH_DURATION_MS = 100
export const FLASH_COLOR = 0xffffff

/** Diamond shape aspect ratio (used in hero body and talent tree). */
export const DIAMOND_ASPECT_RATIO = 0.6
