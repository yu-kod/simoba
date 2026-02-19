import type { HeroState } from '@/domain/entities/Hero'
import type { Position } from '@/domain/types'
import type { InputMessage } from '@shared/messages'

export interface DamageEvent {
  readonly targetId: string
  readonly amount: number
}

export interface ProjectileSpawnEvent {
  readonly targetId: string
  readonly startPosition: Position
  readonly damage: number
  readonly speed: number
}

export interface RemotePlayerState {
  readonly sessionId: string
  readonly x: number
  readonly y: number
  readonly facing: number
  readonly hp: number
  readonly maxHp: number
  readonly heroType: string
  readonly team: string
}

/** Server-synced hero state (includes lastProcessedSeq for reconciliation) */
export interface ServerHeroState extends RemotePlayerState {
  readonly dead: boolean
  readonly attackTargetId: string
  readonly respawnTimer: number
  readonly lastProcessedSeq: number
}

/** Server-synced projectile for rendering */
export interface ServerProjectileState {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly team: string
  readonly radius: number
}

/** Server-synced tower state */
export interface ServerTowerState {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly hp: number
  readonly maxHp: number
  readonly dead: boolean
  readonly team: string
  readonly radius: number
}

export interface GameMode {
  /** Initialize this mode (called during GameScene.create) */
  onSceneCreate(): Promise<void>

  /** Send input message to server (server-authoritative mode) */
  sendInput(input: InputMessage): void

  /** Send local player state to the network (client-authoritative, offline) */
  sendLocalState(state: HeroState): void

  /** Send a damage event to the server (client-authoritative, offline) */
  sendDamageEvent(event: DamageEvent): void

  /** Send a projectile spawn event to the server (client-authoritative, offline) */
  sendProjectileSpawn(event: ProjectileSpawnEvent): void

  /** Register a callback for when a remote player's state changes */
  onRemotePlayerUpdate(callback: (state: RemotePlayerState) => void): void

  /** Register a callback for when a remote player joins */
  onRemotePlayerJoin(callback: (state: RemotePlayerState) => void): void

  /** Register a callback for when a remote player leaves */
  onRemotePlayerLeave(callback: (sessionId: string) => void): void

  /** Register a callback for when remote damage is received (client-authoritative) */
  onRemoteDamage(callback: (event: DamageEvent & { attackerId: string }) => void): void

  /** Register a callback for when a remote projectile spawns (client-authoritative) */
  onRemoteProjectileSpawn(callback: (event: ProjectileSpawnEvent & { ownerId: string }) => void): void

  /** Register callback for server hero state sync (server-authoritative) */
  onServerHeroUpdate(callback: (state: ServerHeroState) => void): void

  /** Register callback for server hero removed */
  onServerHeroRemove(callback: (sessionId: string) => void): void

  /** Register callback for server tower state sync */
  onServerTowerUpdate(callback: (state: ServerTowerState) => void): void

  /** Register callback for server projectile sync */
  onServerProjectileUpdate(callback: (projectiles: readonly ServerProjectileState[]) => void): void

  /** Whether this mode is server-authoritative */
  readonly isServerAuthoritative: boolean

  /** Local player's session ID (null for offline mode) */
  readonly localSessionId: string | null

  /** Clean up resources */
  dispose(): void
}
