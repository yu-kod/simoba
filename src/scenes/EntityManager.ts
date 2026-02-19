import { createHeroState, type HeroState } from '@/domain/entities/Hero'
import type { CombatEntityState, HeroType, Position, Team } from '@/domain/types'
import type { RemotePlayerState } from '@/network/GameMode'

const DEFAULT_ENTITY_RADIUS = 20

interface CreateLocalHeroParams {
  readonly id: string
  readonly type: HeroType
  readonly team: Team
  readonly position: Position
}

export class EntityManager {
  private _localHero: HeroState
  private _enemy: HeroState
  private readonly _remotePlayers = new Map<string, HeroState>()
  private readonly _entities = new Map<string, CombatEntityState>()

  constructor(
    localHeroParams: CreateLocalHeroParams,
    enemyParams: CreateLocalHeroParams
  ) {
    this._localHero = createHeroState(localHeroParams)
    this._enemy = createHeroState(enemyParams)
  }

  // ---- Hero API (backward compatible) ----

  get localHero(): HeroState {
    return this._localHero
  }

  get enemy(): HeroState {
    return this._enemy
  }

  updateLocalHero(updater: (hero: HeroState) => HeroState): void {
    this._localHero = updater(this._localHero)
  }

  updateEnemy(updater: (enemy: HeroState) => HeroState): void {
    this._enemy = updater(this._enemy)
  }

  resetLocalHero(params: CreateLocalHeroParams): void {
    this._localHero = createHeroState(params)
  }

  // ---- Generic entity registry ----

  registerEntity(entity: CombatEntityState): void {
    this._entities.set(entity.id, entity)
  }

  removeEntity(id: string): void {
    this._entities.delete(id)
  }

  /**
   * Update an entity in the registry.
   * T must match the concrete type the entity was registered with.
   * No runtime type checking is performed — passing an incompatible T
   * may cause runtime errors when the updater accesses subtype-specific fields.
   */
  updateEntity<T extends CombatEntityState>(
    id: string,
    updater: (entity: T) => T
  ): void {
    const entity = this._entities.get(id)
    if (!entity) return
    this._entities.set(id, updater(entity as T))
  }

  // ---- Unified search (heroes + registry) ----

  getEntity(id: string): CombatEntityState | null {
    if (id === this._localHero.id) return this._localHero
    if (id === this._enemy.id) return this._enemy
    const remote = this._remotePlayers.get(id)
    if (remote) return remote
    return this._entities.get(id) ?? null
  }

  getEnemiesOf(team: Team): CombatEntityState[] {
    const enemies: CombatEntityState[] = []

    const isEnemy = (entity: CombatEntityState): boolean =>
      !entity.dead && entity.team !== team

    // Heroes
    if (isEnemy(this._localHero)) enemies.push(this._localHero)
    if (isEnemy(this._enemy)) enemies.push(this._enemy)
    for (const remote of this._remotePlayers.values()) {
      if (isEnemy(remote)) enemies.push(remote)
    }

    // Registry entities (towers, minions, boss, etc.)
    for (const entity of this._entities.values()) {
      if (isEnemy(entity)) enemies.push(entity)
    }

    return enemies
  }

  /** @deprecated Use getEnemiesOf(team) instead. Kept for backward compatibility. */
  getEnemies(): CombatEntityState[] {
    return this.getEnemiesOf(this._localHero.team)
  }

  /** All entities in the generic registry (towers, minions, etc.) */
  get registeredEntities(): readonly CombatEntityState[] {
    return [...this._entities.values()]
  }

  getEntityRadius(id: string): number {
    const entity = this.getEntity(id)
    return entity?.radius ?? DEFAULT_ENTITY_RADIUS
  }

  // ---- Remote player management ----

  getRemotePlayer(sessionId: string): HeroState | undefined {
    return this._remotePlayers.get(sessionId)
  }

  get remotePlayerEntries(): ReadonlyMap<string, HeroState> {
    return this._remotePlayers
  }

  addRemotePlayer(remote: RemotePlayerState): HeroState {
    const heroType = (remote.heroType as HeroType) ?? 'BLADE'
    const state = createHeroState({
      id: remote.sessionId,
      type: heroType,
      team: remote.team === 'blue' ? 'blue' : 'red',
      position: { x: remote.x, y: remote.y },
    })
    this._remotePlayers.set(remote.sessionId, state)
    return state
  }

  removeRemotePlayer(sessionId: string): boolean {
    return this._remotePlayers.delete(sessionId)
  }

  updateRemotePlayer(remote: RemotePlayerState): HeroState | null {
    const existing = this._remotePlayers.get(remote.sessionId)
    if (!existing) return null
    const updated: HeroState = {
      ...existing,
      position: { x: remote.x, y: remote.y },
      facing: remote.facing,
      hp: remote.hp,
      maxHp: remote.maxHp,
    }
    this._remotePlayers.set(remote.sessionId, updated)
    return updated
  }

  applyDamageToRemote(sessionId: string, amount: number): HeroState | null {
    const remote = this._remotePlayers.get(sessionId)
    if (!remote) return null
    const updated: HeroState = {
      ...remote,
      hp: Math.max(0, remote.hp - amount),
    }
    this._remotePlayers.set(sessionId, updated)
    return updated
  }
}
