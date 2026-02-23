import type { Position } from '@/domain/types'

export function computeAimDirection(
  heroPosition: Position,
  mouseWorldPosition: Position
): Position {
  const dx = mouseWorldPosition.x - heroPosition.x
  const dy = mouseWorldPosition.y - heroPosition.y
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length === 0) {
    return { x: 0, y: 0 }
  }

  return { x: dx / length, y: dy / length }
}
