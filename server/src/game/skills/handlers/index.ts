import { registerEffectHandler, clearEffectRegistry } from '../skillEffectRegistry.js'
import { dashEffectHandler } from './dashEffectHandler.js'
import { projectileEffectHandler } from './projectileEffectHandler.js'

let registered = false

/** Register all built-in effect handlers. Idempotent. */
export function registerAllEffectHandlers(): void {
  if (registered) return
  registered = true
  registerEffectHandler(dashEffectHandler)
  registerEffectHandler(projectileEffectHandler)
}

/** Reset registration state and clear registry. For testing only. */
export function resetEffectHandlers(): void {
  registered = false
  clearEffectRegistry()
}
