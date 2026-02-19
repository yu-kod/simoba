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

/**
 * Offline game mode — all callbacks are no-ops.
 * The game runs in local bot battle mode with no network communication.
 */
export class OfflineGameMode implements GameMode {
  readonly isServerAuthoritative = false
  readonly localSessionId = null

  async onSceneCreate(): Promise<void> {
    // No network initialization needed
  }

  sendInput(_input: InputMessage): void {
    // No-op: offline mode uses local game logic
  }

  sendLocalState(_state: HeroState): void {
    // No-op: no server to send to
  }

  sendDamageEvent(_event: DamageEvent): void {
    // No-op
  }

  sendProjectileSpawn(_event: ProjectileSpawnEvent): void {
    // No-op
  }

  onRemotePlayerUpdate(_callback: (state: RemotePlayerState) => void): void {
    // No-op: no remote players in offline mode
  }

  onRemotePlayerJoin(_callback: (state: RemotePlayerState) => void): void {
    // No-op
  }

  onRemotePlayerLeave(_callback: (sessionId: string) => void): void {
    // No-op
  }

  onRemoteDamage(_callback: (event: DamageEvent & { attackerId: string }) => void): void {
    // No-op
  }

  onRemoteProjectileSpawn(_callback: (event: ProjectileSpawnEvent & { ownerId: string }) => void): void {
    // No-op
  }

  onServerHeroUpdate(_callback: (state: ServerHeroState) => void): void {
    // No-op
  }

  onServerHeroRemove(_callback: (sessionId: string) => void): void {
    // No-op
  }

  onServerTowerUpdate(_callback: (state: ServerTowerState) => void): void {
    // No-op
  }

  onServerProjectileUpdate(_callback: (projectiles: readonly ServerProjectileState[]) => void): void {
    // No-op
  }

  dispose(): void {
    // Nothing to clean up
  }
}
