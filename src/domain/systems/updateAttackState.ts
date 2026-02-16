import type { HeroState } from '@/domain/entities/Hero'
import type { CombatEntityState, Position, Team } from '@/domain/types'
import { isInAttackRange } from '@/domain/systems/isInAttackRange'

const MIN_ATTACK_SPEED = 0.01

export interface DamageEvent {
  readonly attackerId: string
  readonly targetId: string
  readonly damage: number
}

export interface ProjectileSpawnEvent {
  readonly ownerId: string
  readonly ownerTeam: Team
  readonly targetId: string
  readonly startPosition: Position
  readonly damage: number
  readonly speed: number
  readonly radius: number
}

export interface AttackStateResult {
  readonly hero: HeroState
  readonly damageEvents: readonly DamageEvent[]
  readonly projectileSpawnEvents: readonly ProjectileSpawnEvent[]
}

/**
 * Update the attack state machine for a hero each frame.
 *
 * Handles:
 * - Cooldown tick-down
 * - Range validation (drops target if out of range)
 * - Damage event emission when cooldown expires and target is in range
 * - Cooldown reset after attack
 *
 * Pure function — no side effects.
 */
export function updateAttackState(
  hero: HeroState,
  target: CombatEntityState | null,
  deltaTime: number,
  attackerRadius: number,
  targetRadius: number,
  projectileSpeed: number = 0,
  projectileRadius: number = 0
): AttackStateResult {
  const emptyResult = {
    damageEvents: [] as readonly DamageEvent[],
    projectileSpawnEvents: [] as readonly ProjectileSpawnEvent[],
  }

  // Tick down cooldown
  const tickedCooldown = Math.max(0, hero.attackCooldown - deltaTime)
  const updatedHero: HeroState = { ...hero, attackCooldown: tickedCooldown }

  // No target set — nothing more to do
  if (updatedHero.attackTargetId === null || target === null) {
    return { hero: updatedHero, ...emptyResult }
  }

  // Check if target is still in range
  const inRange = isInAttackRange(
    updatedHero.position,
    target.position,
    attackerRadius,
    targetRadius,
    updatedHero.stats.attackRange
  )

  if (!inRange) {
    // Target out of range — drop target
    return {
      hero: { ...updatedHero, attackTargetId: null },
      ...emptyResult,
    }
  }

  // Target already dead — drop target
  if (target.hp <= 0) {
    return {
      hero: { ...updatedHero, attackTargetId: null },
      ...emptyResult,
    }
  }

  // In range and cooldown ready — attack
  if (updatedHero.attackCooldown <= 0) {
    const cooldownReset =
      1 / Math.max(MIN_ATTACK_SPEED, updatedHero.stats.attackSpeed)
    const heroAfterAttack: HeroState = {
      ...updatedHero,
      attackCooldown: cooldownReset,
    }

    // Ranged: spawn projectile instead of instant damage
    if (projectileSpeed > 0) {
      const spawnEvent: ProjectileSpawnEvent = {
        ownerId: updatedHero.id,
        ownerTeam: updatedHero.team,
        targetId: target.id,
        startPosition: updatedHero.position,
        damage: updatedHero.stats.attackDamage,
        speed: projectileSpeed,
        radius: projectileRadius,
      }
      return {
        hero: heroAfterAttack,
        damageEvents: [],
        projectileSpawnEvents: [spawnEvent],
      }
    }

    // Melee: instant damage
    const damageEvent: DamageEvent = {
      attackerId: updatedHero.id,
      targetId: target.id,
      damage: updatedHero.stats.attackDamage,
    }
    return {
      hero: heroAfterAttack,
      damageEvents: [damageEvent],
      projectileSpawnEvents: [],
    }
  }

  // In range but on cooldown — wait
  return { hero: updatedHero, ...emptyResult }
}
