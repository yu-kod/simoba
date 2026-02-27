import type { InputMessage, AttackEvent, DamageEvent as ServerDamageEvent, DeathEvent } from '@shared/messages'

/** Server-synced hero state */
export interface ServerHeroState {
  readonly sessionId: string
  readonly x: number
  readonly y: number
  readonly facing: number
  readonly hp: number
  readonly maxHp: number
  readonly heroType: string
  readonly team: string
  readonly radius: number
  readonly dead: boolean
  readonly attackTargetId: string
  readonly attackCooldown: number
  readonly respawnTimer: number
  readonly lastProcessedSeq: number
  readonly xp: number
  readonly level: number
  readonly talentPoints: number
}

/** Server-synced projectile for rendering */
export interface ServerProjectileState {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly team: string
  readonly radius: number
}

/** Server-synced minion state */
export interface ServerMinionState {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly facing: number
  readonly hp: number
  readonly maxHp: number
  readonly dead: boolean
  readonly team: string
  readonly radius: number
  readonly minionType: 'melee' | 'ranged'
  readonly speed: number
  readonly attackDamage: number
  readonly attackRange: number
  readonly attackSpeed: number
  readonly projectileSpeed: number
  readonly projectileRadius: number
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

  /** Send input message to server */
  sendInput(input: InputMessage): void

  /** Register callback for server hero state sync */
  onServerHeroUpdate(callback: (state: ServerHeroState) => void): void

  /** Register callback for server hero removed */
  onServerHeroRemove(callback: (sessionId: string) => void): void

  /** Register callback for server tower state sync */
  onServerTowerUpdate(callback: (state: ServerTowerState) => void): void

  /** Register callback for server minion state sync */
  onServerMinionUpdate(callback: (state: ServerMinionState) => void): void

  /** Register callback for server minion removed */
  onServerMinionRemove(callback: (minionId: string) => void): void

  /** Register callback for server projectile sync */
  onServerProjectileUpdate(callback: (projectiles: readonly ServerProjectileState[]) => void): void

  /** Register callback for server attack event (server-authoritative) */
  onAttackEvent(callback: (event: AttackEvent) => void): void

  /** Register callback for server damage event (server-authoritative) */
  onDamageEvent(callback: (event: ServerDamageEvent) => void): void

  /** Register callback for server death/respawn event (server-authoritative) */
  onDeathEvent(callback: (event: DeathEvent) => void): void

  /** Register callback for match end (matchPhase becomes 'finished') */
  onMatchEnd(callback: (winnerTeam: string) => void): void

  /** Local player's session ID */
  readonly localSessionId: string

  /** Clean up resources */
  dispose(): void
}
