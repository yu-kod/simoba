import type { CombatEntityState, Position } from '@shared/types'
import { DEFAULT_RESPAWN_TIME } from '@shared/constants'
import type { HeroState } from '@shared/entities/Hero'

/**
 * Apply damage to a combat entity, clamping HP at 0.
 * Returns a new entity state (immutable update).
 */
export function applyDamage<T extends CombatEntityState>(
  target: T,
  damage: number
): T {
  return {
    ...target,
    hp: Math.max(0, target.hp - damage),
  }
}

/**
 * Check whether the attacker is within attack range of the target.
 * Effective distance = center-to-center distance - attacker radius - target radius.
 * Attack is possible when effective distance <= attackRange.
 */
export function isInAttackRange(
  attackerPos: Position,
  targetPos: Position,
  attackerRadius: number,
  targetRadius: number,
  attackRange: number
): boolean {
  const dx = targetPos.x - attackerPos.x
  const dy = targetPos.y - attackerPos.y
  const centerDist = Math.sqrt(dx * dx + dy * dy)
  const effectiveDist = centerDist - attackerRadius - targetRadius
  return effectiveDist <= attackRange
}

/**
 * Check if any combat entity should transition to dead state.
 * Pure function — returns new state with dead: true if HP <= 0 and not already dead.
 */
export function checkDeath<T extends CombatEntityState>(entity: T): T {
  if (entity.dead || entity.hp > 0) return entity
  return { ...entity, dead: true }
}

/**
 * Check if hero should transition to dead state.
 * Sets hero-specific fields (respawnTimer, deathPosition, attackTargetId)
 * in addition to the generic dead flag.
 */
export function checkHeroDeath(
  hero: HeroState,
  respawnTime: number = DEFAULT_RESPAWN_TIME
): HeroState {
  if (hero.dead || hero.hp > 0) return hero
  return {
    ...checkDeath(hero),
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
