import { describe, it, expect, beforeEach } from 'vitest'
import { MovementPredictor } from '@/network/MovementPredictor'
import type { InputMessage } from '@shared/messages'

function createMoveInput(seq: number, dx: number, dy: number): InputMessage {
  return {
    seq,
    moveDir: { x: dx, y: dy },
    attackTargetId: null,
    facing: 0,
  }
}

describe('MovementPredictor', () => {
  let predictor: MovementPredictor

  beforeEach(() => {
    predictor = new MovementPredictor()
  })

  describe('setPosition', () => {
    it('should set initial position', () => {
      predictor.setPosition(100, 200)
      expect(predictor.position).toEqual({ x: 100, y: 200 })
    })
  })

  describe('applyInput', () => {
    it('should move in input direction', () => {
      predictor.setPosition(100, 100)
      const result = predictor.applyInput(
        createMoveInput(1, 1, 0),
        100, // speed
        1    // deltaTime
      )
      expect(result.x).toBeCloseTo(200)
      expect(result.y).toBeCloseTo(100)
    })

    it('should normalize diagonal movement', () => {
      predictor.setPosition(100, 100)
      const result = predictor.applyInput(
        createMoveInput(1, 1, 1),
        100,
        1
      )
      // Diagonal movement should be normalized (sqrt(2)/2 * 100 ≈ 70.71)
      const expectedDist = 100 * Math.SQRT1_2
      expect(result.x).toBeCloseTo(100 + expectedDist)
      expect(result.y).toBeCloseTo(100 + expectedDist)
    })

    it('should not move when moveDir is zero', () => {
      predictor.setPosition(100, 100)
      const result = predictor.applyInput(
        createMoveInput(1, 0, 0),
        100,
        1
      )
      expect(result.x).toBe(100)
      expect(result.y).toBe(100)
    })

    it('should apply speed and deltaTime', () => {
      predictor.setPosition(0, 0)
      const result = predictor.applyInput(
        createMoveInput(1, 1, 0),
        200,     // speed
        0.5      // deltaTime (half second)
      )
      expect(result.x).toBeCloseTo(100) // 200 * 0.5
    })

    it('should clamp to world bounds', () => {
      predictor.setPosition(5, 5)
      const result = predictor.applyInput(
        createMoveInput(1, -1, -1),
        1000,
        1
      )
      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.y).toBeGreaterThanOrEqual(0)
    })

    it('should accumulate position across multiple inputs', () => {
      predictor.setPosition(0, 0)
      predictor.applyInput(createMoveInput(1, 1, 0), 100, 1)
      const result = predictor.applyInput(createMoveInput(2, 1, 0), 100, 1)
      expect(result.x).toBeCloseTo(200)
    })
  })

  describe('reconcile', () => {
    it('should reset to server position with no unacknowledged inputs', () => {
      predictor.setPosition(500, 500)
      const result = predictor.reconcile(100, 200, [], 100, 1 / 60)
      expect(result.x).toBe(100)
      expect(result.y).toBe(200)
    })

    it('should replay unacknowledged inputs after server position', () => {
      predictor.setPosition(0, 0)
      const inputs = [
        createMoveInput(5, 1, 0),
        createMoveInput(6, 1, 0),
      ]

      const result = predictor.reconcile(100, 100, inputs, 170, 1 / 60)

      // Server pos (100, 100) + 2 inputs at speed 170 for 1/60 sec each
      const expectedX = 100 + 2 * (170 * (1 / 60))
      expect(result.x).toBeCloseTo(expectedX)
      expect(result.y).toBeCloseTo(100)
    })

    it('should update internal position after reconciliation', () => {
      predictor.setPosition(0, 0)
      predictor.reconcile(50, 50, [], 100, 1 / 60)
      expect(predictor.position).toEqual({ x: 50, y: 50 })
    })

    it('should handle reconciliation with mixed movement directions', () => {
      predictor.setPosition(0, 0)
      const inputs = [
        createMoveInput(1, 1, 0),  // move right
        createMoveInput(2, 0, 1),  // move down
      ]

      const result = predictor.reconcile(0, 0, inputs, 60, 1 / 60)

      // First input: (0,0) + (1,0) * 60 * 1/60 = (1, 0)
      // Second input: (1,0) + (0,1) * 60 * 1/60 = (1, 1)
      expect(result.x).toBeCloseTo(1)
      expect(result.y).toBeCloseTo(1)
    })
  })

  describe('position getter', () => {
    it('should return current predicted position', () => {
      predictor.setPosition(42, 84)
      expect(predictor.position).toEqual({ x: 42, y: 84 })
    })

    it('should return new object each time', () => {
      predictor.setPosition(10, 20)
      const pos1 = predictor.position
      const pos2 = predictor.position
      expect(pos1).toEqual(pos2)
      expect(pos1).not.toBe(pos2)
    })
  })
})
