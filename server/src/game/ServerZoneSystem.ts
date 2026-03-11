import type { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { ZoneSchema } from '../schema/ZoneSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'
import { StatusEffectSchema } from '../schema/StatusEffectSchema.js'
import { distanceSq } from '@shared/math/distanceSq'

/** Duration set on zone-applied status effects. Short so they expire quickly when leaving the zone. */
export const ZONE_EFFECT_DURATION = 0.1

function shouldAffect(zone: ZoneSchema, hero: HeroSchema): boolean {
  if (zone.target === 'enemy') return hero.team !== zone.team
  if (zone.target === 'ally') return hero.team === zone.team
  return true // 'all'
}

/**
 * Tick all zones: decrement duration, apply effects to heroes in range, remove expired zones.
 * Supports follow zones (track caster position) and tick damage (sustained AoE).
 */
export function tickZones(
  zones: MapSchema<ZoneSchema>,
  heroes: MapSchema<HeroSchema>,
  dt: number,
  minions?: MapSchema<MinionSchema>,
): void {
  const toRemove = new Set<string>()

  zones.forEach((zone, zoneId) => {
    // Follow zone: track caster position or remove if caster is dead
    if (zone.followHeroId !== '') {
      const caster = heroes.get(zone.followHeroId)
      if (!caster || caster.dead) {
        toRemove.add(zoneId)
        return
      }
      zone.x = caster.x
      zone.y = caster.y
    }

    zone.remainingDuration -= dt

    const radiusSq = zone.radius * zone.radius

    // Tick damage timer
    let tickDamageThisTick = false
    if (zone.tickDamage > 0 && zone.tickInterval > 0) {
      zone.tickTimer -= dt
      if (zone.tickTimer <= 0) {
        tickDamageThisTick = true
        zone.tickTimer += zone.tickInterval
      }
    }

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

      // Tick damage (sustained damage zones like Whirlwind)
      if (tickDamageThisTick) {
        hero.applyDamage(zone.tickDamage)
        hero.lastAttackerSessionId = zone.casterId
      }

      // Apply or refresh status effect (skip for expired zones)
      if (zone.remainingDuration > 0) {
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
      }
    })

    // Tick damage to enemy minions
    if (tickDamageThisTick && minions) {
      minions.forEach((minion) => {
        if (minion.dead) return
        if (minion.team === zone.team) return
        const dSq = distanceSq(zone.x, zone.y, minion.x, minion.y)
        if (dSq > radiusSq) return
        minion.applyDamage(zone.tickDamage)
      })
    }

    if (triggered && zone.triggerOnce) {
      toRemove.add(zoneId)
    }

    // Remove expired zones after processing effects
    if (zone.remainingDuration <= 0) {
      toRemove.add(zoneId)
    }
  })

  toRemove.forEach((id) => zones.delete(id))
}
