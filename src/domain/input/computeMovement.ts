import type { Position } from '@/domain/types'
import type { WASDKeys } from '@/domain/input/InputState'

export function computeMovement(keys: WASDKeys): Position {
  let x = 0
  let y = 0

  if (keys.a) x -= 1
  if (keys.d) x += 1
  if (keys.w) y -= 1
  if (keys.s) y += 1

  if (x !== 0 && y !== 0) {
    const length = Math.sqrt(x * x + y * y)
    return { x: x / length, y: y / length }
  }

  return { x, y }
}
