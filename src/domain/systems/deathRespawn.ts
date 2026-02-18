import type { HeroState } from '@/domain/entities/Hero'
import type { Position } from '@/domain/types'
import { DEFAULT_RESPAWN_TIME } from '@/domain/constants'

/**
 * Check if hero should transition to dead state.
 * Pure function — returns new state if HP <= 0 and not already dead.
 */
export function checkDeath(
  hero: HeroState,
  respawnTime: number = DEFAULT_RESPAWN_TIME
): HeroState {
  if (hero.dead || hero.hp > 0) return hero
  return {
    ...hero,
    dead: true,
    respawnTimer: respawnTime,
    deathPosition: hero.position,
    attackTargetId: null,
  }
}

/**
 * Decrement respawn timer for a dead hero.
 * Returns unchanged state if hero is alive.
 */
export function updateRespawnTimer(
  hero: HeroState,
  deltaSeconds: number
): HeroState {
  if (!hero.dead) return hero
  return {
    ...hero,
    respawnTimer: hero.respawnTimer - deltaSeconds,
  }
}

/**
 * Respawn a dead hero at the given position with full HP.
 * Resets combat state (attackTargetId, attackCooldown).
 */
export function respawn(
  hero: HeroState,
  respawnPosition: Position
): HeroState {
  return {
    ...hero,
    dead: false,
    respawnTimer: 0,
    hp: hero.maxHp,
    position: respawnPosition,
    attackTargetId: null,
    attackCooldown: 0,
  }
}
