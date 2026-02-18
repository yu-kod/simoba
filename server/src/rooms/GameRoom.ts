import { Room, Client } from '@colyseus/core'
import { GameRoomState } from '../schema/GameRoomState.js'
import { PlayerSchema } from '../schema/PlayerSchema.js'

const MAX_PLAYERS = 2

const BLUE_SPAWN = { x: 320, y: 360 } as const
const RED_SPAWN = { x: 2880, y: 360 } as const

export class GameRoom extends Room<GameRoomState> {
  maxClients = MAX_PLAYERS

  onCreate(): void {
    this.setState(new GameRoomState())

    this.onMessage('updatePosition', (client, message: { x: number; y: number; facing: number }) => {
      const player = this.state.players.get(client.sessionId)
      if (!player) return
      player.x = message.x
      player.y = message.y
      player.facing = message.facing
    })

    this.onMessage('damage', (client, message: { targetId: string; amount: number }) => {
      const target = this.state.players.get(message.targetId)
      if (!target) return
      target.hp = Math.max(0, target.hp - message.amount)
      this.broadcast('damageEvent', {
        targetId: message.targetId,
        amount: message.amount,
        attackerId: client.sessionId,
      })
    })

    this.onMessage('projectileSpawn', (client, message: { targetId: string; startX: number; startY: number; damage: number; speed: number }) => {
      this.broadcast('projectileSpawnEvent', {
        ...message,
        ownerId: client.sessionId,
      }, { except: client })
    })
  }

  onJoin(client: Client): void {
    const player = new PlayerSchema()
    const isBlue = this.state.players.size === 0
    const spawn = isBlue ? BLUE_SPAWN : RED_SPAWN

    player.x = spawn.x
    player.y = spawn.y
    player.facing = 0
    player.team = isBlue ? 'blue' : 'red'
    player.heroType = 'BLADE'
    player.hp = 100
    player.maxHp = 100

    this.state.players.set(client.sessionId, player)
  }

  onLeave(client: Client): void {
    this.state.players.delete(client.sessionId)
  }

  onDispose(): void {
    // cleanup if needed
  }
}
