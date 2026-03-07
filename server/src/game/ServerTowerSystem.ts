import { MapSchema } from '@colyseus/schema'
import { isInAttackRange } from '@shared/combat'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'
import type { CombatEventMessage } from '@shared/messages'

let towerProjectileIdCounter = 0

export function resetTowerProjectileIdCounter(): void {
  towerProjectileIdCounter = 0
}

/**
 * Select the nearest alive enemy (minion or hero) within the tower's attack range.
 * Priority: minion > hero (towers don't target other towers).
 */
function selectNearestEnemy(
  tower: TowerSchema,
  heroes: MapSchema<HeroSchema>,
  minions?: MapSchema<MinionSchema>,
): { id: string; x: number; y: number; radius: number } | null {
  let bestId: string | null = null
  let bestX = 0
  let bestY = 0
  let bestRadius = 0
  let bestDistSq = Infinity

  // Check minions first (higher priority)
  if (minions) {
    minions.forEach((m, minionId) => {
      if (m.dead) return
      if (m.team === tower.team) return

      const dx = m.x - tower.x
      const dy = m.y - tower.y
      const distSq = dx * dx + dy * dy

      if (distSq < bestDistSq) {
        const inRange = isInAttackRange(
          { x: tower.x, y: tower.y },
          { x: m.x, y: m.y },
          tower.radius,
          m.radius,
          tower.attackRange,
        )
        if (inRange) {
          bestDistSq = distSq
          bestId = minionId
          bestX = m.x
          bestY = m.y
          bestRadius = m.radius
        }
      }
    })

    // If minion found, return it (priority over heroes)
    if (bestId !== null) {
      return { id: bestId, x: bestX, y: bestY, radius: bestRadius }
    }
  }

  // Then check heroes
  heroes.forEach((hero, heroId) => {
    if (hero.dead) return
    if (hero.team === tower.team) return

    const dx = hero.x - tower.x
    const dy = hero.y - tower.y
    const distSq = dx * dx + dy * dy

    if (distSq < bestDistSq) {
      const inRange = isInAttackRange(
        { x: tower.x, y: tower.y },
        { x: hero.x, y: hero.y },
        tower.radius,
        hero.radius,
        tower.attackRange,
      )
      if (inRange) {
        bestDistSq = distSq
        bestId = heroId
        bestX = hero.x
        bestY = hero.y
        bestRadius = hero.radius
      }
    }
  })

  if (bestId === null) return null
  return { id: bestId, x: bestX, y: bestY, radius: bestRadius }
}

/**
 * Process a single tower's attack logic for one tick.
 * Handles auto-targeting, cooldown management, and projectile spawning.
 * Returns combat events for broadcasting to clients.
 */
export function processTowerCombat(
  tower: TowerSchema,
  towerId: string,
  heroes: MapSchema<HeroSchema>,
  projectiles: MapSchema<ProjectileSchema>,
  ProjectileSchemaClass: new () => ProjectileSchema,
  deltaTime: number,
  minions?: MapSchema<MinionSchema>,
): CombatEventMessage[] {
  const events: CombatEventMessage[] = []

  if (tower.dead) {
    tower.attackTargetId = ''
    tower.attackCooldown = 0
    return events
  }

  // Reduce cooldown
  if (tower.attackCooldown > 0) {
    tower.attackCooldown = Math.max(0, tower.attackCooldown - deltaTime)
  }

  // Auto-select nearest enemy target (minions > heroes)
  const target = selectNearestEnemy(tower, heroes, minions)
  if (!target) {
    tower.attackTargetId = ''
    return events
  }

  tower.attackTargetId = target.id

  // Fire if cooldown ready
  if (tower.attackCooldown <= 0) {
    tower.attackCooldown = 1 / tower.attackSpeed

    // Towers always use projectiles
    const proj = new ProjectileSchemaClass()
    proj.id = `tower-proj-${++towerProjectileIdCounter}`
    proj.x = tower.x
    proj.y = tower.y
    proj.targetX = target.x
    proj.targetY = target.y
    proj.targetId = target.id
    proj.speed = tower.projectileSpeed
    proj.damage = tower.attackDamage
    proj.ownerId = towerId
    proj.team = tower.team
    projectiles.set(proj.id, proj)

    events.push({
      kind: 'attack',
      event: {
        attackerId: towerId,
        targetId: target.id,
        attackType: 'ranged',
        position: { x: tower.x, y: tower.y },
        facing: Math.atan2(target.y - tower.y, target.x - tower.x),
      },
    })
  }

  return events
}
