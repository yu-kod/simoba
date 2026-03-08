import type { Room } from 'colyseus.js'
import { getStateCallbacks } from 'colyseus.js'
import type { InputMessage, AttackEvent, DamageEvent as ServerDamageEvent, DeathEvent, SkillEvent } from '@shared/messages'
import type {
  GameMode,
  ServerHeroState,
  ServerTowerState,
  ServerMinionState,
  ServerProjectileState,
} from '@/network/GameMode'
import { NetworkClient } from '@/network/NetworkClient'
import { DEFAULT_PROJECTILE_RADIUS } from '@shared/constants'

/** Colyseus schema instance — properties accessed dynamically via listen/onChange. */
type SchemaInstance = Record<string, unknown>

/** Read an ArraySchema<string> into a plain string[]. */
function toStringArray(arr: unknown): string[] {
  const result: string[] = []
  if (arr && typeof (arr as { forEach?: unknown }).forEach === 'function') {
    (arr as { forEach: (fn: (v: string) => void) => void }).forEach((v) => result.push(v))
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StateCallbacks = (instance: SchemaInstance) => any

export class OnlineGameMode implements GameMode {
  readonly isServerAuthoritative = true

  get localSessionId(): string {
    if (!this.room) throw new Error('Room not connected yet')
    return this.room.sessionId
  }

  private networkClient: NetworkClient | null
  private room: Room | null = null
  private $: StateCallbacks | null = null

  // Server-authoritative callbacks
  private serverHeroUpdateCallbacks: ((state: ServerHeroState) => void)[] = []
  private serverHeroRemoveCallbacks: ((sessionId: string) => void)[] = []
  private serverTowerUpdateCallbacks: ((state: ServerTowerState) => void)[] = []
  private serverMinionUpdateCallbacks: ((state: ServerMinionState) => void)[] = []
  private serverMinionRemoveCallbacks: ((minionId: string) => void)[] = []
  private serverProjectileUpdateCallbacks: ((projectiles: readonly ServerProjectileState[]) => void)[] = []

  // Combat event callbacks
  private attackEventCallbacks: ((event: AttackEvent) => void)[] = []
  private damageEventCallbacks: ((event: ServerDamageEvent) => void)[] = []
  private deathEventCallbacks: ((event: DeathEvent) => void)[] = []
  private skillEventCallbacks: ((event: SkillEvent) => void)[] = []

  // Match lifecycle callbacks
  private matchEndCallbacks: ((winnerTeam: string, matchEndReason: string) => void)[] = []

  // Batch per-property listen callbacks into one notification per entity per patch
  private pendingHeroUpdates = new Map<string, { hero: SchemaInstance }>()
  private pendingMinionUpdates = new Map<string, { minion: SchemaInstance }>()
  private pendingProjectileUpdate = false

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

    // --- Combat event messages ---
    this.room.onMessage('attack', (event: AttackEvent) => {
      for (const cb of this.attackEventCallbacks) cb(event)
    })
    this.room.onMessage('damage', (event: ServerDamageEvent) => {
      for (const cb of this.damageEventCallbacks) cb(event)
    })
    this.room.onMessage('death', (event: DeathEvent) => {
      for (const cb of this.deathEventCallbacks) cb(event)
    })
    this.room.onMessage('skill', (event: SkillEvent) => {
      for (const cb of this.skillEventCallbacks) cb(event)
    })

    // --- Match phase listener ---
    $(this.room.state).listen('matchPhase', (value: unknown) => {
      if (value === 'finished') {
        const winnerTeam = (this.room?.state as SchemaInstance).winnerTeam as string
        const matchEndReason = (this.room?.state as SchemaInstance).matchEndReason as string
        for (const cb of this.matchEndCallbacks) cb(winnerTeam, matchEndReason)
      }
    })

    // --- Server-authoritative hero sync ---
    $(this.room.state.heroes).onAdd((hero: SchemaInstance, sessionId: string) => {
      // Notify hero state immediately on join (no batching — need entity created right away)
      this.notifyServerHeroUpdate(sessionId, hero)

      // Listen for state changes — batched via queueMicrotask so that
      // multiple property changes in one patch fire a single notification.
      const schedule = () => this.scheduleHeroUpdate(sessionId, hero)
      $(hero).listen('x', schedule)
      $(hero).listen('y', schedule)
      $(hero).listen('facing', schedule)
      $(hero).listen('hp', schedule)
      $(hero).listen('dead', schedule)
      $(hero).listen('radius', schedule)
      $(hero).listen('respawnTimer', schedule)
      $(hero).listen('lastProcessedSeq', schedule)
      $(hero).listen('xp', schedule)
      $(hero).listen('level', schedule)
      $(hero).listen('talentPoints', schedule)
      $(hero).listen('skillSlotQ', schedule)
      $(hero).listen('skillSlotE', schedule)
      $(hero).listen('skillSlotR', schedule)
      $(hero).listen('cooldownQ', schedule)
      $(hero).listen('cooldownE', schedule)
      $(hero).listen('cooldownR', schedule)
      $(hero).listen('dashTimer', schedule)

      // Array fields — trigger hero update on add/remove
      const arrSchedule = () => this.scheduleHeroUpdate(sessionId, hero)
      $(hero.acquiredTalents as SchemaInstance).onAdd(arrSchedule)
      $(hero.acquiredTalents as SchemaInstance).onRemove(arrSchedule)
      $(hero.ownedSkills as SchemaInstance).onAdd(arrSchedule)
      $(hero.ownedSkills as SchemaInstance).onRemove(arrSchedule)
    })

    $(this.room.state.heroes).onRemove((_hero: SchemaInstance, sessionId: string) => {
      for (const cb of this.serverHeroRemoveCallbacks) cb(sessionId)
    })

    // --- Server-authoritative tower sync ---
    $(this.room.state.towers).onAdd((tower: SchemaInstance, towerId: string) => {
      this.notifyServerTowerUpdate(towerId, tower)

      $(tower).listen('hp', () => this.notifyServerTowerUpdate(towerId, tower))
      $(tower).listen('dead', () => this.notifyServerTowerUpdate(towerId, tower))
    })

    // --- Server-authoritative minion sync ---
    $(this.room.state.minions).onAdd((minion: SchemaInstance, minionId: string) => {
      this.notifyServerMinionUpdate(minionId, minion)

      const schedule = () => this.scheduleMinionUpdate(minionId, minion)
      $(minion).listen('x', schedule)
      $(minion).listen('y', schedule)
      $(minion).listen('facing', schedule)
      $(minion).listen('hp', schedule)
      $(minion).listen('dead', schedule)
    })

    $(this.room.state.minions).onRemove((_minion: SchemaInstance, minionId: string) => {
      for (const cb of this.serverMinionRemoveCallbacks) cb(minionId)
    })

    // --- Server-authoritative projectile sync ---
    $(this.room.state.projectiles).onAdd((proj: SchemaInstance) => {
      this.scheduleProjectileUpdate()
      // Per-projectile position listeners — batched like heroes
      $(proj).listen('x', () => this.scheduleProjectileUpdate())
      $(proj).listen('y', () => this.scheduleProjectileUpdate())
    })

    $(this.room.state.projectiles).onRemove((_proj: SchemaInstance) => {
      this.scheduleProjectileUpdate()
    })
  }

  /**
   * Schedule a batched hero update. Colyseus fires per-property listen callbacks,
   * so a single patch updating x, y, facing fires multiple callbacks.
   * This batches them into one notifyServerHeroUpdate via queueMicrotask.
   */
  private scheduleHeroUpdate(sessionId: string, hero: SchemaInstance): void {
    if (this.pendingHeroUpdates.has(sessionId)) return
    this.pendingHeroUpdates.set(sessionId, { hero })
    queueMicrotask(() => {
      const pending = this.pendingHeroUpdates.get(sessionId)
      this.pendingHeroUpdates.delete(sessionId)
      if (pending) {
        this.notifyServerHeroUpdate(sessionId, pending.hero)
      }
    })
  }

  /**
   * Schedule a batched minion update — same pattern as scheduleHeroUpdate.
   */
  private scheduleMinionUpdate(minionId: string, minion: SchemaInstance): void {
    if (this.pendingMinionUpdates.has(minionId)) return
    this.pendingMinionUpdates.set(minionId, { minion })
    queueMicrotask(() => {
      const pending = this.pendingMinionUpdates.get(minionId)
      this.pendingMinionUpdates.delete(minionId)
      if (pending) {
        this.notifyServerMinionUpdate(minionId, pending.minion)
      }
    })
  }

  private notifyServerHeroUpdate(sessionId: string, hero: SchemaInstance): void {
    const state: ServerHeroState = {
      sessionId,
      x: hero.x as number,
      y: hero.y as number,
      facing: hero.facing as number,
      hp: hero.hp as number,
      maxHp: hero.maxHp as number,
      heroType: hero.heroType as string,
      team: hero.team as string,
      radius: hero.radius as number,
      dead: hero.dead as boolean,
      attackTargetId: hero.attackTargetId as string,
      attackCooldown: hero.attackCooldown as number,
      respawnTimer: hero.respawnTimer as number,
      lastProcessedSeq: hero.lastProcessedSeq as number,
      xp: hero.xp as number,
      level: hero.level as number,
      talentPoints: hero.talentPoints as number,
      acquiredTalents: toStringArray(hero.acquiredTalents),
      ownedSkills: toStringArray(hero.ownedSkills),
      skillSlotQ: (hero.skillSlotQ as string) ?? '',
      skillSlotE: (hero.skillSlotE as string) ?? '',
      skillSlotR: (hero.skillSlotR as string) ?? '',
      cooldownQ: hero.cooldownQ as number,
      cooldownE: hero.cooldownE as number,
      cooldownR: hero.cooldownR as number,
      dashTimer: hero.dashTimer as number,
    }
    for (const cb of this.serverHeroUpdateCallbacks) cb(state)
  }

  private notifyServerTowerUpdate(towerId: string, tower: SchemaInstance): void {
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

  private notifyServerMinionUpdate(minionId: string, minion: SchemaInstance): void {
    const state: ServerMinionState = {
      id: minionId,
      x: minion.x as number,
      y: minion.y as number,
      facing: minion.facing as number,
      hp: minion.hp as number,
      maxHp: minion.maxHp as number,
      dead: minion.dead as boolean,
      team: minion.team as string,
      radius: minion.radius as number,
      minionType: minion.minionType as 'melee' | 'ranged',
      speed: minion.speed as number,
      attackDamage: minion.attackDamage as number,
      attackRange: minion.attackRange as number,
      attackSpeed: minion.attackSpeed as number,
      projectileSpeed: minion.projectileSpeed as number,
      projectileRadius: minion.projectileRadius as number,
    }
    for (const cb of this.serverMinionUpdateCallbacks) cb(state)
  }

  /** Batch projectile property changes into one notification per patch. */
  private scheduleProjectileUpdate(): void {
    if (this.pendingProjectileUpdate) return
    this.pendingProjectileUpdate = true
    queueMicrotask(() => {
      this.pendingProjectileUpdate = false
      this.notifyProjectilesChanged()
    })
  }

  private notifyProjectilesChanged(): void {
    if (!this.room) return
    const projectiles: ServerProjectileState[] = []
    this.room.state.projectiles.forEach((proj: SchemaInstance, id: string) => {
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

  sendInput(input: InputMessage): void {
    this.room?.send('input', input)
  }

  sendAcquireTalent(talentId: string): void {
    this.room?.send('acquireTalent', { talentId })
  }

  sendAssignSkillSlot(skillId: string, slot: string): void {
    this.room?.send('assignSkillSlot', { skillId, slot })
  }

  sendSwapSkillSlots(slotA: string, slotB: string): void {
    this.room?.send('swapSkillSlots', { slotA, slotB })
  }

  sendUnequipSkillSlot(slot: string): void {
    this.room?.send('unequipSkillSlot', { slot })
  }

  sendUseSkill(slot: string, target: { x: number; y: number }): void {
    this.room?.send('useSkill', { slot, target })
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

  onServerMinionUpdate(callback: (state: ServerMinionState) => void): void {
    this.serverMinionUpdateCallbacks = [...this.serverMinionUpdateCallbacks, callback]
  }

  onServerMinionRemove(callback: (minionId: string) => void): void {
    this.serverMinionRemoveCallbacks = [...this.serverMinionRemoveCallbacks, callback]
  }

  onServerProjectileUpdate(callback: (projectiles: readonly ServerProjectileState[]) => void): void {
    this.serverProjectileUpdateCallbacks = [...this.serverProjectileUpdateCallbacks, callback]
  }

  onAttackEvent(callback: (event: AttackEvent) => void): void {
    this.attackEventCallbacks = [...this.attackEventCallbacks, callback]
  }

  onDamageEvent(callback: (event: ServerDamageEvent) => void): void {
    this.damageEventCallbacks = [...this.damageEventCallbacks, callback]
  }

  onDeathEvent(callback: (event: DeathEvent) => void): void {
    this.deathEventCallbacks = [...this.deathEventCallbacks, callback]
  }

  onSkillEvent(callback: (event: SkillEvent) => void): void {
    this.skillEventCallbacks = [...this.skillEventCallbacks, callback]
  }

  onMatchEnd(callback: (winnerTeam: string, matchEndReason: string) => void): void {
    this.matchEndCallbacks = [...this.matchEndCallbacks, callback]
  }

  dispose(): void {
    if (this.networkClient) {
      this.networkClient.disconnect()
    } else {
      this.room?.leave()
    }
    this.room = null
    this.serverHeroUpdateCallbacks = []
    this.serverHeroRemoveCallbacks = []
    this.serverTowerUpdateCallbacks = []
    this.serverMinionUpdateCallbacks = []
    this.serverMinionRemoveCallbacks = []
    this.serverProjectileUpdateCallbacks = []
    this.attackEventCallbacks = []
    this.damageEventCallbacks = []
    this.deathEventCallbacks = []
    this.skillEventCallbacks = []
    this.matchEndCallbacks = []
  }
}
