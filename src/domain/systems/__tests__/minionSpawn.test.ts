import { describe, it, expect, beforeEach } from 'vitest'
import { spawnWave, createMinionSpawnContext, type MinionSpawnContext } from '@/domain/systems/minionSpawn'
import { getWaveConfig } from '@shared/constants'

describe('spawnWave', () => {
  const config = getWaveConfig(0)
  let ctx: MinionSpawnContext

  beforeEach(() => {
    ctx = createMinionSpawnContext()
  })

  it('spawns correct number of minions (3 melee + 1 ranged)', () => {
    const wave = spawnWave(ctx, 'blue', 0, config)
    expect(wave).toHaveLength(4)
    const melee = wave.filter((m) => m.minionType === 'melee')
    const ranged = wave.filter((m) => m.minionType === 'ranged')
    expect(melee).toHaveLength(3)
    expect(ranged).toHaveLength(1)
  })

  it('blue team spawns at correct positions', () => {
    const wave = spawnWave(ctx, 'blue', 0, config)
    const melee = wave.filter((m) => m.minionType === 'melee')
    const ranged = wave.filter((m) => m.minionType === 'ranged')

    expect(melee[0]!.position).toEqual({ x: 150, y: 340 })
    expect(melee[1]!.position).toEqual({ x: 150, y: 360 })
    expect(melee[2]!.position).toEqual({ x: 150, y: 380 })
    expect(ranged[0]!.position).toEqual({ x: 120, y: 360 })
  })

  it('red team spawns at correct positions', () => {
    const wave = spawnWave(ctx, 'red', 0, config)
    const melee = wave.filter((m) => m.minionType === 'melee')
    const ranged = wave.filter((m) => m.minionType === 'ranged')

    expect(melee[0]!.position).toEqual({ x: 3050, y: 340 })
    expect(melee[1]!.position).toEqual({ x: 3050, y: 360 })
    expect(melee[2]!.position).toEqual({ x: 3050, y: 380 })
    expect(ranged[0]!.position).toEqual({ x: 3080, y: 360 })
  })

  it('sets team correctly', () => {
    const blueWave = spawnWave(ctx, 'blue', 0, config)
    const redWave = spawnWave(ctx, 'red', 0, config)
    expect(blueWave.every((m) => m.team === 'blue')).toBe(true)
    expect(redWave.every((m) => m.team === 'red')).toBe(true)
  })

  it('generates unique ids', () => {
    const wave1 = spawnWave(ctx, 'blue', 0, config)
    const wave2 = spawnWave(ctx, 'blue', 30, config)
    const allIds = [...wave1, ...wave2].map((m) => m.id)
    const uniqueIds = new Set(allIds)
    expect(uniqueIds.size).toBe(allIds.length)
  })

  it('applies statMultiplier from config', () => {
    const buffedConfig = { ...config, statMultiplier: 1.5 }
    const wave = spawnWave(ctx, 'blue', 180, buffedConfig)
    const baseWave = spawnWave(ctx, 'blue', 0, config)
    expect(wave[0]!.hp).toBeGreaterThan(baseWave[0]!.hp)
  })

  it('blue minions face right, red face left', () => {
    const blueWave = spawnWave(ctx, 'blue', 0, config)
    const redWave = spawnWave(ctx, 'red', 0, config)
    expect(blueWave[0]!.facing).toBe(0)
    expect(redWave[0]!.facing).toBe(Math.PI)
  })
})
