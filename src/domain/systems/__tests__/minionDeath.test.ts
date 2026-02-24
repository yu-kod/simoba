import { describe, it, expect } from 'vitest'
import { processMinionDeaths } from '@/domain/systems/minionDeath'
import { createMinionState } from '@shared/entities/Minion'
import { createHeroState } from '@shared/entities/Hero'
import { MINION_XP_REWARD } from '@shared/constants'

function createTestHero(
  overrides: Partial<Parameters<typeof createHeroState>[0]> = {},
) {
  return createHeroState({
    id: 'hero-1',
    type: 'BLADE',
    team: 'blue',
    position: { x: 800, y: 360 },
    ...overrides,
  })
}

function createDeadMinion(
  overrides: Partial<Parameters<typeof createMinionState>[0]> = {},
) {
  const minion = createMinionState({
    id: 'dead-minion',
    minionType: 'melee',
    team: 'red',
    position: { x: 800, y: 360 },
    ...overrides,
  })
  return { ...minion, hp: 0, dead: true as const }
}

describe('processMinionDeaths', () => {
  it('returns dead minion ids', () => {
    const dead = createDeadMinion()
    const result = processMinionDeaths([dead], [])
    expect(result.deadMinionIds).toEqual(['dead-minion'])
  })

  it('distributes XP to nearby enemy hero', () => {
    const dead = createDeadMinion({ team: 'red' })
    const hero = createTestHero({ team: 'blue', position: { x: 800, y: 360 } })
    const result = processMinionDeaths([dead], [hero])
    expect(result.xpUpdates).toHaveLength(1)
    expect(result.xpUpdates[0]!.heroId).toBe('hero-1')
    expect(result.xpUpdates[0]!.xpGained).toBe(MINION_XP_REWARD)
  })

  it('ignores alive minions', () => {
    const alive = createMinionState({
      id: 'alive-minion',
      minionType: 'melee',
      team: 'red',
      position: { x: 800, y: 360 },
    })
    const result = processMinionDeaths([alive], [])
    expect(result.deadMinionIds).toHaveLength(0)
    expect(result.xpUpdates).toHaveLength(0)
  })

  it('handles multiple dead minions', () => {
    const dead1 = createDeadMinion({ id: 'dead-1', team: 'red' })
    const dead2 = createDeadMinion({ id: 'dead-2', team: 'red' })
    const hero = createTestHero({ team: 'blue', position: { x: 800, y: 360 } })
    const result = processMinionDeaths([dead1, dead2], [hero])
    expect(result.deadMinionIds).toHaveLength(2)
    expect(result.xpUpdates).toHaveLength(2)
  })

  it('does not grant XP to same-team heroes', () => {
    const dead = createDeadMinion({ team: 'red' })
    const redHero = createTestHero({ id: 'red-hero', team: 'red', position: { x: 800, y: 360 } })
    const result = processMinionDeaths([dead], [redHero])
    expect(result.xpUpdates).toHaveLength(0)
  })
})
