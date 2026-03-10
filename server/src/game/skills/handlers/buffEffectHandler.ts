import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { BuffEffectParams } from '@shared/skills/skillDefinitions'
import { StatusEffectSchema } from '../../../schema/StatusEffectSchema.js'

export const buffEffectHandler: SkillEffectHandler<BuffEffectParams> = {
  effectType: 'buff',

  execute(ctx: SkillExecutionContext, params: BuffEffectParams): void {
    const target = ctx.targetHero ?? ctx.hero

    const existing = target.statusEffects.get(ctx.skillId)
    if (existing) {
      // Refresh: overwrite duration and value
      existing.remainingDuration = params.duration
      existing.value = params.value
    } else {
      const effect = new StatusEffectSchema()
      effect.id = ctx.skillId
      effect.buffType = params.buffType
      effect.value = params.value
      effect.remainingDuration = params.duration
      effect.isDebuff = params.isDebuff
      target.statusEffects.set(ctx.skillId, effect)
    }
  },
}
