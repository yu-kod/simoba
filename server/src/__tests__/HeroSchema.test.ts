import { describe, it, expect } from 'vitest'
import { ArraySchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { StatusEffectSchema } from '../schema/StatusEffectSchema.js'

describe('HeroSchema — talent fields', () => {
  it('should initialize acquiredTalents as empty ArraySchema', () => {
    const hero = new HeroSchema()
    expect(hero.acquiredTalents).toBeInstanceOf(ArraySchema)
    expect(hero.acquiredTalents.length).toBe(0)
  })

  it('should initialize ownedSkills as empty ArraySchema', () => {
    const hero = new HeroSchema()
    expect(hero.ownedSkills).toBeInstanceOf(ArraySchema)
    expect(hero.ownedSkills.length).toBe(0)
  })

  it('should initialize skill slots as empty strings', () => {
    const hero = new HeroSchema()
    expect(hero.skillSlotQ).toBe('')
    expect(hero.skillSlotE).toBe('')
    expect(hero.skillSlotR).toBe('')
  })

  it('should initialize talentPoints as 0', () => {
    const hero = new HeroSchema()
    expect(hero.talentPoints).toBe(0)
  })

  it('should initialize level as 0', () => {
    const hero = new HeroSchema()
    expect(hero.level).toBe(0)
  })

  it('should allow pushing to acquiredTalents', () => {
    const hero = new HeroSchema()
    hero.acquiredTalents.push('blade-toughness')
    expect(hero.acquiredTalents.length).toBe(1)
    expect(hero.acquiredTalents.at(0)).toBe('blade-toughness')
  })

  it('should allow pushing to ownedSkills', () => {
    const hero = new HeroSchema()
    hero.ownedSkills.push('blade-charge')
    expect(hero.ownedSkills.length).toBe(1)
    expect(hero.ownedSkills.at(0)).toBe('blade-charge')
  })

  it('should allow setting skill slot values', () => {
    const hero = new HeroSchema()
    hero.skillSlotQ = 'blade-charge'
    hero.skillSlotE = 'blade-cleave'
    hero.skillSlotR = ''
    expect(hero.skillSlotQ).toBe('blade-charge')
    expect(hero.skillSlotE).toBe('blade-cleave')
    expect(hero.skillSlotR).toBe('')
  })
})

describe('HeroSchema — applyDamage with damageReduction', () => {
  function createHero(hp: number): HeroSchema {
    const hero = new HeroSchema()
    hero.hp = hp
    hero.maxHp = hp
    return hero
  }

  function addDamageReduction(hero: HeroSchema, value: number): void {
    const effect = new StatusEffectSchema()
    effect.id = 'blade-fortify'
    effect.buffType = 'damageReduction'
    effect.value = value
    effect.remainingDuration = 4
    effect.isDebuff = false
    hero.statusEffects.set('blade-fortify', effect)
  }

  it('should apply full damage without damageReduction', () => {
    const hero = createHero(500)
    hero.applyDamage(100)
    expect(hero.hp).toBe(400)
  })

  it('should reduce damage by 30% with 0.3 damageReduction', () => {
    const hero = createHero(500)
    addDamageReduction(hero, 0.3)
    hero.applyDamage(100)
    expect(hero.hp).toBe(430)
  })

  it('should reduce damage by 50% with 0.5 damageReduction', () => {
    const hero = createHero(500)
    addDamageReduction(hero, 0.5)
    hero.applyDamage(100)
    expect(hero.hp).toBe(450)
  })

  it('should clamp damageReduction to 100% max', () => {
    const hero = createHero(500)
    addDamageReduction(hero, 1.5)
    hero.applyDamage(100)
    expect(hero.hp).toBe(500)
  })

  it('should still set dead flag when reduced damage kills', () => {
    const hero = createHero(50)
    addDamageReduction(hero, 0.3)
    hero.applyDamage(100)
    // 100 * 0.7 = 70 damage, 50 - 70 = -20 → clamped to 0
    expect(hero.hp).toBe(0)
    expect(hero.dead).toBe(true)
  })

  it('should not apply reduction when hero is dead', () => {
    const hero = createHero(500)
    hero.dead = true
    addDamageReduction(hero, 0.3)
    hero.applyDamage(100)
    expect(hero.hp).toBe(500) // no change — dead heroes ignore damage
  })
})
