import type { MapSchema } from '@colyseus/schema'
import { StatusEffectSchema } from '../schema/StatusEffectSchema.js'

interface StatusEffectTarget {
  readonly statusEffects: MapSchema<StatusEffectSchema>
}

/**
 * Apply or refresh a status effect on a target.
 * If the effect already exists, refreshes duration and value.
 * If not, creates a new StatusEffectSchema and adds it.
 */
export function applyBuff(
  target: StatusEffectTarget,
  key: string,
  buffType: string,
  value: number,
  duration: number,
  isDebuff: boolean,
): void {
  const existing = target.statusEffects.get(key)
  if (existing) {
    existing.remainingDuration = duration
    existing.value = value
  } else {
    const effect = new StatusEffectSchema()
    effect.id = key
    effect.buffType = buffType
    effect.value = value
    effect.remainingDuration = duration
    effect.isDebuff = isDebuff
    target.statusEffects.set(key, effect)
  }
}
