import { createHeroState } from '@/domain/entities/Hero'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import type { HeroType } from '@/domain/types'

describe('Hero', () => {
  describe('createHeroState', () => {
    it('should create a BLADE hero with correct initial values', () => {
      const hero = createHeroState({
        id: 'hero-1',
        type: 'BLADE',
        team: 'blue',
        position: { x: 100, y: 200 },
      })

      expect(hero.id).toBe('hero-1')
      expect(hero.type).toBe('BLADE')
      expect(hero.team).toBe('blue')
      expect(hero.position).toEqual({ x: 100, y: 200 })
      expect(hero.level).toBe(1)
      expect(hero.xp).toBe(0)
      expect(hero.facing).toBe(0)
    })

    it.each<HeroType>(['BLADE', 'BOLT', 'AURA'])(
      'should initialise %s stats from HERO_DEFINITIONS base',
      (type) => {
        const hero = createHeroState({
          id: `hero-${type}`,
          type,
          team: 'blue',
          position: { x: 0, y: 0 },
        })

        const base = HERO_DEFINITIONS[type].base
        expect(hero.stats).toEqual(base)
        expect(hero.hp).toBe(base.maxHp)
        expect(hero.maxHp).toBe(base.maxHp)
      }
    )

    it('should set hp equal to maxHp on creation', () => {
      const hero = createHeroState({
        id: 'hero-5',
        type: 'BOLT',
        team: 'blue',
        position: { x: 0, y: 0 },
      })

      expect(hero.hp).toBe(hero.maxHp)
      expect(hero.hp).toBe(hero.stats.maxHp)
    })

    it('should start at level 1 with 0 XP', () => {
      const hero = createHeroState({
        id: 'hero-4',
        type: 'BLADE',
        team: 'red',
        position: { x: 0, y: 0 },
      })

      expect(hero.level).toBe(1)
      expect(hero.xp).toBe(0)
    })

    it('should initialise facing to 0 (right)', () => {
      const hero = createHeroState({
        id: 'hero-6',
        type: 'AURA',
        team: 'red',
        position: { x: 50, y: 50 },
      })

      expect(hero.facing).toBe(0)
    })

    it('should return stats as a new object (not a reference to HERO_DEFINITIONS.base)', () => {
      const hero = createHeroState({
        id: 'hero-ref',
        type: 'BLADE',
        team: 'blue',
        position: { x: 0, y: 0 },
      })

      expect(hero.stats).toEqual(HERO_DEFINITIONS.BLADE.base)
      expect(hero.stats).not.toBe(HERO_DEFINITIONS.BLADE.base)
    })
  })
})
