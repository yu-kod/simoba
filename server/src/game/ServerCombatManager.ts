import { MapSchema } from '@colyseus/schema'
import { isInAttackRange } from '@shared/combat'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import { RANGED_ATTACK_PAUSE_DURATION } from '@shared/constants'
import type { HeroType } from '@shared/types'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'
import type { InputMessage, CombatEventMessage } from '@shared/messages'
import { applyDamageToTarget } from './combatUtils.js'
import { getEffectiveStat } from './StatusEffectSystem.js'
import type { ProjectileTracker } from './ProjectileTracker.js'
import { createHomingProjectile } from './projectileFactory.js'

interface CombatTarget {
  id: string
  x: number
  y: number
  hp: number
  dead: boolean
  radius: number
  team: string
}

function findTarget(
  targetId: string,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  minions?: MapSchema<MinionSchema>,
): CombatTarget | null {
  const hero = heroes.get(targetId)
  if (hero) return { id: targetId, x: hero.x, y: hero.y, hp: hero.hp, dead: hero.dead, radius: hero.radius, team: hero.team }
  const tower = towers.get(targetId)
  if (tower) return { id: targetId, x: tower.x, y: tower.y, hp: tower.hp, dead: tower.dead, radius: tower.radius, team: tower.team }
  if (minions) {
    const minion = minions.get(targetId)
    if (minion) return { id: targetId, x: minion.x, y: minion.y, hp: minion.hp, dead: minion.dead, radius: minion.radius, team: minion.team }
  }
  return null
}

/**
 * Process hero attack logic for one tick.
 * Handles cooldown, target validation, melee damage, and projectile spawning.
 * Returns combat events for broadcasting to clients.
 */
export function processHeroCombat(
  hero: HeroSchema,
  heroId: string,
  input: InputMessage | undefined,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  projectiles: MapSchema<ProjectileSchema>,
  ProjectileSchemaClass: new () => ProjectileSchema,
  deltaTime: number,
  tracker: ProjectileTracker,
  minions?: MapSchema<MinionSchema>,
): CombatEventMessage[] {
  const events: CombatEventMessage[] = []

  if (hero.dead) {
    hero.attackTargetId = ''
    hero.attackCooldown = 0
    return events
  }

  // Reduce cooldown
  if (hero.attackCooldown > 0) {
    hero.attackCooldown = Math.max(0, hero.attackCooldown - deltaTime)
  }

  // Update attack target from input
  const requestedTarget = input?.attackTargetId ?? null
  if (requestedTarget) {
    const target = findTarget(requestedTarget, heroes, towers, minions)
    if (target && !target.dead && target.team !== hero.team) {
      const inRange = isInAttackRange(
        { x: hero.x, y: hero.y },
        { x: target.x, y: target.y },
        hero.radius,
        target.radius,
        hero.attackRange
      )
      if (inRange) {
        hero.attackTargetId = requestedTarget
      } else {
        hero.attackTargetId = ''
      }
    } else {
      hero.attackTargetId = ''
    }
  } else {
    hero.attackTargetId = ''
  }

  // Fire attack if cooldown ready and target valid
  if (hero.attackCooldown <= 0 && hero.attackTargetId !== '') {
    const target = findTarget(hero.attackTargetId, heroes, towers, minions)
    if (!target || target.dead) {
      hero.attackTargetId = ''
      return events
    }

    const inRange = isInAttackRange(
      { x: hero.x, y: hero.y },
      { x: target.x, y: target.y },
      hero.radius,
      target.radius,
      hero.attackRange
    )
    if (!inRange) {
      hero.attackTargetId = ''
      return events
    }

    // Reset cooldown (apply attackSpeed status effects, min 0.1 to prevent division by zero)
    const effectiveAS = Math.max(0.1, getEffectiveStat(hero.attackSpeed, hero, 'attackSpeed'))
    hero.attackCooldown = 1 / effectiveAS

    const heroType = hero.heroType as HeroType
    const def = HERO_DEFINITIONS[heroType]

    const effectiveAttack = getEffectiveStat(hero.attackDamage, hero, 'attackDamage')

    if (def.projectileSpeed === 0) {
      // Melee: immediate damage
      applyDamageToTarget(hero.attackTargetId, effectiveAttack, heroes, towers, minions, heroId)

      events.push({
        kind: 'attack',
        event: {
          attackerId: heroId,
          targetId: hero.attackTargetId,
          attackType: 'melee',
          position: { x: hero.x, y: hero.y },
          facing: hero.facing,
        },
      })
      events.push({
        kind: 'damage',
        event: {
          targetId: hero.attackTargetId,
          amount: effectiveAttack,
          sourceId: heroId,
        },
      })
    } else {
      // Ranged: spawn projectile
      createHomingProjectile(
        ProjectileSchemaClass,
        tracker.nextCombatProjectileId(),
        hero,
        { id: hero.attackTargetId, x: target.x, y: target.y },
        def.projectileSpeed,
        effectiveAttack,
        heroId,
        projectiles,
      )

      // Brief movement pause when firing while moving
      hero.attackPauseTimer = RANGED_ATTACK_PAUSE_DURATION

      events.push({
        kind: 'attack',
        event: {
          attackerId: heroId,
          targetId: hero.attackTargetId,
          attackType: 'ranged',
          position: { x: hero.x, y: hero.y },
          facing: hero.facing,
        },
      })
    }
  }

  return events
}
