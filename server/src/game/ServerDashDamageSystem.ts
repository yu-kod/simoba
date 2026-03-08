import type { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'
import type { DamageEvent } from '@shared/messages'

/**
 * Check dash collision damage for all dashing heroes.
 * Returns DamageEvents and updates the hitSets to prevent duplicate hits.
 */
export function processDashDamage(
  heroes: MapSchema<HeroSchema>,
  minions: MapSchema<MinionSchema>,
  dashHitSets: Map<string, Set<string>>,
): DamageEvent[] {
  const events: DamageEvent[] = []

  heroes.forEach((hero, heroId) => {
    if (hero.dashTimer <= 0) return
    if (hero.dead) return

    const damage = hero.dashDamage
    if (damage <= 0) return // zero-damage dashes (e.g., escape dashes)

    // Initialize hit set for this dash if needed
    if (!dashHitSets.has(heroId)) {
      dashHitSets.set(heroId, new Set())
    }
    const hitSet = dashHitSets.get(heroId)!

    // Check enemy heroes
    heroes.forEach((target, targetId) => {
      if (targetId === heroId) return
      if (target.team === hero.team) return
      if (target.dead) return
      if (hitSet.has(targetId)) return

      if (isColliding(hero, target)) {
        target.applyDamage(damage)
        target.lastAttackerSessionId = heroId
        hitSet.add(targetId)
        events.push({ targetId, amount: damage, sourceId: heroId })
      }
    })

    // Check enemy minions
    minions.forEach((minion, minionId) => {
      if (minion.team === hero.team) return
      if (minion.dead) return
      if (hitSet.has(minionId)) return

      if (isColliding(hero, minion)) {
        minion.applyDamage(damage)
        hitSet.add(minionId)
        events.push({ targetId: minionId, amount: damage, sourceId: heroId })
      }
    })
  })

  return events
}

/**
 * Clean up hit sets for heroes that are no longer dashing.
 */
export function cleanupDashHitSets(
  heroes: MapSchema<HeroSchema>,
  dashHitSets: Map<string, Set<string>>,
): void {
  for (const [heroId] of dashHitSets) {
    const hero = heroes.get(heroId)
    if (!hero || hero.dashTimer <= 0) {
      dashHitSets.delete(heroId)
    }
  }
}

function isColliding(
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number },
): boolean {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const distSq = dx * dx + dy * dy
  const radSum = a.radius + b.radius
  return distSq <= radSum * radSum
}
