import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { DashEffectParams } from '@shared/skills/skillDefinitions'

export const dashEffectHandler: SkillEffectHandler<DashEffectParams> = {
  effectType: 'dash',
  execute(ctx: SkillExecutionContext, params: DashEffectParams): void {
    const { hero, direction } = ctx
    hero.dashTimer = params.duration
    hero.dashDirX = direction.x
    hero.dashDirY = direction.y
    hero.dashSpeed = params.distance / params.duration
    hero.dashDamage = params.damage
    hero.dashInvulnerable = params.invulnerable ?? false
    hero.facing = Math.atan2(direction.y, direction.x)
  },
}
