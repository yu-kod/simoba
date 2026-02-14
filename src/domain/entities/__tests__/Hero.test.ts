import { createHeroState } from '@/domain/entities/Hero'

describe('Hero', () => {
  describe('createHeroState', () => {
    it('should create a BLADE hero with correct base HP', () => {
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
      expect(hero.hp).toBe(600)
      expect(hero.maxHp).toBe(600)
      expect(hero.level).toBe(1)
      expect(hero.xp).toBe(0)
    })

    it('should create a BOLT hero with lower base HP', () => {
      const hero = createHeroState({
        id: 'hero-2',
        type: 'BOLT',
        team: 'red',
        position: { x: 0, y: 0 },
      })

      expect(hero.type).toBe('BOLT')
      expect(hero.hp).toBe(400)
      expect(hero.maxHp).toBe(400)
    })

    it('should create an AURA hero with medium base HP', () => {
      const hero = createHeroState({
        id: 'hero-3',
        type: 'AURA',
        team: 'blue',
        position: { x: 50, y: 50 },
      })

      expect(hero.type).toBe('AURA')
      expect(hero.hp).toBe(450)
      expect(hero.maxHp).toBe(450)
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

    it('should set hp equal to maxHp on creation', () => {
      const hero = createHeroState({
        id: 'hero-5',
        type: 'BOLT',
        team: 'blue',
        position: { x: 0, y: 0 },
      })

      expect(hero.hp).toBe(hero.maxHp)
    })
  })
})
