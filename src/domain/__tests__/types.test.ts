import { expectTypeOf } from 'vitest'
import type { Position, Team, HeroType, EntityState } from '@/domain/types'

describe('Domain Types', () => {
  describe('Position', () => {
    it('should have readonly x and y number properties', () => {
      expectTypeOf<Position>().toEqualTypeOf<{
        readonly x: number
        readonly y: number
      }>()
    })

    it('should satisfy Position interface with valid values', () => {
      const pos: Position = { x: 10, y: 20 }
      expect(pos.x).toBe(10)
      expect(pos.y).toBe(20)
    })
  })

  describe('Team', () => {
    it('should only allow blue, red, or neutral', () => {
      expectTypeOf<Team>().toEqualTypeOf<'blue' | 'red' | 'neutral'>()
    })

    it('should accept valid team values', () => {
      const blue: Team = 'blue'
      const red: Team = 'red'
      const neutral: Team = 'neutral'
      expect(blue).toBe('blue')
      expect(red).toBe('red')
      expect(neutral).toBe('neutral')
    })
  })

  describe('HeroType', () => {
    it('should only allow BLADE, BOLT, or AURA', () => {
      expectTypeOf<HeroType>().toEqualTypeOf<'BLADE' | 'BOLT' | 'AURA'>()
    })

    it('should accept valid hero types', () => {
      const types: HeroType[] = ['BLADE', 'BOLT', 'AURA']
      expect(types).toHaveLength(3)
    })
  })

  describe('EntityState', () => {
    it('should have readonly id, position, and team', () => {
      expectTypeOf<EntityState>().toEqualTypeOf<{
        readonly id: string
        readonly position: Position
        readonly team: Team
      }>()
    })

    it('should satisfy EntityState interface with valid values', () => {
      const entity: EntityState = {
        id: 'entity-1',
        position: { x: 0, y: 0 },
        team: 'blue',
      }

      expect(entity.id).toBe('entity-1')
      expect(entity.position).toEqual({ x: 0, y: 0 })
      expect(entity.team).toBe('blue')
    })
  })
})
