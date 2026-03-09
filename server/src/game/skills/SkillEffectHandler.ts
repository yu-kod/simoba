import type { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../../schema/HeroSchema.js'
import type { ProjectileSchema } from '../../schema/ProjectileSchema.js'
import type { SkillEffectParams } from '@shared/skills/skillDefinitions'

/** Context passed to every effect handler at execution time. */
export interface SkillExecutionContext {
  readonly hero: HeroSchema
  readonly casterId: string
  readonly direction: { readonly x: number; readonly y: number }
  readonly targetPosition: { readonly x: number; readonly y: number }
  readonly projectiles: MapSchema<ProjectileSchema>
}

/** Every effect type implements this interface. */
export interface SkillEffectHandler<P extends SkillEffectParams = SkillEffectParams> {
  readonly effectType: P['effectType']
  execute(ctx: SkillExecutionContext, params: P): void
}
