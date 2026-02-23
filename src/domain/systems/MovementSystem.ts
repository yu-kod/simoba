import type { Position } from '@/domain/types'
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/domain/constants'

export function clampToWorld(
  position: Position,
  radius: number
): Position {
  return {
    x: Math.max(radius, Math.min(WORLD_WIDTH - radius, position.x)),
    y: Math.max(radius, Math.min(WORLD_HEIGHT - radius, position.y)),
  }
}

export function move(
  current: Position,
  direction: Position,
  speed: number,
  delta: number,
  radius: number = 0
): Position {
  const next: Position = {
    x: current.x + direction.x * speed * delta,
    y: current.y + direction.y * speed * delta,
  }
  return radius > 0 ? clampToWorld(next, radius) : next
}
