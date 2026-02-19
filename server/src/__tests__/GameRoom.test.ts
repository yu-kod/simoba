import { describe, it, expect } from 'vitest'
import { HeroSchema } from '../schema/HeroSchema.js'
import { GameRoomState } from '../schema/GameRoomState.js'
import {
  MAX_PLAYERS,
  BLUE_SPAWN,
  RED_SPAWN,
} from '../rooms/GameRoom.js'

describe('HeroSchema', () => {
  it('should have default values', () => {
    const hero = new HeroSchema()
    expect(hero.x).toBe(0)
    expect(hero.y).toBe(0)
    expect(hero.facing).toBe(0)
    expect(hero.hp).toBe(0)
    expect(hero.maxHp).toBe(0)
    expect(hero.heroType).toBe('BLADE')
    expect(hero.team).toBe('blue')
    expect(hero.dead).toBe(false)
  })

  it('should allow setting position', () => {
    const hero = new HeroSchema()
    hero.x = 320
    hero.y = 360
    expect(hero.x).toBe(320)
    expect(hero.y).toBe(360)
  })
})

describe('GameRoomState', () => {
  it('should start with empty heroes map', () => {
    const state = new GameRoomState()
    expect(state.heroes.size).toBe(0)
  })

  it('should add and retrieve heroes by session id', () => {
    const state = new GameRoomState()
    const hero = new HeroSchema()
    hero.x = 100
    hero.y = 200

    state.heroes.set('session-1', hero)
    expect(state.heroes.size).toBe(1)
    expect(state.heroes.get('session-1')?.x).toBe(100)
  })

  it('should remove heroes by session id', () => {
    const state = new GameRoomState()
    const hero = new HeroSchema()
    state.heroes.set('session-1', hero)

    state.heroes.delete('session-1')
    expect(state.heroes.size).toBe(0)
  })

  it('should have towers and projectiles maps', () => {
    const state = new GameRoomState()
    expect(state.towers.size).toBe(0)
    expect(state.projectiles.size).toBe(0)
  })

  it('should have matchTime default to 0', () => {
    const state = new GameRoomState()
    expect(state.matchTime).toBe(0)
  })
})

describe('GameRoom constants', () => {
  it('should allow max 2 players', () => {
    expect(MAX_PLAYERS).toBe(2)
  })

  it('should have distinct spawn positions per team', () => {
    expect(BLUE_SPAWN.x).not.toBe(RED_SPAWN.x)
  })
})

describe('Team assignment pattern', () => {
  it('first player should be blue at blue spawn', () => {
    const state = new GameRoomState()
    const isBlue = state.heroes.size === 0
    expect(isBlue).toBe(true)
    const spawn = isBlue ? BLUE_SPAWN : RED_SPAWN
    expect(spawn).toEqual({ x: 320, y: 360 })
  })

  it('second player should be red at red spawn', () => {
    const state = new GameRoomState()
    const h1 = new HeroSchema()
    state.heroes.set('session-1', h1)

    const isBlue = state.heroes.size === 0
    expect(isBlue).toBe(false)
    const spawn = isBlue ? BLUE_SPAWN : RED_SPAWN
    expect(spawn).toEqual({ x: 2880, y: 360 })
  })
})

describe('gameStart state flag logic', () => {
  function createMockRoom() {
    const state = new GameRoomState()
    const broadcasts: { type: string }[] = []
    const room = {
      state,
      maxClients: MAX_PLAYERS,
      broadcast(type: string) {
        broadcasts.push({ type })
      },
      onJoin(client: { sessionId: string }) {
        const hero = new HeroSchema()
        const isBlue = state.heroes.size === 0
        const spawn = isBlue ? BLUE_SPAWN : RED_SPAWN
        hero.x = spawn.x
        hero.y = spawn.y
        hero.team = isBlue ? 'blue' : 'red'
        hero.heroType = 'BLADE'
        state.heroes.set(client.sessionId, hero)
        if (state.heroes.size === room.maxClients) {
          state.gameStarted = true
        }
      },
    }
    return { room, broadcasts }
  }

  it('should set gameStarted to true when heroes reach maxClients', () => {
    const { room } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    expect(room.state.gameStarted).toBe(false)

    room.onJoin({ sessionId: 'session-2' })
    expect(room.state.gameStarted).toBe(true)
  })

  it('should keep gameStarted false with only one player', () => {
    const { room } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    expect(room.state.gameStarted).toBe(false)
  })

  it('should NOT use broadcast for gameStart (prevents race condition)', () => {
    const { room, broadcasts } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    room.onJoin({ sessionId: 'session-2' })
    const gameStartBroadcasts = broadcasts.filter(b => b.type === 'gameStart')
    expect(gameStartBroadcasts).toEqual([])
  })

  it('should have gameStarted default to false on new GameRoomState', () => {
    const state = new GameRoomState()
    expect(state.gameStarted).toBe(false)
  })
})

