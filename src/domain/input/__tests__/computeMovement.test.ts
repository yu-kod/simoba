import { describe, it, expect } from 'vitest'
import { computeMovement } from '@/domain/input/computeMovement'

const NO_KEYS = { w: false, a: false, s: false, d: false }
const SQRT2_INV = 1 / Math.sqrt(2)

describe('computeMovement', () => {
  it('returns zero vector when no keys pressed', () => {
    expect(computeMovement(NO_KEYS)).toEqual({ x: 0, y: 0 })
  })

  it('returns up direction for W', () => {
    expect(computeMovement({ ...NO_KEYS, w: true })).toEqual({ x: 0, y: -1 })
  })

  it('returns down direction for S', () => {
    expect(computeMovement({ ...NO_KEYS, s: true })).toEqual({ x: 0, y: 1 })
  })

  it('returns left direction for A', () => {
    expect(computeMovement({ ...NO_KEYS, a: true })).toEqual({ x: -1, y: 0 })
  })

  it('returns right direction for D', () => {
    expect(computeMovement({ ...NO_KEYS, d: true })).toEqual({ x: 1, y: 0 })
  })

  it('returns normalized diagonal for W+D', () => {
    const result = computeMovement({ ...NO_KEYS, w: true, d: true })
    expect(result.x).toBeCloseTo(SQRT2_INV)
    expect(result.y).toBeCloseTo(-SQRT2_INV)
  })

  it('returns normalized diagonal for S+A', () => {
    const result = computeMovement({ ...NO_KEYS, s: true, a: true })
    expect(result.x).toBeCloseTo(-SQRT2_INV)
    expect(result.y).toBeCloseTo(SQRT2_INV)
  })

  it('cancels opposing W+S keys', () => {
    expect(computeMovement({ ...NO_KEYS, w: true, s: true })).toEqual({
      x: 0,
      y: 0,
    })
  })

  it('cancels opposing A+D keys', () => {
    expect(computeMovement({ ...NO_KEYS, a: true, d: true })).toEqual({
      x: 0,
      y: 0,
    })
  })

  it('handles 3 keys with opposing pair', () => {
    const result = computeMovement({ w: true, s: true, d: true, a: false })
    expect(result).toEqual({ x: 1, y: 0 })
  })
})
