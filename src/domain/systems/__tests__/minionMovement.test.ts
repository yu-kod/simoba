import { describe, it, expect } from 'vitest'
import { updateMinionMovement } from '@/domain/systems/minionMovement'
import { createMinionState, MELEE_MINION } from '@shared/entities/Minion'

function createTestMinion(overrides: Partial<Parameters<typeof createMinionState>[0]> = {}) {
  return createMinionState({
    id: 'minion-1',
    minionType: 'melee',
    team: 'blue',
    position: { x: 500, y: 360 },
    ...overrides,
  })
}

describe('updateMinionMovement', () => {
  it('blue minion moves right (positive x)', () => {
    const minion = createTestMinion({ team: 'blue' })
    const result = updateMinionMovement(minion, 1.0)
    expect(result.position.x).toBe(500 + MELEE_MINION.stats.speed)
    expect(result.position.y).toBe(360)
  })

  it('red minion moves left (negative x)', () => {
    const minion = createTestMinion({ team: 'red', position: { x: 2500, y: 360 } })
    const result = updateMinionMovement(minion, 1.0)
    expect(result.position.x).toBe(2500 - MELEE_MINION.stats.speed)
    expect(result.position.y).toBe(360)
  })

  it('does not move when attackTargetId is set (in combat)', () => {
    const minion = { ...createTestMinion(), attackTargetId: 'enemy-1' }
    const result = updateMinionMovement(minion, 1.0)
    expect(result.position.x).toBe(500)
    expect(result.position.y).toBe(360)
  })

  it('does not move when dead', () => {
    const minion = { ...createTestMinion(), dead: true as const }
    const result = updateMinionMovement(minion, 1.0)
    expect(result.position.x).toBe(500)
  })

  it('returns same object reference when no movement (combat)', () => {
    const minion = { ...createTestMinion(), attackTargetId: 'enemy-1' }
    const result = updateMinionMovement(minion, 1.0)
    expect(result).toBe(minion)
  })

  it('returns new object when moved (immutable)', () => {
    const minion = createTestMinion()
    const result = updateMinionMovement(minion, 1.0)
    expect(result).not.toBe(minion)
    expect(minion.position.x).toBe(500) // original unchanged
  })

  it('scales movement by deltaSeconds', () => {
    const minion = createTestMinion()
    const result = updateMinionMovement(minion, 0.5)
    expect(result.position.x).toBe(500 + MELEE_MINION.stats.speed * 0.5)
  })

  it('resumes movement after target dies (attackTargetId back to null)', () => {
    const minion = createTestMinion()
    const result = updateMinionMovement(minion, 1.0)
    expect(result.position.x).toBeGreaterThan(500)
  })
})
