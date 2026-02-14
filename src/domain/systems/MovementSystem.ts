import type { Position } from '@/domain/types'

export function move(
  current: Position,
  direction: Position,
  speed: number,
  delta: number
): Position {
  return {
    x: current.x + direction.x * speed * delta,
    y: current.y + direction.y * speed * delta,
  }
}
