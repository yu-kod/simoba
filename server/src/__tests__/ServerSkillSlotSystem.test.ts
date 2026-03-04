import { describe, it, expect, beforeEach } from 'vitest'
import { HeroSchema } from '../schema/HeroSchema.js'
import { assignSkillSlot, swapSkillSlots, unequipSkillSlot } from '../game/ServerSkillSlotSystem.js'

function createTestHero(): HeroSchema {
  const hero = new HeroSchema()
  hero.ownedSkills.push('blade-charge')
  hero.ownedSkills.push('blade-cleave')
  return hero
}

function ownedSkillsArray(hero: HeroSchema): string[] {
  const result: string[] = []
  for (let i = 0; i < hero.ownedSkills.length; i++) {
    result.push(hero.ownedSkills.at(i)!)
  }
  return result
}

describe('assignSkillSlot', () => {
  let hero: HeroSchema

  beforeEach(() => {
    hero = createTestHero()
  })

  it('should assign owned skill to empty slot', () => {
    const result = assignSkillSlot(hero, 'blade-charge', 'Q')
    expect(result).toBe(true)
    expect(hero.skillSlotQ).toBe('blade-charge')
  })

  it('should remove assigned skill from ownedSkills', () => {
    assignSkillSlot(hero, 'blade-charge', 'Q')
    expect(ownedSkillsArray(hero)).toEqual(['blade-cleave'])
  })

  it('should reject skill not in ownedSkills', () => {
    const result = assignSkillSlot(hero, 'nonexistent', 'Q')
    expect(result).toBe(false)
    expect(hero.skillSlotQ).toBe('')
  })

  it('should reject assignment to non-empty slot', () => {
    hero.skillSlotQ = 'blade-charge'
    const result = assignSkillSlot(hero, 'blade-cleave', 'Q')
    expect(result).toBe(false)
    expect(hero.skillSlotQ).toBe('blade-charge')
  })

  it('should assign to different slots independently', () => {
    assignSkillSlot(hero, 'blade-charge', 'Q')
    assignSkillSlot(hero, 'blade-cleave', 'E')
    expect(hero.skillSlotQ).toBe('blade-charge')
    expect(hero.skillSlotE).toBe('blade-cleave')
    expect(ownedSkillsArray(hero)).toEqual([])
  })
})

describe('swapSkillSlots', () => {
  let hero: HeroSchema

  beforeEach(() => {
    hero = createTestHero()
    hero.skillSlotQ = 'blade-charge'
    hero.skillSlotE = 'blade-cleave'
  })

  it('should swap slots when in base', () => {
    const result = swapSkillSlots(hero, 'Q', 'E', true)
    expect(result).toBe(true)
    expect(hero.skillSlotQ).toBe('blade-cleave')
    expect(hero.skillSlotE).toBe('blade-charge')
  })

  it('should reject swap when not in base', () => {
    const result = swapSkillSlots(hero, 'Q', 'E', false)
    expect(result).toBe(false)
    expect(hero.skillSlotQ).toBe('blade-charge')
    expect(hero.skillSlotE).toBe('blade-cleave')
  })

  it('should reject swap with same slot', () => {
    const result = swapSkillSlots(hero, 'Q', 'Q', true)
    expect(result).toBe(false)
  })

  it('should swap with empty slot (effectively moving)', () => {
    hero.skillSlotR = ''
    const result = swapSkillSlots(hero, 'Q', 'R', true)
    expect(result).toBe(true)
    expect(hero.skillSlotQ).toBe('')
    expect(hero.skillSlotR).toBe('blade-charge')
  })
})

describe('unequipSkillSlot', () => {
  let hero: HeroSchema

  beforeEach(() => {
    hero = createTestHero()
    hero.skillSlotQ = 'blade-charge'
  })

  it('should unequip slot when in base', () => {
    const result = unequipSkillSlot(hero, 'Q', true)
    expect(result).toBe(true)
    expect(hero.skillSlotQ).toBe('')
  })

  it('should return skill to ownedSkills on unequip', () => {
    unequipSkillSlot(hero, 'Q', true)
    expect(ownedSkillsArray(hero)).toContain('blade-charge')
  })

  it('should reject unequip when not in base', () => {
    const result = unequipSkillSlot(hero, 'Q', false)
    expect(result).toBe(false)
    expect(hero.skillSlotQ).toBe('blade-charge')
  })

  it('should reject unequip on empty slot', () => {
    const result = unequipSkillSlot(hero, 'E', true)
    expect(result).toBe(false)
  })
})
