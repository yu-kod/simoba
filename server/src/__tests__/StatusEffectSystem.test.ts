import { describe, it, expect } from 'vitest'
import { HeroSchema } from '../schema/HeroSchema.js'
import { StatusEffectSchema } from '../schema/StatusEffectSchema.js'
import { getStatusEffectValue, tickBuffs } from '../game/StatusEffectSystem.js'

function createHero(): HeroSchema {
  const hero = new HeroSchema()
  hero.hp = 500
  hero.maxHp = 500
  hero.dead = false
  return hero
}

function addEffect(
  hero: HeroSchema,
  id: string,
  buffType: string,
  value: number,
  remainingDuration: number,
  isDebuff = false,
): void {
  const effect = new StatusEffectSchema()
  effect.id = id
  effect.buffType = buffType
  effect.value = value
  effect.remainingDuration = remainingDuration
  effect.isDebuff = isDebuff
  hero.statusEffects.set(id, effect)
}

describe('StatusEffectSchema', () => {
  it('should have correct default values', () => {
    const effect = new StatusEffectSchema()
    expect(effect.id).toBe('')
    expect(effect.buffType).toBe('')
    expect(effect.value).toBe(0)
    expect(effect.remainingDuration).toBe(0)
    expect(effect.isDebuff).toBe(false)
  })
})

describe('getStatusEffectValue', () => {
  it('should return 0 when no effects exist', () => {
    const hero = createHero()
    expect(getStatusEffectValue(hero, 'speed')).toBe(0)
  })

  it('should return value of a single matching effect', () => {
    const hero = createHero()
    addEffect(hero, 'aura-haste', 'speed', 80, 3)
    expect(getStatusEffectValue(hero, 'speed')).toBe(80)
  })

  it('should sum values of multiple effects with same buffType', () => {
    const hero = createHero()
    addEffect(hero, 'aura-haste', 'speed', 80, 3)
    addEffect(hero, 'aura-slow', 'speed', -50, 1, true)
    expect(getStatusEffectValue(hero, 'speed')).toBe(30)
  })

  it('should not include effects with different buffType', () => {
    const hero = createHero()
    addEffect(hero, 'aura-haste', 'speed', 80, 3)
    addEffect(hero, 'attack-buff', 'attackSpeed', 20, 5)
    expect(getStatusEffectValue(hero, 'speed')).toBe(80)
    expect(getStatusEffectValue(hero, 'attackSpeed')).toBe(20)
  })

  it('should return 0 for unmatched buffType', () => {
    const hero = createHero()
    addEffect(hero, 'aura-haste', 'speed', 80, 3)
    expect(getStatusEffectValue(hero, 'attackSpeed')).toBe(0)
  })
})

describe('tickBuffs', () => {
  it('should decrement remainingDuration by dt', () => {
    const hero = createHero()
    addEffect(hero, 'aura-haste', 'speed', 80, 3)
    tickBuffs(hero, 0.1)
    expect(hero.statusEffects.get('aura-haste')!.remainingDuration).toBeCloseTo(2.9)
  })

  it('should remove expired effects', () => {
    const hero = createHero()
    addEffect(hero, 'aura-haste', 'speed', 80, 0.05)
    tickBuffs(hero, 0.1)
    expect(hero.statusEffects.has('aura-haste')).toBe(false)
  })

  it('should handle multiple effects — remove expired, keep active', () => {
    const hero = createHero()
    addEffect(hero, 'aura-haste', 'speed', 80, 3)
    addEffect(hero, 'aura-slow', 'speed', -50, 0.05, true)
    tickBuffs(hero, 0.1)
    expect(hero.statusEffects.has('aura-haste')).toBe(true)
    expect(hero.statusEffects.has('aura-slow')).toBe(false)
    expect(hero.statusEffects.get('aura-haste')!.remainingDuration).toBeCloseTo(2.9)
  })

  it('should remove effect at exactly 0 duration', () => {
    const hero = createHero()
    addEffect(hero, 'aura-haste', 'speed', 80, 0.1)
    tickBuffs(hero, 0.1)
    expect(hero.statusEffects.has('aura-haste')).toBe(false)
  })

  it('should do nothing when no effects exist', () => {
    const hero = createHero()
    tickBuffs(hero, 0.1)
    expect(hero.statusEffects.size).toBe(0)
  })
})
