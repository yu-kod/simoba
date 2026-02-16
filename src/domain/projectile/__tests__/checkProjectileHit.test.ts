import { checkProjectileHit } from '@/domain/projectile/checkProjectileHit'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'

const baseProjectile: ProjectileState = {
  id: 'projectile-0',
  ownerId: 'hero-1',
  ownerTeam: 'blue',
  targetId: 'enemy-1',
  position: { x: 198, y: 100 },
  damage: 50,
  speed: 600,
  radius: 4,
}

describe('checkProjectileHit', () => {
  it('should return true when distance ≤ targetRadius + projectileRadius', () => {
    // Spec scenario: projectile(radius 4) at (198,100), target(radius 18) at (200,100)
    // distance = 2, threshold = 18 + 4 = 22 → hit
    const result = checkProjectileHit(
      baseProjectile,
      { x: 200, y: 100 },
      18
    )

    expect(result).toBe(true)
  })

  it('should return false when distance > targetRadius + projectileRadius', () => {
    // Spec scenario: projectile(radius 4) at (150,100), target(radius 18) at (200,100)
    // distance = 50, threshold = 22 → miss
    const farProjectile: ProjectileState = {
      ...baseProjectile,
      position: { x: 150, y: 100 },
    }
    const result = checkProjectileHit(
      farProjectile,
      { x: 200, y: 100 },
      18
    )

    expect(result).toBe(false)
  })

  it('should return true when projectile is exactly on the target', () => {
    const overlapping: ProjectileState = {
      ...baseProjectile,
      position: { x: 200, y: 100 },
    }
    const result = checkProjectileHit(
      overlapping,
      { x: 200, y: 100 },
      18
    )

    expect(result).toBe(true)
  })

  it('should return true when distance exactly equals combined radii', () => {
    // projectile(radius 4) at (178,100), target(radius 18) at (200,100)
    // distance = 22, threshold = 22 → hit (boundary case)
    const boundary: ProjectileState = {
      ...baseProjectile,
      position: { x: 178, y: 100 },
    }
    const result = checkProjectileHit(
      boundary,
      { x: 200, y: 100 },
      18
    )

    expect(result).toBe(true)
  })

  it('should handle diagonal distances correctly', () => {
    // projectile at (197,97), target at (200,100)
    // distance = sqrt(9+9) ≈ 4.24, threshold = 22 → hit
    const diagonal: ProjectileState = {
      ...baseProjectile,
      position: { x: 197, y: 97 },
    }
    const result = checkProjectileHit(
      diagonal,
      { x: 200, y: 100 },
      18
    )

    expect(result).toBe(true)
  })
})
