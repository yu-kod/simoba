import { MapSchema } from '@colyseus/schema'
import { isInAttackRange } from '@shared/combat'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'

let towerProjectileIdCounter = 0

export function resetTowerProjectileIdCounter(): void {
  towerProjectileIdCounter = 0
}

/**
 * Select the nearest alive enemy hero within the tower's attack range.
 * Towers only target heroes, not other towers.
 */
function selectNearestEnemy(
  tower: TowerSchema,
  heroes: MapSchema<HeroSchema>
): { id: string; x: number; y: number; radius: number } | null {
  let bestId: string | null = null
  let bestX = 0
  let bestY = 0
  let bestRadius = 0
  let bestDistSq = Infinity

  heroes.forEach((hero, heroId) => {
    if (hero.dead || hero.hp <= 0) return
    if (hero.team === tower.team) return

    const dx = hero.x - tower.x
    const dy = hero.y - tower.y
    const distSq = dx * dx + dy * dy

    if (distSq < bestDistSq) {
      // Check range using isInAttackRange for consistency
      const inRange = isInAttackRange(
        { x: tower.x, y: tower.y },
        { x: hero.x, y: hero.y },
        tower.radius,
        hero.radius,
        tower.attackRange
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
 */
export function processTowerCombat(
  tower: TowerSchema,
  towerId: string,
  heroes: MapSchema<HeroSchema>,
  projectiles: MapSchema<ProjectileSchema>,
  ProjectileSchemaClass: new () => ProjectileSchema,
  deltaTime: number
): void {
  if (tower.dead) {
    tower.attackTargetId = ''
    tower.attackCooldown = 0
    return
  }

  // Reduce cooldown
  if (tower.attackCooldown > 0) {
    tower.attackCooldown = Math.max(0, tower.attackCooldown - deltaTime)
  }

  // Auto-select nearest enemy target
  const target = selectNearestEnemy(tower, heroes)
  if (!target) {
    tower.attackTargetId = ''
    return
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
    proj.speed = tower.projectileSpeed
    proj.damage = tower.attackDamage
    proj.ownerId = towerId
    proj.team = tower.team
    projectiles.set(proj.id, proj)
  }
}
