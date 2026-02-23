import { isInAttackRange } from '@/domain/systems/isInAttackRange'

describe('isInAttackRange', () => {
  it('should return true when effective distance equals attackRange', () => {
    // BLADE(22) vs BOLT(18), center dist 100, effective = 100 - 22 - 18 = 60
    const result = isInAttackRange(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      22,
      18,
      60
    )
    expect(result).toBe(true)
  })

  it('should return false when effective distance exceeds attackRange', () => {
    // BLADE(22) vs BOLT(18), center dist 120, effective = 120 - 22 - 18 = 80
    const result = isInAttackRange(
      { x: 0, y: 0 },
      { x: 120, y: 0 },
      22,
      18,
      60
    )
    expect(result).toBe(false)
  })

  it('should return true when entities are overlapping', () => {
    // Same position, effective distance is negative
    const result = isInAttackRange(
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      20,
      20,
      10
    )
    expect(result).toBe(true)
  })

  it('should handle diagonal distances correctly', () => {
    // Distance = sqrt(60^2 + 80^2) = 100, effective = 100 - 22 - 18 = 60
    const result = isInAttackRange(
      { x: 0, y: 0 },
      { x: 60, y: 80 },
      22,
      18,
      60
    )
    expect(result).toBe(true)
  })
})
