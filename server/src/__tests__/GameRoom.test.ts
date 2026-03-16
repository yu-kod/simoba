import { describe, it, expect } from 'vitest'
import { HeroSchema } from '../schema/HeroSchema.js'
import { GameRoomState } from '../schema/GameRoomState.js'
import { MAX_PLAYERS } from '../rooms/GameRoom.js'
import { BLUE_SPAWN, RED_SPAWN } from '@shared/constants'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import type { HeroType } from '@shared/types'

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

describe('matchPhase state flag logic', () => {
  function createMockRoom() {
    const state = new GameRoomState()
    const broadcasts: { type: string }[] = []
    const room = {
      state,
      maxClients: MAX_PLAYERS,
      broadcast(type: string) {
        broadcasts.push({ type })
      },
      onJoin(client: { sessionId: string }, options?: Record<string, unknown>) {
        const hero = new HeroSchema()
        let blueCount = 0
        let redCount = 0
        state.heroes.forEach((h) => {
          if (h.team === 'blue') blueCount++
          else redCount++
        })
        const team = blueCount <= redCount ? 'blue' : 'red'
        const spawn = team === 'blue' ? BLUE_SPAWN : RED_SPAWN
        const heroType: HeroType = (typeof options?.heroType === 'string' && options.heroType in HERO_DEFINITIONS)
          ? options.heroType as HeroType
          : 'BLADE'
        const def = HERO_DEFINITIONS[heroType]
        hero.x = spawn.x
        hero.y = spawn.y
        hero.team = team
        hero.heroType = heroType
        hero.hp = def.base.maxHp
        hero.maxHp = def.base.maxHp
        hero.speed = def.base.speed
        hero.attackDamage = def.base.attackDamage
        state.heroes.set(client.sessionId, hero)
        if (state.heroes.size === room.maxClients) {
          state.matchPhase = 'playing'
        }
      },
    }
    return { room, broadcasts }
  }

  it('should set matchPhase to playing when heroes reach maxClients', () => {
    const { room } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    expect(room.state.matchPhase).toBe('waiting')

    room.onJoin({ sessionId: 'session-2' })
    expect(room.state.matchPhase).toBe('playing')
  })

  it('should keep matchPhase as waiting with only one player', () => {
    const { room } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    expect(room.state.matchPhase).toBe('waiting')
  })

  it('should NOT use broadcast for gameStart (prevents race condition)', () => {
    const { room, broadcasts } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    room.onJoin({ sessionId: 'session-2' })
    const gameStartBroadcasts = broadcasts.filter(b => b.type === 'gameStart')
    expect(gameStartBroadcasts).toEqual([])
  })

  it('should have matchPhase default to waiting on new GameRoomState', () => {
    const state = new GameRoomState()
    expect(state.matchPhase).toBe('waiting')
  })

  it('should apply valid heroType from join options', () => {
    const { room } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' }, { heroType: 'BOLT' })
    const hero = room.state.heroes.get('session-1')!
    expect(hero.heroType).toBe('BOLT')
    expect(hero.maxHp).toBe(HERO_DEFINITIONS.BOLT.base.maxHp)
    expect(hero.speed).toBe(HERO_DEFINITIONS.BOLT.base.speed)
  })

  it('should fall back to BLADE for invalid heroType', () => {
    const { room } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' }, { heroType: 'INVALID' })
    const hero = room.state.heroes.get('session-1')!
    expect(hero.heroType).toBe('BLADE')
    expect(hero.maxHp).toBe(HERO_DEFINITIONS.BLADE.base.maxHp)
  })

  it('should fall back to BLADE when heroType is missing', () => {
    const { room } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    const hero = room.state.heroes.get('session-1')!
    expect(hero.heroType).toBe('BLADE')
  })

  it('should fall back to BLADE when options is empty object', () => {
    const { room } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' }, {})
    const hero = room.state.heroes.get('session-1')!
    expect(hero.heroType).toBe('BLADE')
  })
})

