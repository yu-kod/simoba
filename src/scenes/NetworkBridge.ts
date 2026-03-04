import type { InputMessage, AttackEvent, DamageEvent as ServerDamageEvent, DeathEvent } from '@shared/messages'
import type {
  GameMode,
  ServerHeroState,
  ServerTowerState,
  ServerMinionState,
  ServerProjectileState,
} from '@/network/GameMode'

export interface NetworkBridgeCallbacks {
  onRemotePlayerRemoved?: (sessionId: string) => void
  /** Server-authoritative: hero state updated (includes local hero) */
  onServerHeroUpdated?: (state: ServerHeroState) => void
  /** Server-authoritative: tower state updated */
  onServerTowerUpdated?: (state: ServerTowerState) => void
  /** Server-authoritative: minion state updated */
  onServerMinionUpdated?: (state: ServerMinionState) => void
  /** Server-authoritative: minion removed from server */
  onServerMinionRemoved?: (minionId: string) => void
  /** Server-authoritative: projectiles changed */
  onServerProjectilesUpdated?: (projectiles: readonly ServerProjectileState[]) => void
  /** Server-authoritative: combat event — attack occurred */
  onAttackEvent?: (event: AttackEvent) => void
  /** Server-authoritative: combat event — damage applied */
  onDamageEvent?: (event: ServerDamageEvent) => void
  /** Server-authoritative: combat event — death or respawn */
  onDeathEvent?: (event: DeathEvent) => void
}

export class NetworkBridge {
  constructor(
    private readonly gameMode: GameMode,
    private readonly callbacks: NetworkBridgeCallbacks = {}
  ) {}

  get localSessionId(): string {
    return this.gameMode.localSessionId
  }

  setupCallbacks(): void {
    // Server-authoritative callbacks
    this.gameMode.onServerHeroUpdate((state) => {
      this.callbacks.onServerHeroUpdated?.(state)
    })

    this.gameMode.onServerHeroRemove((sessionId) => {
      this.callbacks.onRemotePlayerRemoved?.(sessionId)
    })

    this.gameMode.onServerTowerUpdate((state) => {
      this.callbacks.onServerTowerUpdated?.(state)
    })

    this.gameMode.onServerMinionUpdate((state) => {
      this.callbacks.onServerMinionUpdated?.(state)
    })

    this.gameMode.onServerMinionRemove((minionId) => {
      this.callbacks.onServerMinionRemoved?.(minionId)
    })

    this.gameMode.onServerProjectileUpdate((projectiles) => {
      this.callbacks.onServerProjectilesUpdated?.(projectiles)
    })

    // Server-authoritative combat events
    this.gameMode.onAttackEvent((event) => {
      this.callbacks.onAttackEvent?.(event)
    })

    this.gameMode.onDamageEvent((event) => {
      this.callbacks.onDamageEvent?.(event)
    })

    this.gameMode.onDeathEvent((event) => {
      this.callbacks.onDeathEvent?.(event)
    })
  }

  /** Send input to server. */
  sendInput(input: InputMessage): void {
    this.gameMode.sendInput(input)
  }

  sendAcquireTalent(talentId: string): void {
    this.gameMode.sendAcquireTalent(talentId)
  }

  sendAssignSkillSlot(skillId: string, slot: string): void {
    this.gameMode.sendAssignSkillSlot(skillId, slot)
  }

  sendSwapSkillSlots(slotA: string, slotB: string): void {
    this.gameMode.sendSwapSkillSlots(slotA, slotB)
  }

  sendUnequipSkillSlot(slot: string): void {
    this.gameMode.sendUnequipSkillSlot(slot)
  }

  dispose(): void {
    this.gameMode.dispose()
  }
}
