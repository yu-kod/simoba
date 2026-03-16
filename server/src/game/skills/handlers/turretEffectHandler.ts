import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { TurretEffectParams } from '@shared/skills/skillDefinitions'
import { TowerSchema } from '../../../schema/TowerSchema.js'

export const turretEffectHandler: SkillEffectHandler<TurretEffectParams> = {
  effectType: 'turret',

  execute(ctx: SkillExecutionContext, params: TurretEffectParams): void {
    const turret = new TowerSchema()
    turret.id = ctx.projectileTracker.nextTurretId()
    turret.x = ctx.targetPosition.x
    turret.y = ctx.targetPosition.y
    turret.hp = params.hp
    turret.maxHp = params.hp
    turret.team = ctx.hero.team
    turret.radius = params.radius
    turret.attackDamage = params.attackDamage
    turret.attackSpeed = params.attackSpeed
    turret.attackRange = params.attackRange
    turret.projectileSpeed = params.projectileSpeed
    turret.projectileRadius = params.projectileRadius
    turret.remainingDuration = params.duration
    turret.ownerId = ctx.casterId

    ctx.towers.set(turret.id, turret)
  },
}
