import { describe, it, expect } from 'vitest'
import { PlayerSchema } from '../schema/PlayerSchema.js'
import { GameRoomState } from '../schema/GameRoomState.js'

describe('PlayerSchema', () => {
  it('should have default values', () => {
    const player = new PlayerSchema()
    expect(player.x).toBe(0)
    expect(player.y).toBe(0)
    expect(player.facing).toBe(0)
    expect(player.hp).toBe(100)
    expect(player.maxHp).toBe(100)
    expect(player.heroType).toBe('BLADE')
    expect(player.team).toBe('blue')
  })

  it('should allow setting position', () => {
    const player = new PlayerSchema()
    player.x = 320
    player.y = 360
    expect(player.x).toBe(320)
    expect(player.y).toBe(360)
  })
})

describe('GameRoomState', () => {
  it('should start with empty players map', () => {
    const state = new GameRoomState()
    expect(state.players.size).toBe(0)
  })

  it('should add and retrieve players by session id', () => {
    const state = new GameRoomState()
    const player = new PlayerSchema()
    player.x = 100
    player.y = 200

    state.players.set('session-1', player)
    expect(state.players.size).toBe(1)
    expect(state.players.get('session-1')?.x).toBe(100)
  })

  it('should remove players by session id', () => {
    const state = new GameRoomState()
    const player = new PlayerSchema()
    state.players.set('session-1', player)

    state.players.delete('session-1')
    expect(state.players.size).toBe(0)
  })
})
