import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { AoEEffectParams } from '@shared/skills/skillDefinitions'
import { distanceSq } from '@shared/math/distanceSq'

export const aoeEffectHandler: SkillEffectHandler<AoEEffectParams> = {
  effectType: 'aoe',

  execute(ctx: SkillExecutionContext, params: AoEEffectParams): void {
    const { hero, casterId, targetPosition, heroes } = ctx
    const radiusSq = params.radius * params.radius

    heroes.forEach((candidate) => {
      if (candidate.dead) return

      const dSq = distanceSq(targetPosition.x, targetPosition.y, candidate.x, candidate.y)
      if (dSq > radiusSq) return

      if (candidate.team === hero.team) {
        candidate.applyHeal(params.healAmount)
      } else {
        candidate.applyDamage(params.damage)
        candidate.lastAttackerSessionId = casterId
      }
    })
  },
}
