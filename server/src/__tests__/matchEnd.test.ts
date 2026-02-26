import { describe, it, expect } from 'vitest'
import { GameRoomState } from '../schema/GameRoomState.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { HeroSchema } from '../schema/HeroSchema.js'
import { checkTowerDestroyed, endMatch } from '../game/ServerMatchSystem.js'
import { MAX_PLAYERS, BLUE_SPAWN, RED_SPAWN } from '../rooms/GameRoom.js'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import { DEFAULT_TOWER } from '@shared/entities/Tower'
import { WORLD_WIDTH, WORLD_HEIGHT } from '@shared/constants'
import type { HeroType } from '@shared/types'

const TOWER_DISTANCE_FROM_EDGE = 600
const TOWER_BLUE_POS = { x: TOWER_DISTANCE_FROM_EDGE, y: WORLD_HEIGHT / 2 }
const TOWER_RED_POS = { x: WORLD_WIDTH - TOWER_DISTANCE_FROM_EDGE, y: WORLD_HEIGHT / 2 }

function createTower(id: string, team: string, pos: { x: number; y: number }): TowerSchema {
  const tower = new TowerSchema()
  tower.id = id
  tower.x = pos.x
  tower.y = pos.y
  tower.team = team
  tower.hp = DEFAULT_TOWER.stats.maxHp
  tower.maxHp = DEFAULT_TOWER.stats.maxHp
  tower.dead = false
  tower.radius = DEFAULT_TOWER.radius
  tower.attackDamage = DEFAULT_TOWER.stats.attackDamage
  tower.attackRange = DEFAULT_TOWER.stats.attackRange
  tower.attackSpeed = DEFAULT_TOWER.stats.attackSpeed
  tower.attackCooldown = 0
  tower.attackTargetId = ''
  tower.projectileSpeed = DEFAULT_TOWER.projectileSpeed
  tower.projectileRadius = DEFAULT_TOWER.projectileRadius
  return tower
}

function createPlayingState(): GameRoomState {
  const state = new GameRoomState()
  state.matchPhase = 'playing'
  state.winnerTeam = ''
  state.towers.set('tower-blue', createTower('tower-blue', 'blue', TOWER_BLUE_POS))
  state.towers.set('tower-red', createTower('tower-red', 'red', TOWER_RED_POS))
  return state
}

describe('matchPhase state management', () => {
  it('should default to waiting phase with empty winnerTeam', () => {
    const state = new GameRoomState()
    expect(state.matchPhase).toBe('waiting')
    expect(state.winnerTeam).toBe('')
  })

  it('should transition to playing when match starts', () => {
    const state = new GameRoomState()
    state.matchPhase = 'playing'
    expect(state.matchPhase).toBe('playing')
  })
})

describe('endMatch', () => {
  it('should set matchPhase to finished and winnerTeam', () => {
    const state = createPlayingState()
    endMatch(state, 'blue')
    expect(state.matchPhase).toBe('finished')
    expect(state.winnerTeam).toBe('blue')
  })

  it('should be idempotent — second call does not change winnerTeam', () => {
    const state = createPlayingState()
    endMatch(state, 'blue')
    endMatch(state, 'red')
    expect(state.matchPhase).toBe('finished')
    expect(state.winnerTeam).toBe('blue')
  })
})

describe('checkTowerDestroyed', () => {
  it('should end match with red as winner when blue tower is destroyed', () => {
    const state = createPlayingState()
    state.towers.get('tower-blue')!.dead = true

    checkTowerDestroyed(state.towers, (winner) => endMatch(state, winner))
    expect(state.matchPhase).toBe('finished')
    expect(state.winnerTeam).toBe('red')
  })

  it('should end match with blue as winner when red tower is destroyed', () => {
    const state = createPlayingState()
    state.towers.get('tower-red')!.dead = true

    checkTowerDestroyed(state.towers, (winner) => endMatch(state, winner))
    expect(state.matchPhase).toBe('finished')
    expect(state.winnerTeam).toBe('blue')
  })

  it('should keep playing when both towers are alive', () => {
    const state = createPlayingState()
    checkTowerDestroyed(state.towers, (winner) => endMatch(state, winner))
    expect(state.matchPhase).toBe('playing')
    expect(state.winnerTeam).toBe('')
  })

  it('should not change winner if both towers are destroyed simultaneously', () => {
    const state = createPlayingState()
    state.towers.get('tower-blue')!.dead = true
    state.towers.get('tower-red')!.dead = true

    checkTowerDestroyed(state.towers, (winner) => endMatch(state, winner))
    expect(state.matchPhase).toBe('finished')
    // First tower checked wins — idempotent endMatch prevents overwrite
    expect(['blue', 'red']).toContain(state.winnerTeam)
  })
})

describe('match start via onJoin pattern', () => {
  function createMockRoom() {
    const state = new GameRoomState()
    const room = {
      state,
      maxClients: MAX_PLAYERS,
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
    return room
  }

  it('should set matchPhase to playing when all players join', () => {
    const room = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    expect(room.state.matchPhase).toBe('waiting')

    room.onJoin({ sessionId: 'session-2' })
    expect(room.state.matchPhase).toBe('playing')
  })

  it('should keep matchPhase as waiting with only one player', () => {
    const room = createMockRoom()
    room.onJoin({ sessionId: 'session-1' })
    expect(room.state.matchPhase).toBe('waiting')
  })
})
