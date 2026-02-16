import { applyDamage } from '@/domain/systems/applyDamage'
import type { CombatEntityState } from '@/domain/types'

function makeEntity(hp: number): CombatEntityState {
  return { id: 'e1', position: { x: 0, y: 0 }, team: 'red', hp, maxHp: 650 }
}

describe('applyDamage', () => {
  it('should reduce HP by damage amount', () => {
    const entity = makeEntity(650)
    const result = applyDamage(entity, 60)
    expect(result.hp).toBe(590)
  })

  it('should clamp HP at 0 when damage exceeds HP', () => {
    const entity = makeEntity(30)
    const result = applyDamage(entity, 60)
    expect(result.hp).toBe(0)
  })

  it('should return a new object (immutable update)', () => {
    const entity = makeEntity(650)
    const result = applyDamage(entity, 60)
    expect(result).not.toBe(entity)
    expect(entity.hp).toBe(650) // original unchanged
  })

  it('should handle zero damage', () => {
    const entity = makeEntity(100)
    const result = applyDamage(entity, 0)
    expect(result.hp).toBe(100)
  })

  it('should handle HP already at 0', () => {
    const entity = makeEntity(0)
    const result = applyDamage(entity, 60)
    expect(result.hp).toBe(0)
  })
})
