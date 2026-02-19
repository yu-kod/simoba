import { describe, it, expect } from 'vitest'
import { HeroSchema } from '../schema/HeroSchema.js'
import { processMovement } from '../game/ServerMovementSystem.js'
import type { InputMessage } from '@shared/messages'
import { WORLD_WIDTH, WORLD_HEIGHT } from '@shared/constants'

function createHero(overrides: Partial<Record<keyof HeroSchema, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.x = 100
  hero.y = 100
  hero.speed = 200
  hero.dead = false
  Object.assign(hero, overrides)
  return hero
}

function createInput(overrides: Partial<InputMessage> = {}): InputMessage {
  return {
    seq: 1,
    moveDir: { x: 1, y: 0 },
    attackTargetId: null,
    facing: 0,
    ...overrides,
  }
}

describe('ServerMovementSystem', () => {
  describe('processMovement', () => {
    it('should move hero in input direction', () => {
      const hero = createHero()
      const input = createInput({ moveDir: { x: 1, y: 0 } })
      processMovement(hero, input, 0.5)

      expect(hero.x).toBe(200) // 100 + 200 * 0.5
      expect(hero.y).toBe(100)
    })

    it('should normalize diagonal movement', () => {
      const hero = createHero()
      const input = createInput({ moveDir: { x: 1, y: 1 } })
      processMovement(hero, input, 1)

      // sqrt(2)/2 * 200 ≈ 141.42
      const expectedDelta = (1 / Math.sqrt(2)) * 200
      expect(hero.x).toBeCloseTo(100 + expectedDelta, 1)
      expect(hero.y).toBeCloseTo(100 + expectedDelta, 1)
    })

    it('should not move dead hero', () => {
      const hero = createHero({ dead: true })
      const input = createInput({ moveDir: { x: 1, y: 0 } })
      processMovement(hero, input, 1)

      expect(hero.x).toBe(100)
      expect(hero.y).toBe(100)
    })

    it('should not move without input', () => {
      const hero = createHero()
      processMovement(hero, undefined, 1)

      expect(hero.x).toBe(100)
      expect(hero.y).toBe(100)
    })

    it('should not move with zero moveDir', () => {
      const hero = createHero()
      const input = createInput({ moveDir: { x: 0, y: 0 } })
      processMovement(hero, input, 1)

      expect(hero.x).toBe(100)
      expect(hero.y).toBe(100)
    })

    it('should clamp to map boundaries (left/top)', () => {
      const hero = createHero({ x: 5, y: 5 })
      const input = createInput({ moveDir: { x: -1, y: -1 } })
      processMovement(hero, input, 1)

      expect(hero.x).toBe(0)
      expect(hero.y).toBe(0)
    })

    it('should clamp to map boundaries (right/bottom)', () => {
      const hero = createHero({ x: WORLD_WIDTH - 5, y: WORLD_HEIGHT - 5 })
      const input = createInput({ moveDir: { x: 1, y: 1 } })
      processMovement(hero, input, 1)

      expect(hero.x).toBe(WORLD_WIDTH)
      expect(hero.y).toBe(WORLD_HEIGHT)
    })

    it('should update facing from input', () => {
      const hero = createHero()
      const input = createInput({ facing: 1.5 })
      processMovement(hero, input, 0.1)

      expect(hero.facing).toBe(1.5)
    })
  })
})
