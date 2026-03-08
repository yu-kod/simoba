/** Client → Server input command sent every frame */
export interface InputMessage {
  /** Sequence number for client-side prediction reconciliation */
  readonly seq: number
  /** Normalized movement direction vector (0,0 = stop) */
  readonly moveDir: { readonly x: number; readonly y: number }
  /** Attack target entity ID (null = no attack) */
  readonly attackTargetId: string | null
  /** Hero facing direction in radians */
  readonly facing: number
}

// ─── Server → Client combat events ─────────────────────────────

/** Fired when a hero or tower initiates an attack */
export interface AttackEvent {
  readonly attackerId: string
  readonly targetId: string
  readonly attackType: 'melee' | 'ranged'
  readonly position: { readonly x: number; readonly y: number }
  readonly facing: number
}

/** Fired when damage is applied to any entity */
export interface DamageEvent {
  readonly targetId: string
  readonly amount: number
  readonly sourceId: string
}

/** Fired when any entity dies or respawns (hero, minion, tower) */
export interface DeathEvent {
  readonly entityId: string
  readonly type: 'death' | 'respawn'
  readonly position: { readonly x: number; readonly y: number }
}

// ─── Client → Server skill command ──────────────────────────────

/** Sent when player activates a skill from a slot */
export interface UseSkillMessage {
  readonly slot: 'Q' | 'E' | 'R'
  readonly target: { readonly x: number; readonly y: number }
}

// ─── Server → Client skill events ───────────────────────────────

/** Broadcast when a skill is successfully activated */
export interface SkillEvent {
  readonly casterId: string
  readonly skillId: string
  readonly position: { readonly x: number; readonly y: number }
  readonly direction: { readonly x: number; readonly y: number }
}

/** Union of all combat events (used as return type from server process functions) */
export type CombatEventMessage =
  | { readonly kind: 'attack'; readonly event: AttackEvent }
  | { readonly kind: 'damage'; readonly event: DamageEvent }
  | { readonly kind: 'death'; readonly event: DeathEvent }
