import { createHeroState } from '@/domain/entities/Hero'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import type { HeroType } from '@/domain/types'

describe('HeroDefinition', () => {
  it('should set canMoveWhileAttacking to true for BLADE', () => {
    expect(HERO_DEFINITIONS.BLADE.canMoveWhileAttacking).toBe(true)
  })

  it('should set canMoveWhileAttacking to false for BOLT', () => {
    expect(HERO_DEFINITIONS.BOLT.canMoveWhileAttacking).toBe(false)
  })

  it('should set canMoveWhileAttacking to false for AURA', () => {
    expect(HERO_DEFINITIONS.AURA.canMoveWhileAttacking).toBe(false)
  })
})

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
      expect(hero.entityType).toBe('hero')
      expect(hero.dead).toBe(false)
      expect(hero.radius).toBe(HERO_DEFINITIONS.BLADE.radius)
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

    it('should initialise attackCooldown to 0 and attackTargetId to null', () => {
      const hero = createHeroState({
        id: 'hero-atk',
        type: 'BLADE',
        team: 'blue',
        position: { x: 0, y: 0 },
      })

      expect(hero.attackCooldown).toBe(0)
      expect(hero.attackTargetId).toBeNull()
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
