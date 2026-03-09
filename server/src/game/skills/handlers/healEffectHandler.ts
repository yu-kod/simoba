import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { HealEffectParams } from '@shared/skills/skillDefinitions'

export const healEffectHandler: SkillEffectHandler<HealEffectParams> = {
  effectType: 'heal',

  execute(ctx: SkillExecutionContext, params: HealEffectParams): void {
    const target = ctx.targetHero ?? ctx.hero
    target.applyHeal(params.healAmount)
  },
}
