import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { StrikeEffectParams } from '@shared/skills/skillDefinitions'

export const strikeEffectHandler: SkillEffectHandler<StrikeEffectParams> = {
  effectType: 'strike',

  execute(ctx: SkillExecutionContext, params: StrikeEffectParams): void {
    const target = ctx.targetHero
    if (!target || target.dead) return

    // Execute threshold check uses pre-damage HP ratio (standard MOBA pattern)
    const hpRatio = target.maxHp > 0 ? target.hp / target.maxHp : 1
    const isExecute = params.executeThreshold != null
      && hpRatio <= params.executeThreshold

    const totalDamage = isExecute
      ? params.damage + (params.executeBonusDamage ?? 0)
      : params.damage

    target.applyDamage(totalDamage)
    target.lastAttackerSessionId = ctx.casterId
  },
}
