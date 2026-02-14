import { move, clampToWorld } from '@/domain/systems/MovementSystem'
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/domain/constants'
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

    it('should clamp to world bounds when radius is provided', () => {
      const nearEdge: Position = { x: WORLD_WIDTH - 5, y: 360 }
      const result = move(nearEdge, { x: 1, y: 0 }, 200, 1, 20)

      expect(result.x).toBe(WORLD_WIDTH - 20)
    })

    it('should not clamp when radius is 0 (default)', () => {
      const farRight: Position = { x: WORLD_WIDTH - 5, y: 360 }
      const result = move(farRight, { x: 1, y: 0 }, 200, 1)

      expect(result.x).toBeGreaterThan(WORLD_WIDTH)
    })
  })

  describe('clampToWorld', () => {
    const radius = 20

    it('should be referentially transparent', () => {
      const pos: Position = { x: -10, y: 500 }
      const result1 = clampToWorld(pos, radius)
      const result2 = clampToWorld(pos, radius)

      expect(result1).toEqual(result2)
    })

    it('should not mutate the original position', () => {
      const pos: Position = { x: -10, y: -10 }
      clampToWorld(pos, radius)

      expect(pos.x).toBe(-10)
      expect(pos.y).toBe(-10)
    })

    it('should clamp x below minimum to radius', () => {
      const result = clampToWorld({ x: -50, y: 360 }, radius)

      expect(result.x).toBe(radius)
    })

    it('should clamp x above maximum to WORLD_WIDTH - radius', () => {
      const result = clampToWorld({ x: 5000, y: 360 }, radius)

      expect(result.x).toBe(WORLD_WIDTH - radius)
    })

    it('should clamp y below minimum to radius', () => {
      const result = clampToWorld({ x: 100, y: -50 }, radius)

      expect(result.y).toBe(radius)
    })

    it('should clamp y above maximum to WORLD_HEIGHT - radius', () => {
      const result = clampToWorld({ x: 100, y: 1000 }, radius)

      expect(result.y).toBe(WORLD_HEIGHT - radius)
    })

    it('should not modify position already within bounds', () => {
      const pos: Position = { x: 500, y: 360 }
      const result = clampToWorld(pos, radius)

      expect(result).toEqual(pos)
    })

    it('should clamp both axes simultaneously', () => {
      const result = clampToWorld({ x: -100, y: 9999 }, radius)

      expect(result.x).toBe(radius)
      expect(result.y).toBe(WORLD_HEIGHT - radius)
    })

    it('should handle radius equal to half world height', () => {
      const halfHeight = WORLD_HEIGHT / 2
      const center: Position = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }
      const result = clampToWorld(center, halfHeight)

      expect(result.x).toBe(WORLD_WIDTH / 2)
      expect(result.y).toBe(WORLD_HEIGHT / 2)
    })
  })
})
