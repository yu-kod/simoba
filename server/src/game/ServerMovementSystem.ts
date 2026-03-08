import { WORLD_WIDTH, WORLD_HEIGHT } from '@shared/constants'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { InputMessage } from '@shared/messages'

/**
 * Server-side movement system.
 * Applies moveDir input to hero position with map boundary clamping.
 * Movement is suppressed during dash (dashTimer > 0) or ranged attack pause.
 */
export function processMovement(
  hero: HeroSchema,
  input: InputMessage | undefined,
  deltaTime: number
): void {
  if (hero.dead) return

  // Dash movement takes priority over all other movement
  if (hero.dashTimer > 0) {
    processDashMovement(hero, deltaTime)
    return
  }

  if (!input) return

  // Always apply facing from input (attack facing must sync even when stationary)
  hero.facing = input.facing

  // Tick down attack pause timer
  if (hero.attackPauseTimer > 0) {
    hero.attackPauseTimer = Math.max(0, hero.attackPauseTimer - deltaTime)
    return // Suppress movement during ranged attack pause
  }

  const { moveDir } = input

  if (moveDir.x === 0 && moveDir.y === 0) return

  // Normalize direction to prevent faster diagonal movement
  const len = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y)
  if (len === 0) return

  const nx = moveDir.x / len
  const ny = moveDir.y / len

  hero.x = clamp(hero.x + nx * hero.speed * deltaTime, 0, WORLD_WIDTH)
  hero.y = clamp(hero.y + ny * hero.speed * deltaTime, 0, WORLD_HEIGHT)
}

/**
 * Process dash movement: move hero along dash direction, decrement timer, clamp to world.
 */
function processDashMovement(hero: HeroSchema, deltaTime: number): void {
  const dt = Math.min(deltaTime, hero.dashTimer)
  hero.x = clamp(hero.x + hero.dashDirX * hero.dashSpeed * dt, 0, WORLD_WIDTH)
  hero.y = clamp(hero.y + hero.dashDirY * hero.dashSpeed * dt, 0, WORLD_HEIGHT)
  hero.dashTimer = Math.max(0, hero.dashTimer - deltaTime)

  // Clean up dash state when dash ends
  if (hero.dashTimer <= 0) {
    hero.dashDirX = 0
    hero.dashDirY = 0
    hero.dashSpeed = 0
    hero.dashDamage = 0
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
