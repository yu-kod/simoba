import type { GameMode, DamageEvent, ProjectileSpawnEvent } from '@/network/GameMode'
import type { EntityManager } from '@/scenes/EntityManager'
import type { CombatManager } from '@/scenes/CombatManager'

export interface NetworkBridgeCallbacks {
  onRemotePlayerAdded?: (sessionId: string) => void
  onRemotePlayerRemoved?: (sessionId: string) => void
  onRemotePlayerUpdated?: (sessionId: string) => void
  onDamageApplied?: (targetId: string) => void
}

export class NetworkBridge {
  constructor(
    /** Not readonly: allows fallback from online to offline mode */
    private gameMode: GameMode,
    private readonly entityManager: EntityManager,
    private readonly combatManager: CombatManager,
    private readonly callbacks: NetworkBridgeCallbacks = {}
  ) {}

  setupCallbacks(): void {
    this.gameMode.onRemotePlayerJoin((remote) => {
      this.entityManager.addRemotePlayer(remote)
      this.callbacks.onRemotePlayerAdded?.(remote.sessionId)
    })

    this.gameMode.onRemotePlayerLeave((sessionId) => {
      this.callbacks.onRemotePlayerRemoved?.(sessionId)
      this.entityManager.removeRemotePlayer(sessionId)
    })

    this.gameMode.onRemotePlayerUpdate((remote) => {
      this.entityManager.updateRemotePlayer(remote)
      this.callbacks.onRemotePlayerUpdated?.(remote.sessionId)
    })

    this.gameMode.onRemoteDamage((event) => {
      this.combatManager.applyLocalDamage(event.targetId, event.amount)
      this.callbacks.onDamageApplied?.(event.targetId)
    })

    this.gameMode.onRemoteProjectileSpawn((event) => {
      this.combatManager.addRemoteProjectile({
        ownerId: event.ownerId,
        targetId: event.targetId,
        startPosition: event.startPosition,
        damage: event.damage,
        speed: event.speed,
      })
    })
  }

  sendLocalState(): void {
    this.gameMode.sendLocalState(this.entityManager.localHero)
  }

  sendDamageEvent(event: DamageEvent): void {
    this.gameMode.sendDamageEvent(event)
  }

  sendProjectileSpawn(event: ProjectileSpawnEvent): void {
    this.gameMode.sendProjectileSpawn(event)
  }

  replaceGameMode(newMode: GameMode): void {
    this.gameMode = newMode
  }

  dispose(): void {
    this.gameMode.dispose()
  }
}
