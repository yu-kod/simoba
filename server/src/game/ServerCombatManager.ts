import { MapSchema } from '@colyseus/schema'
import { isInAttackRange } from '@shared/combat'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import type { HeroType } from '@shared/types'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'
import type { InputMessage } from '@shared/messages'
import { applyDamageToTarget } from './combatUtils.js'

let projectileIdCounter = 0

export function resetProjectileIdCounter(): void {
  projectileIdCounter = 0
}

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
  towers: MapSchema<TowerSchema>
): CombatTarget | null {
  const hero = heroes.get(targetId)
  if (hero) return { id: targetId, x: hero.x, y: hero.y, hp: hero.hp, dead: hero.dead, radius: hero.radius, team: hero.team }
  const tower = towers.get(targetId)
  if (tower) return { id: targetId, x: tower.x, y: tower.y, hp: tower.hp, dead: tower.dead, radius: tower.radius, team: tower.team }
  return null
}

/**
 * Process hero attack logic for one tick.
 * Handles cooldown, target validation, melee damage, and projectile spawning.
 */
export function processHeroCombat(
  hero: HeroSchema,
  heroId: string,
  input: InputMessage | undefined,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  projectiles: MapSchema<ProjectileSchema>,
  ProjectileSchemaClass: new () => ProjectileSchema,
  deltaTime: number
): void {
  if (hero.dead) {
    hero.attackTargetId = ''
    hero.attackCooldown = 0
    return
  }

  // Reduce cooldown
  if (hero.attackCooldown > 0) {
    hero.attackCooldown = Math.max(0, hero.attackCooldown - deltaTime)
  }

  // Update attack target from input
  const requestedTarget = input?.attackTargetId ?? null
  if (requestedTarget) {
    const target = findTarget(requestedTarget, heroes, towers)
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
    const target = findTarget(hero.attackTargetId, heroes, towers)
    if (!target || target.dead) {
      hero.attackTargetId = ''
      return
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
      return
    }

    // Reset cooldown
    hero.attackCooldown = 1 / hero.attackSpeed

    const heroType = hero.heroType as HeroType
    const def = HERO_DEFINITIONS[heroType]

    if (def.projectileSpeed === 0) {
      // Melee: immediate damage
      applyDamageToTarget(hero.attackTargetId, hero.attackDamage, heroes, towers)
    } else {
      // Ranged: spawn projectile
      const proj = new ProjectileSchemaClass()
      proj.id = `proj-${++projectileIdCounter}`
      proj.x = hero.x
      proj.y = hero.y
      proj.targetX = target.x
      proj.targetY = target.y
      proj.speed = def.projectileSpeed
      proj.damage = hero.attackDamage
      proj.ownerId = heroId
      proj.team = hero.team
      projectiles.set(proj.id, proj)
    }
  }
}
