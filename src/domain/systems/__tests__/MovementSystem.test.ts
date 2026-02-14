import { move } from '@/domain/systems/MovementSystem'
import type { Position } from '@/domain/types'

describe('MovementSystem', () => {
  describe('move', () => {
    const origin: Position = { x: 100, y: 200 }

    it('should return a new position based on direction, speed, and delta', () => {
      const result = move(origin, { x: 1, y: 0 }, 200, 0.016)

      expect(result.x).toBeCloseTo(103.2)
      expect(result.y).toBe(200)
    })

    it('should be referentially transparent (same input → same output)', () => {
      const result1 = move(origin, { x: 1, y: -1 }, 100, 0.5)
      const result2 = move(origin, { x: 1, y: -1 }, 100, 0.5)

      expect(result1).toEqual(result2)
    })

    it('should not mutate the original position', () => {
      const original: Position = { x: 50, y: 50 }
      move(original, { x: 1, y: 1 }, 200, 1)

      expect(original.x).toBe(50)
      expect(original.y).toBe(50)
    })

    it('should scale movement proportionally to delta', () => {
      const halfDelta = move(origin, { x: 1, y: 0 }, 200, 0.5)
      const fullDelta = move(origin, { x: 1, y: 0 }, 200, 1.0)

      const halfDisplacement = halfDelta.x - origin.x
      const fullDisplacement = fullDelta.x - origin.x

      expect(fullDisplacement).toBeCloseTo(halfDisplacement * 2)
    })

    it('should not move when direction is zero', () => {
      const result = move(origin, { x: 0, y: 0 }, 200, 1)

      expect(result).toEqual(origin)
    })

    it('should handle negative directions', () => {
      const result = move(origin, { x: -1, y: -1 }, 100, 1)

      expect(result.x).toBe(0)
      expect(result.y).toBe(100)
    })
  })
})
