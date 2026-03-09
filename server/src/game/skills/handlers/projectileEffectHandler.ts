import { ProjectileSchema } from '../../../schema/ProjectileSchema.js'
import type { SkillEffectHandler, SkillExecutionContext } from '../SkillEffectHandler.js'
import type { ProjectileEffectParams } from '@shared/skills/skillDefinitions'

let skillProjectileIdCounter = 0

export function resetSkillProjectileIdCounter(): void {
  skillProjectileIdCounter = 0
}

export const projectileEffectHandler: SkillEffectHandler<ProjectileEffectParams> = {
  effectType: 'projectile',
  execute(ctx: SkillExecutionContext, params: ProjectileEffectParams): void {
    const { hero, casterId, direction, projectiles } = ctx

    const proj = new ProjectileSchema()
    proj.id = `skill-proj-${++skillProjectileIdCounter}`
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
      proj.dirX = direction.x
      proj.dirY = direction.y
    }

    proj.radius = params.radius
    proj.maxRange = params.range
    proj.pierceRemaining = params.pierceCount
    proj.visualType = params.visualType

    projectiles.set(proj.id, proj)
  },
}
