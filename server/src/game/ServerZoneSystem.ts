import type { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { ZoneSchema } from '../schema/ZoneSchema.js'
import { StatusEffectSchema } from '../schema/StatusEffectSchema.js'

/** Duration set on zone-applied status effects. Short so they expire quickly when leaving the zone. */
const ZONE_EFFECT_DURATION = 0.1

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

    heroes.forEach((hero) => {
      if (hero.dead) return
      if (!shouldAffect(zone, hero)) return

      const dSq = distanceSq(zone.x, zone.y, hero.x, hero.y)
      if (dSq > radiusSq) return

      // Apply or refresh status effect
      const effectKey = zoneId
      const existing = hero.statusEffects.get(effectKey)
      if (existing) {
        existing.remainingDuration = ZONE_EFFECT_DURATION
      } else {
        const effect = new StatusEffectSchema()
        effect.id = effectKey
        effect.buffType = zone.buffType
        effect.value = zone.value
        effect.remainingDuration = ZONE_EFFECT_DURATION
        effect.isDebuff = zone.isDebuff
        hero.statusEffects.set(effectKey, effect)
      }
    })
  })

  for (const id of toRemove) {
    zones.delete(id)
  }
}
