import { describe, it, expect } from 'vitest'
import { distanceSq } from './distanceSq'

describe('distanceSq', () => {
  it('should return 0 for the same point', () => {
    expect(distanceSq(5, 10, 5, 10)).toBe(0)
  })

  it('should return squared distance for horizontal displacement', () => {
    expect(distanceSq(0, 0, 3, 0)).toBe(9)
  })

  it('should return squared distance for vertical displacement', () => {
    expect(distanceSq(0, 0, 0, 4)).toBe(16)
  })

  it('should return squared distance for diagonal (3-4-5 triangle)', () => {
    expect(distanceSq(0, 0, 3, 4)).toBe(25)
  })

  it('should be commutative', () => {
    expect(distanceSq(1, 2, 5, 8)).toBe(distanceSq(5, 8, 1, 2))
  })

  it('should handle negative coordinates', () => {
    expect(distanceSq(-3, -4, 0, 0)).toBe(25)
  })
})
