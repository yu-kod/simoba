import type { Room } from 'colyseus.js'
import { getStateCallbacks } from 'colyseus.js'
import type { HeroState } from '@/domain/entities/Hero'
import type { InputMessage } from '@shared/messages'
import type {
  GameMode,
  DamageEvent,
  ProjectileSpawnEvent,
  RemotePlayerState,
  ServerHeroState,
  ServerTowerState,
  ServerProjectileState,
} from '@/network/GameMode'
import { NetworkClient } from '@/network/NetworkClient'

const DEFAULT_PROJECTILE_RADIUS = 5

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StateCallbacks = (instance: any) => any

export class OnlineGameMode implements GameMode {
  readonly isServerAuthoritative = true

  get localSessionId(): string | null {
    return this.room?.sessionId ?? null
  }

  private networkClient: NetworkClient | null
  private room: Room | null = null
  private $: StateCallbacks | null = null

  // Server-authoritative callbacks
  private serverHeroUpdateCallbacks: ((state: ServerHeroState) => void)[] = []
  private serverHeroRemoveCallbacks: ((sessionId: string) => void)[] = []
  private serverTowerUpdateCallbacks: ((state: ServerTowerState) => void)[] = []
  private serverProjectileUpdateCallbacks: ((projectiles: readonly ServerProjectileState[]) => void)[] = []

  // Legacy client-authoritative callbacks (kept for interface compat)
  private remoteUpdateCallbacks: ((state: RemotePlayerState) => void)[] = []
  private remoteJoinCallbacks: ((state: RemotePlayerState) => void)[] = []
  private remoteLeaveCallbacks: ((sessionId: string) => void)[] = []

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

    // --- Server-authoritative hero sync ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(this.room.state.heroes).onAdd((hero: any, sessionId: string) => {
      // Notify hero state for all heroes (including local — needed for reconciliation)
      this.notifyServerHeroUpdate(sessionId, hero)

      // Also fire legacy join callback for remote players
      if (sessionId !== this.room?.sessionId) {
        const state = this.toRemoteState(sessionId, hero)
        for (const cb of this.remoteJoinCallbacks) cb(state)
      }

      // Listen for state changes on this hero
      $(hero).listen('x', () => this.notifyServerHeroUpdate(sessionId, hero))
      $(hero).listen('y', () => this.notifyServerHeroUpdate(sessionId, hero))
      $(hero).listen('facing', () => this.notifyServerHeroUpdate(sessionId, hero))
      $(hero).listen('hp', () => this.notifyServerHeroUpdate(sessionId, hero))
      $(hero).listen('dead', () => this.notifyServerHeroUpdate(sessionId, hero))
      $(hero).listen('respawnTimer', () => this.notifyServerHeroUpdate(sessionId, hero))
      $(hero).listen('lastProcessedSeq', () => this.notifyServerHeroUpdate(sessionId, hero))
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(this.room.state.heroes).onRemove((_hero: any, sessionId: string) => {
      for (const cb of this.serverHeroRemoveCallbacks) cb(sessionId)
      for (const cb of this.remoteLeaveCallbacks) cb(sessionId)
    })

    // --- Server-authoritative tower sync ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(this.room.state.towers).onAdd((tower: any, towerId: string) => {
      this.notifyServerTowerUpdate(towerId, tower)

      $(tower).listen('hp', () => this.notifyServerTowerUpdate(towerId, tower))
      $(tower).listen('dead', () => this.notifyServerTowerUpdate(towerId, tower))
    })

    // --- Server-authoritative projectile sync ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(this.room.state.projectiles).onAdd((_proj: any) => {
      this.notifyProjectilesChanged()
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(this.room.state.projectiles).onRemove((_proj: any) => {
      this.notifyProjectilesChanged()
    })

    // Listen for projectile position changes via room state change
    this.room.onStateChange(() => {
      this.notifyProjectilesChanged()
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private notifyServerHeroUpdate(sessionId: string, hero: any): void {
    const state: ServerHeroState = {
      sessionId,
      x: hero.x as number,
      y: hero.y as number,
      facing: hero.facing as number,
      hp: hero.hp as number,
      maxHp: hero.maxHp as number,
      heroType: hero.heroType as string,
      team: hero.team as string,
      dead: hero.dead as boolean,
      attackTargetId: hero.attackTargetId as string,
      respawnTimer: hero.respawnTimer as number,
      lastProcessedSeq: hero.lastProcessedSeq as number,
    }
    for (const cb of this.serverHeroUpdateCallbacks) cb(state)

    // Also fire legacy update callback for remote players
    if (sessionId !== this.room?.sessionId) {
      for (const cb of this.remoteUpdateCallbacks) cb(state)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private notifyServerTowerUpdate(towerId: string, tower: any): void {
    const state: ServerTowerState = {
      id: towerId,
      x: tower.x as number,
      y: tower.y as number,
      hp: tower.hp as number,
      maxHp: tower.maxHp as number,
      dead: tower.dead as boolean,
      team: tower.team as string,
      radius: tower.radius as number,
    }
    for (const cb of this.serverTowerUpdateCallbacks) cb(state)
  }

  private notifyProjectilesChanged(): void {
    if (!this.room) return
    const projectiles: ServerProjectileState[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.projectiles.forEach((proj: any, id: string) => {
      projectiles.push({
        id,
        x: proj.x as number,
        y: proj.y as number,
        team: proj.team as string,
        radius: DEFAULT_PROJECTILE_RADIUS,
      })
    })
    for (const cb of this.serverProjectileUpdateCallbacks) cb(projectiles)
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

  sendInput(input: InputMessage): void {
    this.room?.send('input', input)
  }

  sendLocalState(_state: HeroState): void {
    // No-op in server-authoritative mode — use sendInput instead
  }

  sendDamageEvent(_event: DamageEvent): void {
    // No-op in server-authoritative mode — server handles combat
  }

  sendProjectileSpawn(_event: ProjectileSpawnEvent): void {
    // No-op in server-authoritative mode — server handles projectiles
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

  onRemoteDamage(_callback: (event: DamageEvent & { attackerId: string }) => void): void {
    // No-op in server-authoritative — damage is in hero state
  }

  onRemoteProjectileSpawn(_callback: (event: ProjectileSpawnEvent & { ownerId: string }) => void): void {
    // No-op in server-authoritative — projectiles are in state
  }

  onServerHeroUpdate(callback: (state: ServerHeroState) => void): void {
    this.serverHeroUpdateCallbacks = [...this.serverHeroUpdateCallbacks, callback]
  }

  onServerHeroRemove(callback: (sessionId: string) => void): void {
    this.serverHeroRemoveCallbacks = [...this.serverHeroRemoveCallbacks, callback]
  }

  onServerTowerUpdate(callback: (state: ServerTowerState) => void): void {
    this.serverTowerUpdateCallbacks = [...this.serverTowerUpdateCallbacks, callback]
  }

  onServerProjectileUpdate(callback: (projectiles: readonly ServerProjectileState[]) => void): void {
    this.serverProjectileUpdateCallbacks = [...this.serverProjectileUpdateCallbacks, callback]
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
    this.serverHeroUpdateCallbacks = []
    this.serverHeroRemoveCallbacks = []
    this.serverTowerUpdateCallbacks = []
    this.serverProjectileUpdateCallbacks = []
  }
}
