import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { AoEEffectParams } from '@shared/skills/skillDefinitions'

function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

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
