import { updateProjectiles } from '@/domain/projectile/updateProjectiles'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'
import type { CombatEntityState } from '@/domain/types'

function makeTarget(
  overrides: Partial<CombatEntityState> = {}
): CombatEntityState {
  return {
    id: 'enemy-1',
    position: { x: 200, y: 100 },
    team: 'red',
    hp: 100,
    maxHp: 100,
    ...overrides,
  }
}

function makeProjectile(
  overrides: Partial<ProjectileState> = {}
): ProjectileState {
  return {
    id: 'projectile-test',
    ownerId: 'hero-1',
    ownerTeam: 'blue',
    targetId: 'enemy-1',
    position: { x: 100, y: 100 },
    damage: 50,
    speed: 600,
    radius: 4,
    ...overrides,
  }
}

const DEFAULT_RADIUS = 18
const radiusLookup = () => DEFAULT_RADIUS

describe('updateProjectiles', () => {
  it('should move projectiles toward their targets', () => {
    const projectile = makeProjectile()
    const target = makeTarget()

    const result = updateProjectiles([projectile], [target], 0.016, radiusLookup)

    expect(result.projectiles).toHaveLength(1)
    expect(result.projectiles[0]!.position.x).toBeGreaterThan(100)
    expect(result.damageEvents).toHaveLength(0)
  })

  it('should emit DamageEvent and remove projectile on hit', () => {
    // Place projectile very close to target (within hit radius)
    const projectile = makeProjectile({ position: { x: 199, y: 100 } })
    const target = makeTarget()

    const result = updateProjectiles([projectile], [target], 0.016, radiusLookup)

    expect(result.projectiles).toHaveLength(0)
    expect(result.damageEvents).toHaveLength(1)
    expect(result.damageEvents[0]).toEqual({
      attackerId: 'hero-1',
      targetId: 'enemy-1',
      damage: 50,
    })
  })

  it('should handle multiple projectiles with one hitting', () => {
    // Spec scenario: 3 projectiles, 1 hits
    const hitting = makeProjectile({
      id: 'p-hit',
      position: { x: 199, y: 100 },
    })
    const flying1 = makeProjectile({
      id: 'p-fly-1',
      position: { x: 50, y: 100 },
    })
    const flying2 = makeProjectile({
      id: 'p-fly-2',
      position: { x: 80, y: 100 },
    })
    const target = makeTarget()

    const result = updateProjectiles(
      [hitting, flying1, flying2],
      [target],
      0.016,
      radiusLookup
    )

    expect(result.damageEvents).toHaveLength(1)
    expect(result.projectiles).toHaveLength(2)
  })

  it('should remove projectiles whose target is dead (HP ≤ 0)', () => {
    // Spec scenario: target dead, 2 projectiles chasing it
    const p1 = makeProjectile({ id: 'p1' })
    const p2 = makeProjectile({ id: 'p2' })
    const deadTarget = makeTarget({ hp: 0 })

    const result = updateProjectiles([p1, p2], [deadTarget], 0.016, radiusLookup)

    expect(result.projectiles).toHaveLength(0)
    expect(result.damageEvents).toHaveLength(0)
  })

  it('should remove projectiles whose target no longer exists', () => {
    const p = makeProjectile({ targetId: 'nonexistent' })
    const target = makeTarget() // id = enemy-1, not nonexistent

    const result = updateProjectiles([p], [target], 0.016, radiusLookup)

    expect(result.projectiles).toHaveLength(0)
    expect(result.damageEvents).toHaveLength(0)
  })

  it('should return empty arrays when no projectiles exist', () => {
    const result = updateProjectiles([], [], 0.016, radiusLookup)

    expect(result.projectiles).toHaveLength(0)
    expect(result.damageEvents).toHaveLength(0)
  })

  it('should not mutate the original projectile array', () => {
    const projectile = makeProjectile()
    const target = makeTarget()
    const original = [projectile]

    updateProjectiles(original, [target], 0.016, radiusLookup)

    expect(original).toHaveLength(1)
    expect(original[0]).toBe(projectile)
  })
})
