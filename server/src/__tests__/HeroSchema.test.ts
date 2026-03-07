import { describe, it, expect } from 'vitest'
import { ArraySchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'

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
