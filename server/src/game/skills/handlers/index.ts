import { registerEffectHandler, clearEffectRegistry } from '../skillEffectRegistry.js'
import { dashEffectHandler } from './dashEffectHandler.js'
import { projectileEffectHandler } from './projectileEffectHandler.js'
import { healEffectHandler } from './healEffectHandler.js'
import { buffEffectHandler } from './buffEffectHandler.js'
import { aoeEffectHandler } from './aoeEffectHandler.js'
import { zoneEffectHandler } from './zoneEffectHandler.js'
import { strikeEffectHandler } from './strikeEffectHandler.js'
import { turretEffectHandler } from './turretEffectHandler.js'

let registered = false

/** Register all built-in effect handlers. Idempotent. */
export function registerAllEffectHandlers(): void {
  if (registered) return
  registered = true
  registerEffectHandler(dashEffectHandler)
  registerEffectHandler(projectileEffectHandler)
  registerEffectHandler(healEffectHandler)
  registerEffectHandler(buffEffectHandler)
  registerEffectHandler(aoeEffectHandler)
  registerEffectHandler(zoneEffectHandler)
  registerEffectHandler(strikeEffectHandler)
  registerEffectHandler(turretEffectHandler)
}

/** Reset registration state and clear registry. For testing only. */
export function resetEffectHandlers(): void {
  registered = false
  clearEffectRegistry()
}
