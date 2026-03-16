import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { ZoneEffectParams } from '@shared/skills/skillDefinitions'
import { ZoneSchema } from '../../../schema/ZoneSchema.js'
import { StatusEffectSchema } from '../../../schema/StatusEffectSchema.js'

export const zoneEffectHandler: SkillEffectHandler<ZoneEffectParams> = {
  effectType: 'zone',

  execute(ctx: SkillExecutionContext, params: ZoneEffectParams): void {
    const zone = new ZoneSchema()

    // For follow zones, center on caster position instead of target
    if (params.followCaster) {
      zone.x = ctx.hero.x
      zone.y = ctx.hero.y
      zone.followHeroId = ctx.casterId
    } else {
      zone.x = ctx.targetPosition.x
      zone.y = ctx.targetPosition.y
    }

    zone.radius = params.zoneRadius
    zone.remainingDuration = params.zoneDuration
    zone.team = ctx.hero.team
    zone.casterId = ctx.casterId
    zone.skillId = ctx.skillId
    zone.buffType = params.zoneEffect.buffType
    zone.value = params.zoneEffect.value
    zone.isDebuff = params.zoneEffect.isDebuff
    zone.target = params.zoneEffect.target
    zone.triggerDamage = params.triggerDamage ?? 0
    zone.triggerOnce = params.triggerOnce ?? false
    zone.effectDuration = params.zoneEffect.duration ?? 0
    zone.tickDamage = params.tickDamage ?? 0
    zone.tickHeal = params.tickHeal ?? 0
    zone.tickInterval = params.tickInterval ?? 0
    zone.tickTimer = 0 // first tick fires immediately

    const id = ctx.projectileTracker.nextZoneId()
    ctx.zones.set(id, zone)

    // Apply self-debuff to caster (e.g. Whirlwind slows the caster)
    if (params.selfEffect) {
      const effectKey = ctx.skillId
      const existing = ctx.hero.statusEffects.get(effectKey)
      if (existing) {
        existing.remainingDuration = params.selfEffect.duration
      } else {
        const effect = new StatusEffectSchema()
        effect.id = effectKey
        effect.buffType = params.selfEffect.buffType
        effect.value = params.selfEffect.value
        effect.remainingDuration = params.selfEffect.duration
        effect.isDebuff = true
        ctx.hero.statusEffects.set(effectKey, effect)
      }
    }
  },
}
