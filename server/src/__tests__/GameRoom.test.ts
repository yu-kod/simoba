import { describe, it, expect } from 'vitest'
import { HeroSchema } from '../schema/HeroSchema.js'
import { GameRoomState } from '../schema/GameRoomState.js'
import {
  MAX_PLAYERS,
  MAX_DAMAGE_PER_HIT,
  MAX_PROJECTILE_SPEED,
  BLUE_SPAWN,
  RED_SPAWN,
  isValidDamageMessage,
  isValidProjectileMessage,
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

  it('should cap damage at 200', () => {
    expect(MAX_DAMAGE_PER_HIT).toBe(200)
  })

  it('should cap projectile speed at 1000', () => {
    expect(MAX_PROJECTILE_SPEED).toBe(1000)
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

describe('isValidDamageMessage', () => {
  const attacker = 'attacker-1'

  it('accepts valid damage message', () => {
    expect(isValidDamageMessage({ targetId: 'target-1', amount: 60 }, attacker)).toBe(true)
  })

  it('rejects non-object message', () => {
    expect(isValidDamageMessage(null, attacker)).toBe(false)
    expect(isValidDamageMessage('string', attacker)).toBe(false)
    expect(isValidDamageMessage(42, attacker)).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(isValidDamageMessage({}, attacker)).toBe(false)
    expect(isValidDamageMessage({ targetId: 'x' }, attacker)).toBe(false)
    expect(isValidDamageMessage({ amount: 10 }, attacker)).toBe(false)
  })

  it('rejects zero or negative damage', () => {
    expect(isValidDamageMessage({ targetId: 'target-1', amount: 0 }, attacker)).toBe(false)
    expect(isValidDamageMessage({ targetId: 'target-1', amount: -10 }, attacker)).toBe(false)
  })

  it('rejects damage exceeding MAX_DAMAGE_PER_HIT', () => {
    expect(isValidDamageMessage({ targetId: 'target-1', amount: 201 }, attacker)).toBe(false)
    expect(isValidDamageMessage({ targetId: 'target-1', amount: 9999 }, attacker)).toBe(false)
  })

  it('accepts damage at exactly MAX_DAMAGE_PER_HIT', () => {
    expect(isValidDamageMessage({ targetId: 'target-1', amount: 200 }, attacker)).toBe(true)
  })

  it('rejects self-damage', () => {
    expect(isValidDamageMessage({ targetId: attacker, amount: 50 }, attacker)).toBe(false)
  })
})

describe('isValidProjectileMessage', () => {
  const valid = { targetId: 'target-1', startX: 100, startY: 200, damage: 45, speed: 600 }

  it('accepts valid projectile message', () => {
    expect(isValidProjectileMessage(valid)).toBe(true)
  })

  it('rejects non-object message', () => {
    expect(isValidProjectileMessage(null)).toBe(false)
    expect(isValidProjectileMessage('string')).toBe(false)
  })

  it('rejects zero or negative damage', () => {
    expect(isValidProjectileMessage({ ...valid, damage: 0 })).toBe(false)
    expect(isValidProjectileMessage({ ...valid, damage: -5 })).toBe(false)
  })

  it('rejects damage exceeding cap', () => {
    expect(isValidProjectileMessage({ ...valid, damage: 201 })).toBe(false)
  })

  it('rejects zero or negative speed', () => {
    expect(isValidProjectileMessage({ ...valid, speed: 0 })).toBe(false)
    expect(isValidProjectileMessage({ ...valid, speed: -100 })).toBe(false)
  })

  it('rejects speed exceeding cap', () => {
    expect(isValidProjectileMessage({ ...valid, speed: 1001 })).toBe(false)
  })

  it('accepts speed at exactly MAX_PROJECTILE_SPEED', () => {
    expect(isValidProjectileMessage({ ...valid, speed: 1000 })).toBe(true)
  })

  it('rejects missing targetId', () => {
    expect(isValidProjectileMessage({ startX: 100, startY: 200, damage: 45, speed: 600 })).toBe(false)
  })

  it('rejects non-string targetId', () => {
    expect(isValidProjectileMessage({ ...valid, targetId: 123 })).toBe(false)
  })
})
