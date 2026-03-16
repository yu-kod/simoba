import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { BuffEffectParams } from '@shared/skills/skillDefinitions'
import { applyBuff } from '../../statusEffectUtils.js'

export const buffEffectHandler: SkillEffectHandler<BuffEffectParams> = {
  effectType: 'buff',

  execute(ctx: SkillExecutionContext, params: BuffEffectParams): void {
    const target = ctx.targetHero ?? ctx.hero

    // Apply primary buff keyed by skillId
    applyBuff(target, ctx.skillId, params.buffType, params.value, params.duration, params.isDebuff)

    // Apply additional buffs keyed by ${skillId}:${buffType}
    if (params.additionalBuffs) {
      for (const extra of params.additionalBuffs) {
        const key = `${ctx.skillId}:${extra.buffType}`
        applyBuff(target, key, extra.buffType, extra.value, params.duration, extra.isDebuff ?? params.isDebuff)
      }
    }
  },
}
