import { describe, it, expect } from 'vitest'
import { DEBUG_SKILL_SLOTS } from '../skillSlotConfig'

describe('DEBUG_SKILL_SLOTS', () => {
  it('should contain exactly 3 slots', () => {
    expect(DEBUG_SKILL_SLOTS).toHaveLength(3)
  })

  it('should have 1 active, 1 passive, and 1 empty slot', () => {
    const active = DEBUG_SKILL_SLOTS.filter(s => s.type === 'active')
    const passive = DEBUG_SKILL_SLOTS.filter(s => s.type === 'passive')
    const empty = DEBUG_SKILL_SLOTS.filter(s => s.type === 'empty')

    expect(active).toHaveLength(1)
    expect(passive).toHaveLength(1)
    expect(empty).toHaveLength(1)
  })

  it('should assign key label only to active slot', () => {
    const active = DEBUG_SKILL_SLOTS.find(s => s.type === 'active')!
    const passive = DEBUG_SKILL_SLOTS.find(s => s.type === 'passive')!
    const empty = DEBUG_SKILL_SLOTS.find(s => s.type === 'empty')!

    expect(active.key).toBe('Q')
    expect(passive.key).toBeUndefined()
    expect(empty.key).toBeUndefined()
  })

  it('should set cooldownMax only on active slot', () => {
    const active = DEBUG_SKILL_SLOTS.find(s => s.type === 'active')!
    const passive = DEBUG_SKILL_SLOTS.find(s => s.type === 'passive')!

    expect(active.cooldownMax).toBe(8)
    expect(passive.cooldownMax).toBeUndefined()
  })
})
