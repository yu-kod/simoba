import { describe, it, expect } from 'vitest'
import { HeroSchema } from '../schema/HeroSchema.js'

function createEntity(hp: number, maxHp: number, dead = false): HeroSchema {
  const e = new HeroSchema()
  e.hp = hp
  e.maxHp = maxHp
  e.dead = dead
  return e
}

describe('CombatEntitySchema.applyHeal', () => {
  it('should increase HP by healAmount', () => {
    const e = createEntity(200, 500)
    e.applyHeal(100)
    expect(e.hp).toBe(300)
  })

  it('should clamp HP to maxHp', () => {
    const e = createEntity(480, 500)
    e.applyHeal(100)
    expect(e.hp).toBe(500)
  })

  it('should do nothing when entity is dead', () => {
    const e = createEntity(0, 500, true)
    e.applyHeal(100)
    expect(e.hp).toBe(0)
    expect(e.dead).toBe(true)
  })

  it('should not change HP when already at maxHp', () => {
    const e = createEntity(500, 500)
    e.applyHeal(100)
    expect(e.hp).toBe(500)
  })

  it('should do nothing when amount is zero', () => {
    const e = createEntity(200, 500)
    e.applyHeal(0)
    expect(e.hp).toBe(200)
  })

  it('should do nothing when amount is negative', () => {
    const e = createEntity(200, 500)
    e.applyHeal(-50)
    expect(e.hp).toBe(200)
  })
})
