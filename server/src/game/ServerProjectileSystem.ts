import { MapSchema } from '@colyseus/schema'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'
import type { CombatEventMessage } from '@shared/messages'
import { applyDamageToTarget } from './combatUtils.js'
import type { ProjectileTracker } from './ProjectileTracker.js'
import { distanceSq } from '@shared/math/distanceSq'

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

// ── Homing projectile logic (existing behavior) ────────────

function processHomingProjectile(
  proj: ProjectileSchema,
  projId: string,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  deltaTime: number,
  minions: MapSchema<MinionSchema> | undefined,
  events: CombatEventMessage[],
  toRemove: string[],
): void {
  const target = findTargetPosition(proj.targetId, heroes, towers, minions)

  if (!target || target.dead || target.team === proj.team) {
    toRemove.push(projId)
    return
  }

  const dx = target.x - proj.x
  const dy = target.y - proj.y
  const distToTarget = Math.sqrt(dx * dx + dy * dy)

  proj.targetX = target.x
  proj.targetY = target.y

  if (distToTarget === 0) {
    applyDamageToTarget(proj.targetId, proj.damage, heroes, towers, minions, proj.ownerId)
    events.push({ kind: 'damage', event: { targetId: proj.targetId, amount: proj.damage, sourceId: proj.ownerId } })
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

  const collisionDist = target.radius + proj.radius
  if (distanceSq(proj.x, proj.y, target.x, target.y) <= collisionDist * collisionDist) {
    applyDamageToTarget(proj.targetId, proj.damage, heroes, towers, minions, proj.ownerId)
    events.push({ kind: 'damage', event: { targetId: proj.targetId, amount: proj.damage, sourceId: proj.ownerId } })
    toRemove.push(projId)
  }
}

// ── Linear projectile logic (new: straight-line + pierce) ──

interface EntityCandidate {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly dead: boolean
  readonly team: string
}

function collectEnemyEntities(
  projTeam: string,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  minions: MapSchema<MinionSchema> | undefined,
): EntityCandidate[] {
  const candidates: EntityCandidate[] = []
  heroes.forEach((h, id) => {
    if (h.team !== projTeam && !h.dead) {
      candidates.push({ id, x: h.x, y: h.y, radius: h.radius, dead: h.dead, team: h.team })
    }
  })
  towers.forEach((t, id) => {
    if (t.team !== projTeam && !t.dead) {
      candidates.push({ id, x: t.x, y: t.y, radius: t.radius, dead: t.dead, team: t.team })
    }
  })
  if (minions) {
    minions.forEach((m, id) => {
      if (m.team !== projTeam && !m.dead) {
        candidates.push({ id, x: m.x, y: m.y, radius: m.radius, dead: m.dead, team: m.team })
      }
    })
  }
  return candidates
}

/** Find nearest enemy hero within bounce range (heroes only — design decision, see bolt-ricochet design.md §3). */
function findNearestUnhitHero(
  x: number,
  y: number,
  projTeam: string,
  hitSet: Set<string>,
  heroes: MapSchema<HeroSchema>,
  bounceRange: number,
): EntityCandidate | null {
  let nearest: EntityCandidate | null = null
  let nearestDistSq = bounceRange * bounceRange

  heroes.forEach((h, id) => {
    if (h.team === projTeam || h.dead || hitSet.has(id)) return
    const dSq = distanceSq(x, y, h.x, h.y)
    if (dSq <= nearestDistSq) {
      nearestDistSq = dSq
      nearest = { id, x: h.x, y: h.y, radius: h.radius, dead: h.dead, team: h.team }
    }
  })

  return nearest
}

function processLinearProjectile(
  proj: ProjectileSchema,
  projId: string,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  deltaTime: number,
  minions: MapSchema<MinionSchema> | undefined,
  events: CombatEventMessage[],
  toRemove: string[],
  tracker: ProjectileTracker,
): void {
  // Move in direction
  const moveDistance = proj.speed * deltaTime
  proj.x = proj.x + proj.dirX * moveDistance
  proj.y = proj.y + proj.dirY * moveDistance

  // Track cumulative distance
  const traveled = tracker.getDistanceTraveled(projId) + moveDistance
  tracker.setDistanceTraveled(projId, traveled)

  // Range check
  if (proj.maxRange > 0 && traveled >= proj.maxRange) {
    toRemove.push(projId)
    return
  }

  // Collision with all enemy entities
  const hitSet = tracker.getHitSet(projId)
  const enemies = collectEnemyEntities(proj.team, heroes, towers, minions)

  for (const enemy of enemies) {
    if (hitSet.has(enemy.id)) continue

    const collisionDist = enemy.radius + proj.radius
    if (distanceSq(proj.x, proj.y, enemy.x, enemy.y) <= collisionDist * collisionDist) {
      // Hit!
      hitSet.add(enemy.id)
      applyDamageToTarget(enemy.id, proj.damage, heroes, towers, minions, proj.ownerId)
      events.push({ kind: 'damage', event: { targetId: enemy.id, amount: proj.damage, sourceId: proj.ownerId } })

      // Bounce takes priority over pierce
      if (proj.bounceRemaining > 0) {
        const nextTarget = findNearestUnhitHero(proj.x, proj.y, proj.team, hitSet, heroes, proj.bounceRange)
        if (nextTarget) {
          const dx = nextTarget.x - proj.x
          const dy = nextTarget.y - proj.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist === 0) {
            toRemove.push(projId)
          } else {
            proj.bounceRemaining = proj.bounceRemaining - 1
            proj.dirX = dx / dist
            proj.dirY = dy / dist
            tracker.setDistanceTraveled(projId, 0)
          }
        } else {
          toRemove.push(projId)
        }
        return
      }

      // Decrement pierce
      if (proj.pierceRemaining > 0) {
        proj.pierceRemaining = proj.pierceRemaining - 1
        if (proj.pierceRemaining <= 0) {
          toRemove.push(projId)
          return
        }
      } else {
        // pierceCount=0 means single hit
        toRemove.push(projId)
        return
      }
    }
  }
}

// ── Main entry point ───────────────────────────────────────

/**
 * Process all projectiles for one tick.
 * Supports both homing (track targetId) and linear (straight-line + pierce) modes.
 */
export function processProjectiles(
  projectiles: MapSchema<ProjectileSchema>,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  deltaTime: number,
  tracker: ProjectileTracker,
  minions?: MapSchema<MinionSchema>,
): CombatEventMessage[] {
  const events: CombatEventMessage[] = []
  const toRemove: string[] = []

  projectiles.forEach((proj, projId) => {
    if (proj.mode === 'linear') {
      processLinearProjectile(proj, projId, heroes, towers, deltaTime, minions, events, toRemove, tracker)
    } else {
      processHomingProjectile(proj, projId, heroes, towers, deltaTime, minions, events, toRemove)
    }
  })

  for (const id of toRemove) {
    projectiles.delete(id)
    tracker.cleanupTracking(id)
  }

  return events
}
