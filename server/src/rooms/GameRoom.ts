import { Room, Client } from '@colyseus/core'
import { GameRoomState } from '../schema/GameRoomState.js'
import { PlayerSchema } from '../schema/PlayerSchema.js'

export const MAX_PLAYERS = 2
/** Upper bound for any single damage event (highest base + max growth) */
export const MAX_DAMAGE_PER_HIT = 200
export const MAX_PROJECTILE_SPEED = 1000

export const BLUE_SPAWN = { x: 320, y: 360 } as const
export const RED_SPAWN = { x: 2880, y: 360 } as const

export function isValidDamageMessage(
  message: unknown,
  attackerSessionId: string
): message is { targetId: string; amount: number } {
  if (typeof message !== 'object' || message === null) return false
  const msg = message as Record<string, unknown>
  if (typeof msg.targetId !== 'string' || typeof msg.amount !== 'number') return false
  if (msg.amount <= 0 || msg.amount > MAX_DAMAGE_PER_HIT) return false
  if (msg.targetId === attackerSessionId) return false
  return true
}

export function isValidProjectileMessage(
  message: unknown
): message is { targetId: string; startX: number; startY: number; damage: number; speed: number } {
  if (typeof message !== 'object' || message === null) return false
  const msg = message as Record<string, unknown>
  if (typeof msg.damage !== 'number' || msg.damage <= 0 || msg.damage > MAX_DAMAGE_PER_HIT) return false
  if (typeof msg.speed !== 'number' || msg.speed <= 0 || msg.speed > MAX_PROJECTILE_SPEED) return false
  if (typeof msg.targetId !== 'string') return false
  return true
}

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

    this.onMessage('damage', (client, message: unknown) => {
      if (!isValidDamageMessage(message, client.sessionId)) return

      const target = this.state.players.get(message.targetId)
      if (!target) return
      target.hp = Math.max(0, target.hp - message.amount)
      this.broadcast('damageEvent', {
        targetId: message.targetId,
        amount: message.amount,
        attackerId: client.sessionId,
      })
    })

    this.onMessage('projectileSpawn', (client, message: unknown) => {
      if (!isValidProjectileMessage(message)) return

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

    if (this.state.players.size === this.maxClients) {
      this.state.gameStarted = true
    }
  }

  onLeave(client: Client): void {
    this.state.players.delete(client.sessionId)
  }

  onDispose(): void {
    // cleanup if needed
  }
}
