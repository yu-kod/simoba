import type { HeroState } from '@/domain/entities/Hero'
import type { InputMessage } from '@shared/messages'
import type {
  GameMode,
  DamageEvent,
  ProjectileSpawnEvent,
  ServerHeroState,
  ServerTowerState,
  ServerProjectileState,
} from '@/network/GameMode'
import type { EntityManager } from '@/scenes/EntityManager'
import type { CombatManager } from '@/scenes/CombatManager'

export interface NetworkBridgeCallbacks {
  onRemotePlayerAdded?: (sessionId: string) => void
  onRemotePlayerRemoved?: (sessionId: string) => void
  onRemotePlayerUpdated?: (sessionId: string) => void
  onDamageApplied?: (targetId: string) => void
  /** Server-authoritative: hero state updated (includes local hero) */
  onServerHeroUpdated?: (state: ServerHeroState) => void
  /** Server-authoritative: tower state updated */
  onServerTowerUpdated?: (state: ServerTowerState) => void
  /** Server-authoritative: projectiles changed */
  onServerProjectilesUpdated?: (projectiles: readonly ServerProjectileState[]) => void
}

export class NetworkBridge {
  constructor(
    /** Not readonly: allows fallback from online to offline mode */
    private gameMode: GameMode,
    private readonly entityManager: EntityManager,
    private readonly combatManager: CombatManager,
    private readonly callbacks: NetworkBridgeCallbacks = {}
  ) {}

  get isServerAuthoritative(): boolean {
    return this.gameMode.isServerAuthoritative
  }

  get localSessionId(): string | null {
    return this.gameMode.localSessionId
  }

  setupCallbacks(): void {
    // Legacy client-authoritative callbacks (used by offline mode)
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

    // Server-authoritative callbacks
    this.gameMode.onServerHeroUpdate((state) => {
      this.callbacks.onServerHeroUpdated?.(state)
    })

    this.gameMode.onServerHeroRemove((sessionId) => {
      this.callbacks.onRemotePlayerRemoved?.(sessionId)
      this.entityManager.removeRemotePlayer(sessionId)
    })

    this.gameMode.onServerTowerUpdate((state) => {
      this.callbacks.onServerTowerUpdated?.(state)
    })

    this.gameMode.onServerProjectileUpdate((projectiles) => {
      this.callbacks.onServerProjectilesUpdated?.(projectiles)
    })
  }

  /** Send input to server (server-authoritative mode). */
  sendInput(input: InputMessage): void {
    this.gameMode.sendInput(input)
  }

  /** Send local state (client-authoritative / offline mode). */
  sendLocalState(): void {
    const hero = this.entityManager.getEntity(this.entityManager.localHeroId) as HeroState | null
    if (hero) this.gameMode.sendLocalState(hero)
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
