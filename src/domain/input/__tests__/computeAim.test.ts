import { describe, it, expect } from 'vitest'
import { computeAimDirection } from '@/domain/input/computeAim'

describe('computeAimDirection', () => {
  it('returns normalized direction toward mouse (right)', () => {
    const result = computeAimDirection({ x: 100, y: 100 }, { x: 200, y: 100 })
    expect(result.x).toBeCloseTo(1)
    expect(result.y).toBeCloseTo(0)
  })

  it('returns normalized direction toward mouse (upper-right)', () => {
    const result = computeAimDirection({ x: 100, y: 100 }, { x: 200, y: 0 })
    const length = Math.sqrt(result.x * result.x + result.y * result.y)
    expect(length).toBeCloseTo(1)
    expect(result.x).toBeGreaterThan(0)
    expect(result.y).toBeLessThan(0)
  })

  it('returns zero vector when mouse is at hero position', () => {
    const result = computeAimDirection({ x: 100, y: 100 }, { x: 100, y: 100 })
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('returns normalized direction toward mouse (left)', () => {
    const result = computeAimDirection({ x: 200, y: 100 }, { x: 100, y: 100 })
    expect(result.x).toBeCloseTo(-1)
    expect(result.y).toBeCloseTo(0)
  })

  it('returns normalized direction toward mouse (down)', () => {
    const result = computeAimDirection({ x: 100, y: 100 }, { x: 100, y: 300 })
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(1)
  })
})
