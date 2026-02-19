import { createHeroState, type HeroState, type CreateHeroParams } from '@/domain/entities/Hero'
import { isHero } from '@/domain/entities/typeGuards'
import type { CombatEntityState, HeroType, Position, Team } from '@/domain/types'
import type { RemotePlayerState } from '@/network/GameMode'

const DEFAULT_ENTITY_RADIUS = 20

export class EntityManager {
  private readonly _entities = new Map<string, CombatEntityState>()
  private readonly _localHeroId: string

  constructor(
    localHeroParams: CreateHeroParams,
    enemyParams: CreateHeroParams
  ) {
    this._localHeroId = localHeroParams.id
    this._entities.set(localHeroParams.id, createHeroState(localHeroParams))
    this._entities.set(enemyParams.id, createHeroState(enemyParams))
  }

  get localHeroId(): string {
    return this._localHeroId
  }

  // ---- Entity registry ----

  registerEntity(entity: CombatEntityState): void {
    this._entities.set(entity.id, entity)
  }

  removeEntity(id: string): void {
    this._entities.delete(id)
  }

  /**
   * Update an entity immutably.
   * T must match the concrete type the entity was registered with.
   */
  updateEntity<T extends CombatEntityState>(
    id: string,
    updater: (entity: T) => T
  ): void {
    const entity = this._entities.get(id)
    if (!entity) return
    this._entities.set(id, updater(entity as T))
  }

  // ---- Query ----

  getEntity(id: string): CombatEntityState | null {
    return this._entities.get(id) ?? null
  }

  getHeroes(): HeroState[] {
    const heroes: HeroState[] = []
    for (const entity of this._entities.values()) {
      if (isHero(entity)) {
        heroes.push(entity)
      }
    }
    return heroes
  }

  get allEntities(): CombatEntityState[] {
    return [...this._entities.values()]
  }

  getEnemiesOf(team: Team): CombatEntityState[] {
    const enemies: CombatEntityState[] = []
    for (const entity of this._entities.values()) {
      if (!entity.dead && entity.team !== team) {
        enemies.push(entity)
      }
    }
    return enemies
  }

  getEntityRadius(id: string): number {
    const entity = this.getEntity(id)
    return entity?.radius ?? DEFAULT_ENTITY_RADIUS
  }

  // ---- Remote player management (convenience wrappers) ----

  addRemotePlayer(remote: RemotePlayerState): HeroState {
    const heroType = (remote.heroType as HeroType) ?? 'BLADE'
    const state = createHeroState({
      id: remote.sessionId,
      type: heroType,
      team: remote.team === 'blue' ? 'blue' : 'red',
      position: { x: remote.x, y: remote.y },
    })
    this._entities.set(remote.sessionId, state)
    return state
  }

  removeRemotePlayer(sessionId: string): boolean {
    if (!this._entities.has(sessionId)) return false
    this._entities.delete(sessionId)
    return true
  }

  updateRemotePlayer(remote: RemotePlayerState): HeroState | null {
    const existing = this._entities.get(remote.sessionId)
    if (!existing || !isHero(existing)) return null
    const updated: HeroState = {
      ...existing,
      position: { x: remote.x, y: remote.y },
      facing: remote.facing,
      hp: remote.hp,
      maxHp: remote.maxHp,
    }
    this._entities.set(remote.sessionId, updated)
    return updated
  }
}
