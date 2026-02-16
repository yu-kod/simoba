import { findClickTarget } from '@/domain/systems/findClickTarget'
import type { CombatEntityState } from '@/domain/types'

function makeEnemy(
  id: string,
  x: number,
  y: number,
  hp = 100
): CombatEntityState {
  return { id, position: { x, y }, team: 'red', hp, maxHp: hp }
}

const defaultRadius = () => 20

describe('findClickTarget', () => {
  it('should return enemy when click is within radius', () => {
    const enemy = makeEnemy('e1', 100, 100)
    const result = findClickTarget({ x: 110, y: 100 }, [enemy], defaultRadius)
    expect(result).toBe(enemy)
  })

  it('should return null when click is outside all enemies', () => {
    const enemy = makeEnemy('e1', 100, 100)
    const result = findClickTarget({ x: 200, y: 200 }, [enemy], defaultRadius)
    expect(result).toBeNull()
  })

  it('should return the closest enemy when multiple are hit', () => {
    const far = makeEnemy('far', 100, 100)
    const close = makeEnemy('close', 95, 100)
    // Click at (90, 100) — within radius of both, but closer to 'close'
    const result = findClickTarget(
      { x: 90, y: 100 },
      [far, close],
      defaultRadius
    )
    expect(result?.id).toBe('close')
  })

  it('should return null for empty enemies array', () => {
    const result = findClickTarget({ x: 0, y: 0 }, [], defaultRadius)
    expect(result).toBeNull()
  })

  it('should return enemy when click is exactly on the edge', () => {
    const enemy = makeEnemy('e1', 100, 100)
    // Click exactly 20 units away (on edge of radius)
    const result = findClickTarget({ x: 120, y: 100 }, [enemy], defaultRadius)
    expect(result).toBe(enemy)
  })

  it('should use per-entity radius from getRadius callback', () => {
    const small = makeEnemy('small', 100, 100)
    const big = makeEnemy('big', 100, 130)
    const getRadius = (e: CombatEntityState) => (e.id === 'big' ? 40 : 10)

    // Click at (100, 120) — within big's radius but outside small's
    const result = findClickTarget({ x: 100, y: 120 }, [small, big], getRadius)
    expect(result?.id).toBe('big')
  })
})
