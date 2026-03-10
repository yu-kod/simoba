import type { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { ZoneSchema } from '../schema/ZoneSchema.js'
import { StatusEffectSchema } from '../schema/StatusEffectSchema.js'

/** Duration set on zone-applied status effects. Short so they expire quickly when leaving the zone. */
export const ZONE_EFFECT_DURATION = 0.1

function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

function shouldAffect(zone: ZoneSchema, hero: HeroSchema): boolean {
  if (zone.target === 'enemy') return hero.team !== zone.team
  if (zone.target === 'ally') return hero.team === zone.team
  return true // 'all'
}

/**
 * Tick all zones: decrement duration, apply effects to heroes in range, remove expired zones.
 */
export function tickZones(
  zones: MapSchema<ZoneSchema>,
  heroes: MapSchema<HeroSchema>,
  dt: number,
): void {
  const toRemove: string[] = []

  zones.forEach((zone, zoneId) => {
    zone.remainingDuration -= dt
    if (zone.remainingDuration <= 0) {
      toRemove.push(zoneId)
      return
    }

    const radiusSq = zone.radius * zone.radius

    let triggered = false

    heroes.forEach((hero) => {
      if (hero.dead) return
      if (!shouldAffect(zone, hero)) return
      if (triggered && zone.triggerOnce) return

      const dSq = distanceSq(zone.x, zone.y, hero.x, hero.y)
      if (dSq > radiusSq) return

      triggered = true

      // Trigger damage (one-shot zones like traps)
      if (zone.triggerDamage > 0) {
        hero.applyDamage(zone.triggerDamage)
        hero.lastAttackerSessionId = zone.casterId
      }

      // Apply or refresh status effect
      const effectKey = zoneId
      const effectDuration = zone.effectDuration > 0 ? zone.effectDuration : ZONE_EFFECT_DURATION
      const existing = hero.statusEffects.get(effectKey)
      if (existing) {
        existing.remainingDuration = effectDuration
      } else {
        const effect = new StatusEffectSchema()
        effect.id = effectKey
        effect.buffType = zone.buffType
        effect.value = zone.value
        effect.remainingDuration = effectDuration
        effect.isDebuff = zone.isDebuff
        hero.statusEffects.set(effectKey, effect)
      }
    })

    if (triggered && zone.triggerOnce) {
      toRemove.push(zoneId)
    }
  })

  for (const id of toRemove) {
    zones.delete(id)
  }
}
