import { updateProjectile } from '@/domain/projectile/updateProjectile'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'

const baseProjectile: ProjectileState = {
  id: 'projectile-0',
  ownerId: 'hero-1',
  ownerTeam: 'blue',
  targetId: 'enemy-1',
  position: { x: 100, y: 100 },
  damage: 50,
  speed: 600,
  radius: 4,
}

describe('updateProjectile', () => {
  it('should move toward the target along the x-axis', () => {
    // Spec scenario: (100,100) → target (400,100), speed 600, dt 0.016
    // moveDistance = 600 * 0.016 = 9.6, direction = (1, 0)
    const result = updateProjectile(
      baseProjectile,
      { x: 400, y: 100 },
      0.016
    )

    expect(result.position.x).toBeCloseTo(109.6)
    expect(result.position.y).toBeCloseTo(100)
  })

  it('should move toward a target on the y-axis', () => {
    const result = updateProjectile(
      baseProjectile,
      { x: 100, y: 400 },
      0.016
    )

    expect(result.position.x).toBeCloseTo(100)
    expect(result.position.y).toBeCloseTo(109.6)
  })

  it('should move diagonally toward a target', () => {
    // direction to (400, 400) from (100,100) is (1/√2, 1/√2)
    // moveDistance = 600 * 0.016 = 9.6
    const result = updateProjectile(
      baseProjectile,
      { x: 400, y: 400 },
      0.016
    )

    const expected = 9.6 / Math.SQRT2
    expect(result.position.x).toBeCloseTo(100 + expected)
    expect(result.position.y).toBeCloseTo(100 + expected)
  })

  it('should return original projectile when already at target position', () => {
    const result = updateProjectile(
      baseProjectile,
      { x: 100, y: 100 },
      0.016
    )

    expect(result).toBe(baseProjectile)
  })

  it('should not mutate the original projectile', () => {
    const original = { ...baseProjectile }
    updateProjectile(baseProjectile, { x: 400, y: 100 }, 0.016)

    expect(baseProjectile.position).toEqual(original.position)
  })

  it('should track a moved target (homing)', () => {
    // First frame: target at (400, 100)
    const after1 = updateProjectile(
      baseProjectile,
      { x: 400, y: 100 },
      0.016
    )
    // Second frame: target moved to (100, 400) — should redirect
    const after2 = updateProjectile(after1, { x: 100, y: 400 }, 0.016)

    // After frame 1: x ≈ 109.6, y = 100
    // Direction to (100, 400) from (109.6, 100): mostly downward
    expect(after2.position.y).toBeGreaterThan(after1.position.y)
  })
})
