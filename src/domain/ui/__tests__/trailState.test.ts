import {
  createTrailState,
  updateTrail,
  onDamage,
  isTrailActive,
} from '@/domain/ui/trailState'

describe('trailState', () => {
  describe('createTrailState', () => {
    it('should initialize trailHp to maxHp with no delay', () => {
      const state = createTrailState(650)
      expect(state.trailHp).toBe(650)
      expect(state.delayRemaining).toBe(0)
    })
  })

  describe('onDamage', () => {
    it('should set trailHp to previousHp and start delay', () => {
      const state = createTrailState(650)
      const damaged = onDamage(state, 650)
      expect(damaged.trailHp).toBe(650)
      expect(damaged.delayRemaining).toBe(0.5)
    })

    it('should keep existing trailHp if it is higher than previousHp (consecutive hits)', () => {
      // First damage: hp 650 -> 500, trailHp = 650
      const state = onDamage(createTrailState(650), 650)
      // Second damage: hp 500 -> 400, but trailHp should stay at 650
      const secondHit = onDamage(state, 500)
      expect(secondHit.trailHp).toBe(650)
      expect(secondHit.delayRemaining).toBe(0.5)
    })
  })

  describe('updateTrail', () => {
    it('should not change trailHp during delay phase', () => {
      const state = onDamage(createTrailState(650), 650)
      // currentHp is now 500, deltaTime = 0.1s (still in delay)
      const updated = updateTrail(state, 500, 0.1)
      expect(updated.trailHp).toBe(650)
      expect(updated.delayRemaining).toBeCloseTo(0.4)
    })

    it('should start shrinking after delay expires', () => {
      const state = onDamage(createTrailState(650), 650)
      // Exhaust delay (0.5s)
      const afterDelay = updateTrail(state, 500, 0.5)
      expect(afterDelay.delayRemaining).toBe(0)
      expect(afterDelay.trailHp).toBe(650) // Not yet shrunk in the same frame delay expires

      // Next frame: shrink at 200 HP/s, deltaTime = 0.1s → shrink by 20
      const shrinking = updateTrail(afterDelay, 500, 0.1)
      expect(shrinking.trailHp).toBeCloseTo(630) // 650 - 200*0.1
    })

    it('should clamp trailHp to currentHp (not go below)', () => {
      // trailHp = 510, currentHp = 500, shrink by 200 * 0.1 = 20
      // 510 - 20 = 490, but should clamp to 500
      const state = { trailHp: 510, delayRemaining: 0 }
      const updated = updateTrail(state, 500, 0.1)
      expect(updated.trailHp).toBe(500)
    })

    it('should reset trailHp when currentHp >= trailHp (healed or no damage)', () => {
      const state = { trailHp: 500, delayRemaining: 0 }
      const updated = updateTrail(state, 650, 0.016)
      expect(updated.trailHp).toBe(650)
      expect(updated.delayRemaining).toBe(0)
    })
  })

  describe('isTrailActive', () => {
    it('should return true when trailHp > currentHp', () => {
      const state = { trailHp: 650, delayRemaining: 0.5 }
      expect(isTrailActive(state, 500)).toBe(true)
    })

    it('should return false when trailHp === currentHp', () => {
      const state = { trailHp: 650, delayRemaining: 0 }
      expect(isTrailActive(state, 650)).toBe(false)
    })

    it('should return false when trailHp < currentHp', () => {
      const state = { trailHp: 400, delayRemaining: 0 }
      expect(isTrailActive(state, 500)).toBe(false)
    })
  })

  describe('full damage trail lifecycle', () => {
    it('should show trail, delay, shrink, then disappear', () => {
      // 1. Initial state: no trail
      let state = createTrailState(650)
      expect(isTrailActive(state, 650)).toBe(false)

      // 2. Take damage: 650 -> 500
      state = onDamage(state, 650)
      expect(isTrailActive(state, 500)).toBe(true)
      expect(state.trailHp).toBe(650)

      // 3. Wait through delay (0.5s in a single call)
      state = updateTrail(state, 500, 0.5)
      expect(state.delayRemaining).toBe(0)
      expect(state.trailHp).toBe(650)

      // 4. Shrink phase: 150 HP gap at 200 HP/s = 0.75s
      // After 0.5s: trailHp = 650 - 200*0.5 = 550
      state = updateTrail(state, 500, 0.5)
      expect(state.trailHp).toBeCloseTo(550)
      expect(isTrailActive(state, 500)).toBe(true)

      // After another 0.5s: trailHp = 550 - 200*0.5 = 450, clamped to 500
      state = updateTrail(state, 500, 0.5)
      expect(state.trailHp).toBe(500)
      expect(isTrailActive(state, 500)).toBe(false)
    })
  })
})
