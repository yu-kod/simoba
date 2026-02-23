import { describe, it, expect } from 'vitest'
import { updateTargeting } from '@/domain/input/targetingReducer'
import type { TargetingState } from '@/domain/input/InputState'

const IDLE: TargetingState = { phase: 'idle' }
const MOUSE_POS = { x: 500, y: 300 }

describe('updateTargeting', () => {
  describe('Normal Cast', () => {
    it('transitions from idle to targeting on SKILL_KEY_DOWN', () => {
      const result = updateTargeting(IDLE, {
        type: 'SKILL_KEY_DOWN',
        skill: 'Q',
        mode: 'normal',
      })
      expect(result).toEqual({
        phase: 'targeting',
        skill: 'Q',
        mode: 'normal',
      })
    })

    it('fires on LEFT_CLICK during normal targeting', () => {
      const targeting: TargetingState = {
        phase: 'targeting',
        skill: 'Q',
        mode: 'normal',
      }
      const result = updateTargeting(targeting, {
        type: 'LEFT_CLICK',
        mouseWorldPosition: MOUSE_POS,
      })
      expect(result).toEqual({
        phase: 'fired',
        skill: 'Q',
        target: MOUSE_POS,
      })
    })

    it('cancels targeting on RIGHT_CLICK', () => {
      const targeting: TargetingState = {
        phase: 'targeting',
        skill: 'E',
        mode: 'normal',
      }
      const result = updateTargeting(targeting, { type: 'RIGHT_CLICK' })
      expect(result).toEqual({ phase: 'cancelled' })
    })

    it('switches skill when another skill key is pressed during targeting', () => {
      const targeting: TargetingState = {
        phase: 'targeting',
        skill: 'Q',
        mode: 'normal',
      }
      const result = updateTargeting(targeting, {
        type: 'SKILL_KEY_DOWN',
        skill: 'E',
        mode: 'normal',
      })
      expect(result).toEqual({
        phase: 'targeting',
        skill: 'E',
        mode: 'normal',
      })
    })

    it('ignores LEFT_CLICK when idle', () => {
      const result = updateTargeting(IDLE, {
        type: 'LEFT_CLICK',
        mouseWorldPosition: MOUSE_POS,
      })
      expect(result).toEqual(IDLE)
    })
  })

  describe('Quick Cast', () => {
    it('fires on SKILL_KEY_UP during quick targeting', () => {
      const targeting: TargetingState = {
        phase: 'targeting',
        skill: 'E',
        mode: 'quick',
      }
      const result = updateTargeting(targeting, {
        type: 'SKILL_KEY_UP',
        skill: 'E',
        mouseWorldPosition: MOUSE_POS,
      })
      expect(result).toEqual({
        phase: 'fired',
        skill: 'E',
        target: MOUSE_POS,
      })
    })

    it('cancels quick cast on RIGHT_CLICK before key release', () => {
      const targeting: TargetingState = {
        phase: 'targeting',
        skill: 'R',
        mode: 'quick',
      }
      const result = updateTargeting(targeting, { type: 'RIGHT_CLICK' })
      expect(result).toEqual({ phase: 'cancelled' })
    })

    it('does not fire on key up after cancellation', () => {
      const cancelled: TargetingState = { phase: 'cancelled' }
      const result = updateTargeting(cancelled, {
        type: 'SKILL_KEY_UP',
        skill: 'R',
        mouseWorldPosition: MOUSE_POS,
      })
      expect(result).toEqual({ phase: 'cancelled' })
    })

    it('ignores key up for a different skill', () => {
      const targeting: TargetingState = {
        phase: 'targeting',
        skill: 'Q',
        mode: 'quick',
      }
      const result = updateTargeting(targeting, {
        type: 'SKILL_KEY_UP',
        skill: 'E',
        mouseWorldPosition: MOUSE_POS,
      })
      expect(result).toEqual(targeting)
    })
  })

  describe('RESET', () => {
    it('resets fired state to idle', () => {
      const fired: TargetingState = {
        phase: 'fired',
        skill: 'Q',
        target: MOUSE_POS,
      }
      const result = updateTargeting(fired, { type: 'RESET' })
      expect(result).toEqual(IDLE)
    })

    it('resets cancelled state to idle', () => {
      const cancelled: TargetingState = { phase: 'cancelled' }
      const result = updateTargeting(cancelled, { type: 'RESET' })
      expect(result).toEqual(IDLE)
    })

    it('does not reset targeting state', () => {
      const targeting: TargetingState = {
        phase: 'targeting',
        skill: 'Q',
        mode: 'normal',
      }
      const result = updateTargeting(targeting, { type: 'RESET' })
      expect(result).toEqual(targeting)
    })
  })
})
