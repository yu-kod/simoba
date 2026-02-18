import type { HeroState } from '@/domain/entities/Hero'
import type { Position } from '@/domain/types'

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

export interface GameMode {
  /** Initialize this mode (called during GameScene.create) */
  onSceneCreate(): Promise<void>

  /** Send local player state to the network */
  sendLocalState(state: HeroState): void

  /** Send a damage event to the server */
  sendDamageEvent(event: DamageEvent): void

  /** Send a projectile spawn event to the server */
  sendProjectileSpawn(event: ProjectileSpawnEvent): void

  /** Register a callback for when a remote player's state changes */
  onRemotePlayerUpdate(callback: (state: RemotePlayerState) => void): void

  /** Register a callback for when a remote player joins */
  onRemotePlayerJoin(callback: (state: RemotePlayerState) => void): void

  /** Register a callback for when a remote player leaves */
  onRemotePlayerLeave(callback: (sessionId: string) => void): void

  /** Register a callback for when remote damage is received */
  onRemoteDamage(callback: (event: DamageEvent & { attackerId: string }) => void): void

  /** Register a callback for when a remote projectile spawns */
  onRemoteProjectileSpawn(callback: (event: ProjectileSpawnEvent & { ownerId: string }) => void): void

  /** Clean up resources */
  dispose(): void
}
