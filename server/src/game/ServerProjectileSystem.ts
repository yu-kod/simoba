import { MapSchema } from '@colyseus/schema'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import { applyDamageToTarget } from './combatUtils.js'

interface DamageTarget {
  id: string
  x: number
  y: number
  hp: number
  dead: boolean
  radius: number
  team: string
}

import { DEFAULT_PROJECTILE_RADIUS } from '@shared/constants'

function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

function getAllDamageTargets(
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>
): DamageTarget[] {
  const targets: DamageTarget[] = []
  heroes.forEach((h, id) => {
    targets.push({ id, x: h.x, y: h.y, hp: h.hp, dead: h.dead, radius: h.radius, team: h.team })
  })
  towers.forEach((t, id) => {
    targets.push({ id, x: t.x, y: t.y, hp: t.hp, dead: t.dead, radius: t.radius, team: t.team })
  })
  return targets
}

/**
 * Process all projectiles for one tick.
 * Moves each projectile toward its target position, checks collision against
 * enemy entities, applies damage on hit, and removes arrived/hit projectiles.
 */
export function processProjectiles(
  projectiles: MapSchema<ProjectileSchema>,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  deltaTime: number
): void {
  const toRemove: string[] = []
  const targets = getAllDamageTargets(heroes, towers)

  projectiles.forEach((proj, projId) => {
    // Move toward target position
    const dx = proj.targetX - proj.x
    const dy = proj.targetY - proj.y
    const distToTarget = Math.sqrt(dx * dx + dy * dy)

    if (distToTarget === 0) {
      toRemove.push(projId)
      return
    }

    const moveDistance = proj.speed * deltaTime
    const nx = dx / distToTarget
    const ny = dy / distToTarget

    if (moveDistance >= distToTarget) {
      // Arrived at target position
      proj.x = proj.targetX
      proj.y = proj.targetY
    } else {
      proj.x = proj.x + nx * moveDistance
      proj.y = proj.y + ny * moveDistance
    }

    // Check collision against enemy entities
    let hit = false
    for (const target of targets) {
      if (target.dead || target.hp <= 0) continue
      if (target.team === proj.team) continue

      const collisionDist = target.radius + DEFAULT_PROJECTILE_RADIUS
      if (distanceSq(proj.x, proj.y, target.x, target.y) <= collisionDist * collisionDist) {
        applyDamageToTarget(target.id, proj.damage, heroes, towers)
        hit = true
        break
      }
    }

    if (hit) {
      toRemove.push(projId)
      return
    }

    // Remove if arrived at destination without hitting
    if (moveDistance >= distToTarget) {
      toRemove.push(projId)
    }
  })

  for (const id of toRemove) {
    projectiles.delete(id)
  }
}
