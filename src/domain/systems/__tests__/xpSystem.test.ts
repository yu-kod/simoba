import { describe, it, expect } from 'vitest'
import { grantXp } from '@/domain/systems/grantXp'
import { distributeMinionXp, applyXpUpdates } from '@/domain/systems/minionXpDistribution'
import { createHeroState } from '@shared/entities/Hero'
import { MINION_XP_REWARD, XP_GRANT_RANGE } from '@shared/constants'

function createTestHero(overrides: Partial<Parameters<typeof createHeroState>[0]> = {}) {
  return createHeroState({
    id: 'hero-1',
    type: 'BLADE',
    team: 'blue',
    position: { x: 700, y: 360 },
    ...overrides,
  })
}

describe('grantXp', () => {
  it('adds XP to hero', () => {
    const hero = createTestHero()
    const result = grantXp(hero, 20)
    expect(result.xp).toBe(20)
  })

  it('accumulates XP correctly', () => {
    const hero = { ...createTestHero(), xp: 50 }
    const result = grantXp(hero, 20)
    expect(result.xp).toBe(70)
  })

  it('returns new object (immutable)', () => {
    const hero = createTestHero()
    const result = grantXp(hero, 20)
    expect(result).not.toBe(hero)
    expect(hero.xp).toBe(0)
  })

  it('does not change level', () => {
    const hero = createTestHero()
    const result = grantXp(hero, 100)
    expect(result.level).toBe(hero.level)
  })
})

describe('distributeMinionXp', () => {
  it('gives full XP to single hero in range', () => {
    const hero = createTestHero({ id: 'hero-1', team: 'blue', position: { x: 700, y: 360 } })
    const updates = distributeMinionXp({ x: 800, y: 360 }, 'red', [hero])
    expect(updates).toHaveLength(1)
    expect(updates[0]!.heroId).toBe('hero-1')
    expect(updates[0]!.xpGained).toBe(MINION_XP_REWARD)
  })

  it('splits XP equally between 2 heroes', () => {
    const hero1 = createTestHero({ id: 'hero-1', team: 'blue', position: { x: 700, y: 360 } })
    const hero2 = createTestHero({ id: 'hero-2', team: 'blue', position: { x: 750, y: 360 } })
    const updates = distributeMinionXp({ x: 800, y: 360 }, 'red', [hero1, hero2])
    expect(updates).toHaveLength(2)
    expect(updates[0]!.xpGained).toBe(Math.floor(MINION_XP_REWARD / 2))
    expect(updates[1]!.xpGained).toBe(Math.floor(MINION_XP_REWARD / 2))
  })

  it('excludes heroes out of range', () => {
    const near = createTestHero({ id: 'near', team: 'blue', position: { x: 800, y: 360 } })
    const far = createTestHero({
      id: 'far',
      team: 'blue',
      position: { x: 800 + XP_GRANT_RANGE + 100, y: 360 },
    })
    const updates = distributeMinionXp({ x: 800, y: 360 }, 'red', [near, far])
    expect(updates).toHaveLength(1)
    expect(updates[0]!.heroId).toBe('near')
  })

  it('excludes dead heroes', () => {
    const alive = createTestHero({ id: 'alive', team: 'blue', position: { x: 800, y: 360 } })
    const dead = { ...createTestHero({ id: 'dead', team: 'blue', position: { x: 800, y: 360 } }), dead: true as const }
    const updates = distributeMinionXp({ x: 800, y: 360 }, 'red', [alive, dead])
    expect(updates).toHaveLength(1)
    expect(updates[0]!.heroId).toBe('alive')
  })

  it('returns empty when no heroes in range', () => {
    const far = createTestHero({
      id: 'far',
      team: 'blue',
      position: { x: 800 + XP_GRANT_RANGE + 100, y: 360 },
    })
    const updates = distributeMinionXp({ x: 800, y: 360 }, 'red', [far])
    expect(updates).toHaveLength(0)
  })

  it('only grants XP to enemy team of the dead minion', () => {
    const blueHero = createTestHero({ id: 'blue-hero', team: 'blue', position: { x: 800, y: 360 } })
    const redHero = createTestHero({ id: 'red-hero', team: 'red', position: { x: 800, y: 360 } })
    // red minion dies → blue heroes get XP
    const updates = distributeMinionXp({ x: 800, y: 360 }, 'red', [blueHero, redHero])
    expect(updates).toHaveLength(1)
    expect(updates[0]!.heroId).toBe('blue-hero')
  })
})

describe('applyXpUpdates', () => {
  it('applies XP updates to matching heroes', () => {
    const heroes = [
      createTestHero({ id: 'hero-1', team: 'blue' }),
      createTestHero({ id: 'hero-2', team: 'blue' }),
    ]
    const updates = [{ heroId: 'hero-1', xpGained: 10 }]
    const result = applyXpUpdates(heroes, updates)
    expect(result[0]!.xp).toBe(10)
    expect(result[1]!.xp).toBe(0)
  })

  it('returns same hero object if no update', () => {
    const heroes = [createTestHero({ id: 'hero-1' })]
    const result = applyXpUpdates(heroes, [])
    expect(result[0]).toBe(heroes[0])
  })
})
