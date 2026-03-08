import type { SkillEffectHandler } from './SkillEffectHandler.js'

const registry = new Map<string, SkillEffectHandler>()

export function registerEffectHandler(handler: SkillEffectHandler): void {
  if (registry.has(handler.effectType)) {
    throw new Error(`Duplicate effect handler for type: ${handler.effectType}`)
  }
  registry.set(handler.effectType, handler)
}

export function getEffectHandler(effectType: string): SkillEffectHandler | undefined {
  return registry.get(effectType)
}

/** Reset the registry (for testing). */
export function clearEffectRegistry(): void {
  registry.clear()
}
