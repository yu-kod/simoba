import { describe, it, expect } from 'vitest'
import { PlayerSchema } from '../schema/PlayerSchema.js'
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
    const isBlue = state.players.size === 0
    expect(isBlue).toBe(true)
    const spawn = isBlue ? BLUE_SPAWN : RED_SPAWN
    expect(spawn).toEqual({ x: 320, y: 360 })
  })

  it('second player should be red at red spawn', () => {
    const state = new GameRoomState()
    const p1 = new PlayerSchema()
    state.players.set('session-1', p1)

    const isBlue = state.players.size === 0
    expect(isBlue).toBe(false)
    const spawn = isBlue ? BLUE_SPAWN : RED_SPAWN
    expect(spawn).toEqual({ x: 2880, y: 360 })
  })
})

describe('gameStart broadcast logic', () => {
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
        const player = new PlayerSchema()
        const isBlue = state.players.size === 0
        const spawn = isBlue ? BLUE_SPAWN : RED_SPAWN
        player.x = spawn.x
        player.y = spawn.y
        player.team = isBlue ? 'blue' : 'red'
        player.heroType = 'BLADE'
        player.hp = 100
        player.maxHp = 100
        state.players.set(client.sessionId, player)
        if (state.players.size === room.maxClients) {
          room.broadcast('gameStart')
        }
      },
    }
    return { room, broadcasts }
  }

  it('should broadcast gameStart when players reach maxClients', () => {
    const { room, broadcasts } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    expect(broadcasts).toEqual([])

    room.onJoin({ sessionId: 'session-2' })
    expect(broadcasts).toEqual([{ type: 'gameStart' }])
  })

  it('should not broadcast gameStart with only one player', () => {
    const { room, broadcasts } = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    expect(broadcasts).toEqual([])
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
