import type { Room } from 'colyseus.js'
import { getStateCallbacks } from 'colyseus.js'
import type { HeroState } from '@/domain/entities/Hero'
import type {
  GameMode,
  DamageEvent,
  ProjectileSpawnEvent,
  RemotePlayerState,
} from '@/network/GameMode'
import { NetworkClient } from '@/network/NetworkClient'

const SEND_INTERVAL_MS = 50 // 20Hz

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StateCallbacks = (instance: any) => any

export class OnlineGameMode implements GameMode {
  private networkClient: NetworkClient | null
  private room: Room | null = null
  private $: StateCallbacks | null = null
  private sendTimer = 0
  private lastSentState: { x: number; y: number; facing: number } | null = null

  private remoteUpdateCallbacks: ((state: RemotePlayerState) => void)[] = []
  private remoteJoinCallbacks: ((state: RemotePlayerState) => void)[] = []
  private remoteLeaveCallbacks: ((sessionId: string) => void)[] = []
  private remoteDamageCallbacks: ((event: DamageEvent & { attackerId: string }) => void)[] = []
  private remoteProjectileCallbacks: ((event: ProjectileSpawnEvent & { ownerId: string }) => void)[] = []

  constructor(options?: { serverUrl?: string; room?: Room }) {
    if (options?.room) {
      this.room = options.room
      this.networkClient = null
    } else {
      this.networkClient = new NetworkClient(options?.serverUrl)
    }
  }

  async onSceneCreate(): Promise<void> {
    const roomWasPreProvided = this.room !== null

    if (!this.room) {
      this.room = await this.networkClient!.connect('game')
    }

    // @colyseus/schema v3: callbacks via getStateCallbacks wrapper
    this.$ = getStateCallbacks(this.room) as StateCallbacks

    // When room is pre-provided from lobby, initial state sync already happened.
    // Skip the onStateChange wait to avoid hanging if no further changes fire.
    if (!roomWasPreProvided) {
      await new Promise<void>((resolve) => {
        this.room!.onStateChange(() => resolve())
      })
    }

    this.setupListeners()
  }

  private setupListeners(): void {
    if (!this.room || !this.$) return

    const $ = this.$

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(this.room.state.players).onAdd((player: any, sessionId: string) => {
      if (sessionId === this.room?.sessionId) return

      const state = this.toRemoteState(sessionId, player)
      for (const cb of this.remoteJoinCallbacks) cb(state)

      $(player).listen('x', () => this.notifyUpdate(sessionId, player))
      $(player).listen('y', () => this.notifyUpdate(sessionId, player))
      $(player).listen('facing', () => this.notifyUpdate(sessionId, player))
      $(player).listen('hp', () => this.notifyUpdate(sessionId, player))
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(this.room.state.players).onRemove((_player: any, sessionId: string) => {
      for (const cb of this.remoteLeaveCallbacks) cb(sessionId)
    })

    this.room.onMessage('damageEvent', (message: DamageEvent & { attackerId: string }) => {
      for (const cb of this.remoteDamageCallbacks) cb(message)
    })

    this.room.onMessage('projectileSpawnEvent', (message: ProjectileSpawnEvent & { ownerId: string }) => {
      for (const cb of this.remoteProjectileCallbacks) cb(message)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private notifyUpdate(sessionId: string, player: any): void {
    const state = this.toRemoteState(sessionId, player)
    for (const cb of this.remoteUpdateCallbacks) cb(state)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toRemoteState(sessionId: string, player: any): RemotePlayerState {
    return {
      sessionId,
      x: player.x as number,
      y: player.y as number,
      facing: player.facing as number,
      hp: player.hp as number,
      maxHp: player.maxHp as number,
      heroType: player.heroType as string,
      team: player.team as string,
    }
  }

  sendLocalState(state: HeroState): void {
    if (!this.room) return

    const now = Date.now()
    if (now - this.sendTimer < SEND_INTERVAL_MS) return
    this.sendTimer = now

    const current = { x: state.position.x, y: state.position.y, facing: state.facing }
    if (
      this.lastSentState &&
      this.lastSentState.x === current.x &&
      this.lastSentState.y === current.y &&
      this.lastSentState.facing === current.facing
    ) {
      return
    }

    this.lastSentState = current
    this.room.send('updatePosition', current)
  }

  sendDamageEvent(event: DamageEvent): void {
    this.room?.send('damage', event)
  }

  sendProjectileSpawn(event: ProjectileSpawnEvent): void {
    this.room?.send('projectileSpawn', {
      targetId: event.targetId,
      startX: event.startPosition.x,
      startY: event.startPosition.y,
      damage: event.damage,
      speed: event.speed,
    })
  }

  onRemotePlayerUpdate(callback: (state: RemotePlayerState) => void): void {
    this.remoteUpdateCallbacks = [...this.remoteUpdateCallbacks, callback]
  }

  onRemotePlayerJoin(callback: (state: RemotePlayerState) => void): void {
    this.remoteJoinCallbacks = [...this.remoteJoinCallbacks, callback]
  }

  onRemotePlayerLeave(callback: (sessionId: string) => void): void {
    this.remoteLeaveCallbacks = [...this.remoteLeaveCallbacks, callback]
  }

  onRemoteDamage(callback: (event: DamageEvent & { attackerId: string }) => void): void {
    this.remoteDamageCallbacks = [...this.remoteDamageCallbacks, callback]
  }

  onRemoteProjectileSpawn(callback: (event: ProjectileSpawnEvent & { ownerId: string }) => void): void {
    this.remoteProjectileCallbacks = [...this.remoteProjectileCallbacks, callback]
  }

  dispose(): void {
    if (this.networkClient) {
      this.networkClient.disconnect()
    } else {
      this.room?.leave()
    }
    this.room = null
    this.remoteUpdateCallbacks = []
    this.remoteJoinCallbacks = []
    this.remoteLeaveCallbacks = []
    this.remoteDamageCallbacks = []
    this.remoteProjectileCallbacks = []
  }
}
