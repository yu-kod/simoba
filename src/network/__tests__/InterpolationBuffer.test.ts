import { describe, it, expect } from 'vitest'
import { InterpolationBuffer } from '../InterpolationBuffer'

function createBuffer(startTime = 0) {
  let mockTime = startTime
  const buffer = new InterpolationBuffer({ now: () => mockTime })
  const setTime = (t: number) => { mockTime = t }
  return { buffer, setTime }
}

// INTERPOLATION_DELAY = 100ms
const DELAY = 100

describe('InterpolationBuffer', () => {
  describe('basic behavior', () => {
    it('returns null before any snapshot', () => {
      const { buffer } = createBuffer()
      expect(buffer.getInterpolatedPosition()).toBeNull()
    })

    it('returns position of the single snapshot', () => {
      const { buffer } = createBuffer(0)
      buffer.pushSnapshot({ x: 100, y: 200, facing: 0, serverTime: 1000 })
      const result = buffer.getInterpolatedPosition()
      expect(result).toEqual({ x: 100, y: 200, facing: 0 })
    })
  })

  describe('delayed render-time interpolation', () => {
    it('clamps to first snapshot when render time is before buffer start', () => {
      const { buffer, setTime } = createBuffer(0)

      // Push two snapshots at t=0 and t=50
      buffer.pushSnapshot({ x: 0, y: 0, facing: 0, serverTime: 1000 })
      setTime(50)
      buffer.pushSnapshot({ x: 100, y: 0, facing: 0, serverTime: 1050 })

      // renderTime = 50 - 100 = -50 → before first snapshot → clamp to first
      const result = buffer.getInterpolatedPosition()!
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('interpolates smoothly between snapshots at render time', () => {
      const { buffer, setTime } = createBuffer(0)

      // Snap A at local time 0
      buffer.pushSnapshot({ x: 0, y: 0, facing: 0, serverTime: 1000 })
      // Snap B at local time 50
      setTime(50)
      buffer.pushSnapshot({ x: 100, y: 200, facing: 1, serverTime: 1050 })

      // At local time 125, renderTime = 125 - 100 = 25
      // t = (25 - 0) / (50 - 0) = 0.5
      setTime(125)
      const result = buffer.getInterpolatedPosition()!
      expect(result.x).toBeCloseTo(50)
      expect(result.y).toBeCloseTo(100)
    })

    it('reaches target exactly when render time equals target local time', () => {
      const { buffer, setTime } = createBuffer(0)

      buffer.pushSnapshot({ x: 0, y: 0, facing: 0, serverTime: 1000 })
      setTime(50)
      buffer.pushSnapshot({ x: 100, y: 0, facing: 0, serverTime: 1050 })

      // renderTime = 150 - 100 = 50 → exactly at snapshot B → t = 1.0
      setTime(150)
      const result = buffer.getInterpolatedPosition()!
      expect(result.x).toBeCloseTo(100)
    })

    it('no extrapolation: clamps to latest snapshot', () => {
      const { buffer, setTime } = createBuffer(0)

      buffer.pushSnapshot({ x: 0, y: 0, facing: 0, serverTime: 1000 })
      setTime(50)
      buffer.pushSnapshot({ x: 100, y: 0, facing: 0, serverTime: 1050 })

      // Long time later (packet loss), renderTime = 5000 - 100 = 4900 → past all snapshots
      setTime(5000)
      const result = buffer.getInterpolatedPosition()!
      expect(result.x).toBe(100)
      expect(result.y).toBe(0)
    })

    it('produces continuous motion across snapshot arrivals', () => {
      const { buffer, setTime } = createBuffer(0)

      // Snap A at t=0: x=0
      buffer.pushSnapshot({ x: 0, y: 0, facing: 0, serverTime: 1000 })
      // Snap B at t=50: x=100
      setTime(50)
      buffer.pushSnapshot({ x: 100, y: 0, facing: 0, serverTime: 1050 })

      // Read position just before snap C arrives
      // t=99, renderTime = 99-100 = -1 → still before snap A → x=0
      setTime(99)
      const before = buffer.getInterpolatedPosition()!

      // Snap C arrives at t=100: x=200
      setTime(100)
      buffer.pushSnapshot({ x: 200, y: 0, facing: 0, serverTime: 1100 })

      // Read position just after snap C arrives
      // renderTime = 100-100 = 0 → at snap A → x=0
      const after = buffer.getInterpolatedPosition()!

      // Both should be at or near x=0 — no jump
      expect(Math.abs(after.x - before.x)).toBeLessThan(5)
    })
  })

  describe('facing lerp (shortest path)', () => {
    it('interpolates facing via shortest path', () => {
      const { buffer, setTime } = createBuffer(0)

      buffer.pushSnapshot({ x: 0, y: 0, facing: 0, serverTime: 1000 })
      setTime(50)
      buffer.pushSnapshot({ x: 0, y: 0, facing: Math.PI, serverTime: 1050 })

      // renderTime = 125 - 100 = 25, t = 25/50 = 0.5
      setTime(125)
      const result = buffer.getInterpolatedPosition()!
      expect(result.facing).toBeCloseTo(Math.PI / 2)
    })

    it('handles wraparound near ±π', () => {
      const { buffer, setTime } = createBuffer(0)

      // Going from -0.9π to 0.9π — shortest path is through ±π, not through 0
      buffer.pushSnapshot({ x: 0, y: 0, facing: -0.9 * Math.PI, serverTime: 1000 })
      setTime(50)
      buffer.pushSnapshot({ x: 0, y: 0, facing: 0.9 * Math.PI, serverTime: 1050 })

      // renderTime = 125 - 100 = 25, t = 0.5
      setTime(125)
      const result = buffer.getInterpolatedPosition()!
      // Shortest path goes through ±π → absolute value should be close to π
      expect(Math.abs(result.facing)).toBeGreaterThan(Math.PI * 0.85)
    })
  })

  describe('multiple snapshots (ring buffer)', () => {
    it('interpolates across multiple buffered snapshots', () => {
      const { buffer, setTime } = createBuffer(0)

      // Build up 3 snapshots at t=0, t=50, t=100
      buffer.pushSnapshot({ x: 0, y: 0, facing: 0, serverTime: 1000 })
      setTime(50)
      buffer.pushSnapshot({ x: 100, y: 0, facing: 0, serverTime: 1050 })
      setTime(100)
      buffer.pushSnapshot({ x: 200, y: 0, facing: 0, serverTime: 1100 })

      // renderTime = 175 - 100 = 75 → between snap B (t=50) and snap C (t=100)
      // t = (75 - 50) / (100 - 50) = 0.5 → x = lerp(100, 200, 0.5) = 150
      setTime(175)
      const result = buffer.getInterpolatedPosition()!
      expect(result.x).toBeCloseTo(150)
    })

    it('handles zero-interval snapshots gracefully', () => {
      const { buffer, setTime } = createBuffer(0)

      buffer.pushSnapshot({ x: 0, y: 0, facing: 0, serverTime: 1000 })
      // Two snapshots arrive at the same local time
      buffer.pushSnapshot({ x: 100, y: 0, facing: 0, serverTime: 1000 })
      setTime(DELAY)
      const result = buffer.getInterpolatedPosition()!
      // Should not crash, returns valid position
      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.x).toBeLessThanOrEqual(100)
    })
  })

  describe('custom time function injection', () => {
    it('uses injected now function', () => {
      let mockTime = 100
      const buffer = new InterpolationBuffer({ now: () => mockTime })

      buffer.pushSnapshot({ x: 0, y: 0, facing: 0, serverTime: 1000 })
      mockTime = 150
      buffer.pushSnapshot({ x: 100, y: 0, facing: 0, serverTime: 1050 })

      // renderTime = 225 - 100 = 125 → between snap A (t=100) and snap B (t=150)
      // t = (125 - 100) / (150 - 100) = 0.5 → x = 50
      mockTime = 225
      const result = buffer.getInterpolatedPosition()!
      expect(result.x).toBeCloseTo(50)
    })
  })
})
