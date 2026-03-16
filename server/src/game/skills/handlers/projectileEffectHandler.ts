import { ProjectileSchema } from '../../../schema/ProjectileSchema.js'
import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { ProjectileEffectParams } from '@shared/skills/skillDefinitions'
import { createServerLogger } from '@shared/logging'

const logger = createServerLogger('projectile')

function createProjectile(
  ctx: SkillExecutionContext,
  params: ProjectileEffectParams,
  dirX: number,
  dirY: number,
): void {
  const { hero, casterId, projectiles, projectileTracker } = ctx

  const proj = new ProjectileSchema()
  proj.id = projectileTracker.nextSkillProjectileId()
  proj.x = hero.x
  proj.y = hero.y
  proj.speed = params.speed
  proj.damage = params.damage
  proj.ownerId = casterId
  proj.team = hero.team

  if (params.homing) {
    throw new Error('Homing skill projectiles are not yet implemented — targetId resolution is required')
  } else {
    proj.mode = 'linear'
    proj.dirX = dirX
    proj.dirY = dirY
  }

  proj.radius = params.radius
  proj.maxRange = params.range
  proj.pierceRemaining = params.pierceCount
  proj.visualType = params.visualType
  proj.bounceRemaining = params.bounceCount ?? 0
  proj.bounceRange = params.bounceRange ?? 0
  if (proj.bounceRemaining > 0 && proj.bounceRange <= 0) {
    logger.warn('bounceCount set but bounceRange is 0 or missing — projectile will never bounce', { bounceCount: params.bounceCount })
  }

  projectiles.set(proj.id, proj)
}

export const projectileEffectHandler: SkillEffectHandler<ProjectileEffectParams> = {
  effectType: 'projectile',
  execute(ctx: SkillExecutionContext, params: ProjectileEffectParams): void {
    const count = params.projectileCount ?? 1
    if (count <= 0) return

    if (count === 1) {
      createProjectile(ctx, params, ctx.direction.x, ctx.direction.y)
      return
    }

    // Multi-projectile: fan spread centered on cursor direction
    const totalSpread = params.spreadAngle ?? 0
    if (totalSpread === 0) {
      logger.warn('projectileCount > 1 but spreadAngle is 0 — all projectiles will overlap', { projectileCount: count })
    }
    const baseAngle = Math.atan2(ctx.direction.y, ctx.direction.x)

    for (let i = 0; i < count; i++) {
      // Distribute evenly across spreadAngle: -half to +half
      const offset = -totalSpread / 2 + (totalSpread / (count - 1)) * i
      const angle = baseAngle + offset
      const dirX = Math.cos(angle)
      const dirY = Math.sin(angle)
      createProjectile(ctx, params, dirX, dirY)
    }
  },
}
