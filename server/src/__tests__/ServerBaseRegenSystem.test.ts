import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { isHeroInBase, processBaseRegen } from '../game/ServerBaseRegenSystem.js'
import { BASES, BASE_HP_REGEN_PER_SEC } from '@shared/constants'

function createHero(overrides: Partial<Record<keyof HeroSchema, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.id = 'hero-1'
  hero.x = 50
  hero.y = 360
  hero.hp = 300
  hero.maxHp = 650
  hero.dead = false
  hero.team = 'blue'
  Object.assign(hero, overrides)
  return hero
}

describe('ServerBaseRegenSystem', () => {
  describe('isHeroInBase', () => {
    it('should return true for blue hero inside blue base', () => {
      const hero = createHero({ x: 50, y: 360, team: 'blue' })
      expect(isHeroInBase(hero)).toBe(true)
    })

    it('should return false for blue hero outside blue base', () => {
      const hero = createHero({ x: 500, y: 360, team: 'blue' })
      expect(isHeroInBase(hero)).toBe(false)
    })

    it('should return true for red hero inside red base', () => {
      const base = BASES.red
      const hero = createHero({ x: base.x + 50, y: base.y + 50, team: 'red' })
      expect(isHeroInBase(hero)).toBe(true)
    })

    it('should return false for red hero inside blue base', () => {
      const hero = createHero({ x: 50, y: 360, team: 'red' })
      expect(isHeroInBase(hero)).toBe(false)
    })

    it('should return true at base boundary edges', () => {
      const base = BASES.blue
      const hero = createHero({ x: base.x, y: base.y, team: 'blue' })
      expect(isHeroInBase(hero)).toBe(true)

      const heroEdge = createHero({ x: base.x + base.width, y: base.y + base.height, team: 'blue' })
      expect(isHeroInBase(heroEdge)).toBe(true)
    })
  })

  describe('processBaseRegen', () => {
    let heroes: MapSchema<HeroSchema>

    beforeEach(() => {
      heroes = new MapSchema<HeroSchema>()
    })

    it('should regenerate HP for hero inside own base', () => {
      const hero = createHero({ hp: 300, maxHp: 650, team: 'blue', x: 50, y: 360 })
      heroes.set('hero-1', hero)

      processBaseRegen(heroes, 1.0)

      expect(hero.hp).toBe(300 + BASE_HP_REGEN_PER_SEC)
    })

    it('should clamp HP to maxHp', () => {
      const hero = createHero({ hp: 600, maxHp: 650, team: 'blue', x: 50, y: 360 })
      heroes.set('hero-1', hero)

      processBaseRegen(heroes, 1.0)

      expect(hero.hp).toBe(650)
    })

    it('should not regenerate for hero outside base', () => {
      const hero = createHero({ hp: 300, maxHp: 650, team: 'blue', x: 500, y: 360 })
      heroes.set('hero-1', hero)

      processBaseRegen(heroes, 1.0)

      expect(hero.hp).toBe(300)
    })

    it('should not regenerate for dead hero', () => {
      const hero = createHero({ hp: 0, maxHp: 650, dead: true, team: 'blue', x: 50, y: 360 })
      heroes.set('hero-1', hero)

      processBaseRegen(heroes, 1.0)

      expect(hero.hp).toBe(0)
    })

    it('should not regenerate when already at full HP', () => {
      const hero = createHero({ hp: 650, maxHp: 650, team: 'blue', x: 50, y: 360 })
      heroes.set('hero-1', hero)

      processBaseRegen(heroes, 1.0)

      expect(hero.hp).toBe(650)
    })

    it('should scale with deltaTime', () => {
      const hero = createHero({ hp: 300, maxHp: 650, team: 'blue', x: 50, y: 360 })
      heroes.set('hero-1', hero)

      processBaseRegen(heroes, 0.5)

      expect(hero.hp).toBe(300 + BASE_HP_REGEN_PER_SEC * 0.5)
    })

    it('should regenerate multiple heroes independently', () => {
      const blueHero = createHero({ id: 'blue-1', hp: 300, maxHp: 650, team: 'blue', x: 50, y: 360 })
      const redBase = BASES.red
      const redHero = createHero({ id: 'red-1', hp: 200, maxHp: 400, team: 'red', x: redBase.x + 50, y: redBase.y + 50 })
      heroes.set('blue-1', blueHero)
      heroes.set('red-1', redHero)

      processBaseRegen(heroes, 1.0)

      expect(blueHero.hp).toBe(300 + BASE_HP_REGEN_PER_SEC)
      expect(redHero.hp).toBe(200 + BASE_HP_REGEN_PER_SEC)
    })

    it('should not regenerate hero in enemy base', () => {
      const redBase = BASES.red
      const blueInRedBase = createHero({ hp: 300, maxHp: 650, team: 'blue', x: redBase.x + 50, y: redBase.y + 50 })
      heroes.set('hero-1', blueInRedBase)

      processBaseRegen(heroes, 1.0)

      expect(blueInRedBase.hp).toBe(300)
    })
  })
})
