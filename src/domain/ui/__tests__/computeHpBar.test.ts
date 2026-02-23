import { computeHpBar } from '@/domain/ui/computeHpBar'

const BAR_WIDTH = 44

describe('computeHpBar', () => {
  describe('currentHpWidth', () => {
    it('should return full width when hp equals maxHp', () => {
      const result = computeHpBar(650, 650, BAR_WIDTH)
      expect(result.currentHpWidth).toBe(BAR_WIDTH)
    })

    it('should return half width when hp is 50%', () => {
      const result = computeHpBar(325, 650, BAR_WIDTH)
      expect(result.currentHpWidth).toBe(BAR_WIDTH / 2)
    })

    it('should return 0 when hp is 0', () => {
      const result = computeHpBar(0, 650, BAR_WIDTH)
      expect(result.currentHpWidth).toBe(0)
    })

    it('should clamp hp ratio to 0 when hp is negative', () => {
      const result = computeHpBar(-10, 650, BAR_WIDTH)
      expect(result.currentHpWidth).toBe(0)
    })

    it('should clamp hp ratio to 1 when hp exceeds maxHp', () => {
      const result = computeHpBar(700, 650, BAR_WIDTH)
      expect(result.currentHpWidth).toBe(BAR_WIDTH)
    })
  })

  describe('tickPositions (250HP tick marks)', () => {
    it('should have 2 ticks for maxHp=650 (at 250 and 500)', () => {
      const result = computeHpBar(650, 650, BAR_WIDTH)
      expect(result.tickPositions).toHaveLength(2)
      expect(result.tickPositions[0]).toBeCloseTo((250 / 650) * BAR_WIDTH)
      expect(result.tickPositions[1]).toBeCloseTo((500 / 650) * BAR_WIDTH)
    })

    it('should have 2 ticks for maxHp=750 (at 250 and 500)', () => {
      const result = computeHpBar(750, 750, BAR_WIDTH)
      expect(result.tickPositions).toHaveLength(2)
      expect(result.tickPositions[0]).toBeCloseTo((250 / 750) * BAR_WIDTH)
      expect(result.tickPositions[1]).toBeCloseTo((500 / 750) * BAR_WIDTH)
    })

    it('should have 3 ticks for maxHp=1000 (floor(1000/250)-1 = 3)', () => {
      const result = computeHpBar(1000, 1000, BAR_WIDTH)
      expect(result.tickPositions).toHaveLength(3)
      expect(result.tickPositions[0]).toBeCloseTo((250 / 1000) * BAR_WIDTH)
      expect(result.tickPositions[1]).toBeCloseTo((500 / 1000) * BAR_WIDTH)
      expect(result.tickPositions[2]).toBeCloseTo((750 / 1000) * BAR_WIDTH)
    })

    it('should have no ticks for maxHp=200 (floor(200/250)-1 < 1)', () => {
      const result = computeHpBar(200, 200, BAR_WIDTH)
      expect(result.tickPositions).toHaveLength(0)
    })

    it('should have no ticks for maxHp=250 (floor(250/250)-1 = 0)', () => {
      const result = computeHpBar(250, 250, BAR_WIDTH)
      expect(result.tickPositions).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('should handle maxHp=0 gracefully', () => {
      const result = computeHpBar(0, 0, BAR_WIDTH)
      expect(result.currentHpWidth).toBe(0)
      expect(result.tickPositions).toHaveLength(0)
    })

    it('should handle negative maxHp gracefully', () => {
      const result = computeHpBar(0, -100, BAR_WIDTH)
      expect(result.currentHpWidth).toBe(0)
      expect(result.tickPositions).toHaveLength(0)
    })
  })
})
