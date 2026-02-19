import type { AttackerEntityState, CombatEntityState, Position, Team } from '@/domain/types'
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

export interface AttackStateResult<T extends AttackerEntityState> {
  readonly entity: T
  readonly damageEvents: readonly DamageEvent[]
  readonly projectileSpawnEvents: readonly ProjectileSpawnEvent[]
}

/**
 * Update the attack state machine for an attacker entity each frame.
 *
 * Handles:
 * - Cooldown tick-down
 * - Range validation (drops target if out of range)
 * - Damage event emission when cooldown expires and target is in range
 * - Cooldown reset after attack
 *
 * Pure function — no side effects.
 */
export function updateAttackState<T extends AttackerEntityState>(
  entity: T,
  target: CombatEntityState | null,
  deltaTime: number,
  attackerRadius: number,
  targetRadius: number,
  projectileSpeed: number = 0,
  projectileRadius: number = 0
): AttackStateResult<T> {
  const emptyResult = {
    damageEvents: [] as readonly DamageEvent[],
    projectileSpawnEvents: [] as readonly ProjectileSpawnEvent[],
  }

  // Tick down cooldown
  const tickedCooldown = Math.max(0, entity.attackCooldown - deltaTime)
  const updatedEntity: T = { ...entity, attackCooldown: tickedCooldown }

  // No target set — nothing more to do
  if (updatedEntity.attackTargetId === null || target === null) {
    return { entity: updatedEntity, ...emptyResult }
  }

  // Check if target is still in range
  const inRange = isInAttackRange(
    updatedEntity.position,
    target.position,
    attackerRadius,
    targetRadius,
    updatedEntity.stats.attackRange
  )

  if (!inRange) {
    // Target out of range — drop target
    return {
      entity: { ...updatedEntity, attackTargetId: null },
      ...emptyResult,
    }
  }

  // Target already dead — drop target
  if (target.hp <= 0) {
    return {
      entity: { ...updatedEntity, attackTargetId: null },
      ...emptyResult,
    }
  }

  // In range and cooldown ready — attack
  if (updatedEntity.attackCooldown <= 0) {
    const cooldownReset =
      1 / Math.max(MIN_ATTACK_SPEED, updatedEntity.stats.attackSpeed)
    const entityAfterAttack: T = {
      ...updatedEntity,
      attackCooldown: cooldownReset,
    }

    // Ranged: spawn projectile instead of instant damage
    if (projectileSpeed > 0) {
      const spawnEvent: ProjectileSpawnEvent = {
        ownerId: updatedEntity.id,
        ownerTeam: updatedEntity.team,
        targetId: target.id,
        startPosition: updatedEntity.position,
        damage: updatedEntity.stats.attackDamage,
        speed: projectileSpeed,
        radius: projectileRadius,
      }
      return {
        entity: entityAfterAttack,
        damageEvents: [],
        projectileSpawnEvents: [spawnEvent],
      }
    }

    // Melee: instant damage
    const damageEvent: DamageEvent = {
      attackerId: updatedEntity.id,
      targetId: target.id,
      damage: updatedEntity.stats.attackDamage,
    }
    return {
      entity: entityAfterAttack,
      damageEvents: [damageEvent],
      projectileSpawnEvents: [],
    }
  }

  // In range but on cooldown — wait
  return { entity: updatedEntity, ...emptyResult }
}
