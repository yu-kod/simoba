import { MapSchema } from '@colyseus/schema'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'
import type { CombatEventMessage } from '@shared/messages'
import { applyDamageToTarget } from './combatUtils.js'
import { DEFAULT_PROJECTILE_RADIUS } from '@shared/constants'

interface TargetPosition {
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly dead: boolean
  readonly team: string
}

function findTargetPosition(
  targetId: string,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  minions?: MapSchema<MinionSchema>,
): TargetPosition | null {
  const hero = heroes.get(targetId)
  if (hero) return { x: hero.x, y: hero.y, radius: hero.radius, dead: hero.dead, team: hero.team }
  const tower = towers.get(targetId)
  if (tower) return { x: tower.x, y: tower.y, radius: tower.radius, dead: tower.dead, team: tower.team }
  if (minions) {
    const minion = minions.get(targetId)
    if (minion) return { x: minion.x, y: minion.y, radius: minion.radius, dead: minion.dead, team: minion.team }
  }
  return null
}

function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

/**
 * Process all projectiles for one tick.
 * Each projectile homes toward its designated target entity.
 * Damage is only applied to the designated target (not any entity on the path).
 * Projectiles are removed when they reach the target, the target dies, or the target disappears.
 */
export function processProjectiles(
  projectiles: MapSchema<ProjectileSchema>,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  deltaTime: number,
  minions?: MapSchema<MinionSchema>,
): CombatEventMessage[] {
  const events: CombatEventMessage[] = []
  const toRemove: string[] = []

  projectiles.forEach((proj, projId) => {
    // Look up current target position
    const target = findTargetPosition(proj.targetId, heroes, towers, minions)

    // Remove projectile if target is gone, dead, or same team (friendly fire guard)
    if (!target || target.dead || target.team === proj.team) {
      toRemove.push(projId)
      return
    }

    // Update homing direction — always fly toward current target position
    const dx = target.x - proj.x
    const dy = target.y - proj.y
    const distToTarget = Math.sqrt(dx * dx + dy * dy)

    // Also update targetX/targetY for client-side interpolation
    proj.targetX = target.x
    proj.targetY = target.y

    // Already at target position — apply damage immediately
    if (distToTarget === 0) {
      applyDamageToTarget(proj.targetId, proj.damage, heroes, towers, minions, proj.ownerId)
      events.push({
        kind: 'damage',
        event: {
          targetId: proj.targetId,
          amount: proj.damage,
          sourceId: proj.ownerId,
        },
      })
      toRemove.push(projId)
      return
    }

    const moveDistance = proj.speed * deltaTime
    const nx = dx / distToTarget
    const ny = dy / distToTarget

    if (moveDistance >= distToTarget) {
      proj.x = target.x
      proj.y = target.y
    } else {
      proj.x = proj.x + nx * moveDistance
      proj.y = proj.y + ny * moveDistance
    }

    // Check collision with designated target only
    const collisionDist = target.radius + DEFAULT_PROJECTILE_RADIUS
    if (distanceSq(proj.x, proj.y, target.x, target.y) <= collisionDist * collisionDist) {
      applyDamageToTarget(proj.targetId, proj.damage, heroes, towers, minions, proj.ownerId)
      events.push({
        kind: 'damage',
        event: {
          targetId: proj.targetId,
          amount: proj.damage,
          sourceId: proj.ownerId,
        },
      })
      toRemove.push(projId)
    }
  })

  for (const id of toRemove) {
    projectiles.delete(id)
  }

  return events
}
