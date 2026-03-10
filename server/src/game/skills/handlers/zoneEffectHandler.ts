import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { ZoneEffectParams } from '@shared/skills/skillDefinitions'
import { ZoneSchema } from '../../../schema/ZoneSchema.js'

export const zoneEffectHandler: SkillEffectHandler<ZoneEffectParams> = {
  effectType: 'zone',

  execute(ctx: SkillExecutionContext, params: ZoneEffectParams): void {
    const zone = new ZoneSchema()
    zone.x = ctx.targetPosition.x
    zone.y = ctx.targetPosition.y
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

    const id = ctx.projectileTracker.nextZoneId()
    ctx.zones.set(id, zone)
  },
}
