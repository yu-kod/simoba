import { createProjectile } from '@/domain/projectile/ProjectileState'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'

describe('createProjectile', () => {
  it('should create a ProjectileState with the given parameters', () => {
    const result = createProjectile({
      id: 'projectile-0',
      ownerId: 'hero-1',
      ownerTeam: 'blue',
      targetId: 'enemy-1',
      startPosition: { x: 100, y: 200 },
      damage: 50,
      speed: 600,
      radius: 4,
    })

    expect(result.id).toBe('projectile-0')
    expect(result.ownerId).toBe('hero-1')
    expect(result.ownerTeam).toBe('blue')
    expect(result.targetId).toBe('enemy-1')
    expect(result.position).toEqual({ x: 100, y: 200 })
    expect(result.damage).toBe(50)
    expect(result.speed).toBe(600)
    expect(result.radius).toBe(4)
  })

  it('should use the provided id', () => {
    const a = createProjectile({
      id: 'proj-a',
      ownerId: 'hero-1',
      ownerTeam: 'blue',
      targetId: 'enemy-1',
      startPosition: { x: 0, y: 0 },
      damage: 10,
      speed: 400,
      radius: 5,
    })
    const b = createProjectile({
      id: 'proj-b',
      ownerId: 'hero-1',
      ownerTeam: 'blue',
      targetId: 'enemy-2',
      startPosition: { x: 0, y: 0 },
      damage: 10,
      speed: 400,
      radius: 5,
    })

    expect(a.id).toBe('proj-a')
    expect(b.id).toBe('proj-b')
  })

  it('should return an immutable-shaped object', () => {
    const result: ProjectileState = createProjectile({
      id: 'projectile-test',
      ownerId: 'hero-1',
      ownerTeam: 'red',
      targetId: 'enemy-1',
      startPosition: { x: 50, y: 50 },
      damage: 30,
      speed: 600,
      radius: 4,
    })

    expect(result.id).toBe('projectile-test')
    expect(result.position.x).toBe(50)
    expect(result.position.y).toBe(50)
  })
})
