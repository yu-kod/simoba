import { WORLD_WIDTH, WORLD_HEIGHT } from '@shared/constants'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { InputMessage } from '@shared/messages'

/**
 * Server-side movement system.
 * Applies moveDir input to hero position with map boundary clamping.
 */
export function processMovement(
  hero: HeroSchema,
  input: InputMessage | undefined,
  deltaTime: number
): void {
  if (hero.dead) return
  if (!input) return

  const { moveDir } = input

  if (moveDir.x === 0 && moveDir.y === 0) return

  // Normalize direction to prevent faster diagonal movement
  const len = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y)
  if (len === 0) return

  const nx = moveDir.x / len
  const ny = moveDir.y / len

  hero.x = clamp(hero.x + nx * hero.speed * deltaTime, 0, WORLD_WIDTH)
  hero.y = clamp(hero.y + ny * hero.speed * deltaTime, 0, WORLD_HEIGHT)

  // Apply facing from input
  hero.facing = input.facing
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
