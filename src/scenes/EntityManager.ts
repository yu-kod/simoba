import { createHeroState, type HeroState } from '@/domain/entities/Hero'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
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

  constructor(
    localHeroParams: CreateLocalHeroParams,
    enemyParams: CreateLocalHeroParams
  ) {
    this._localHero = createHeroState(localHeroParams)
    this._enemy = createHeroState(enemyParams)
  }

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

  getEntity(id: string): CombatEntityState | null {
    if (id === this._localHero.id) return this._localHero
    if (id === this._enemy.id) return this._enemy
    return this._remotePlayers.get(id) ?? null
  }

  getEnemies(): CombatEntityState[] {
    const enemies: CombatEntityState[] = []
    if (!this._enemy.dead) enemies.push(this._enemy)
    for (const remote of this._remotePlayers.values()) {
      if (!remote.dead) enemies.push(remote)
    }
    return enemies
  }

  getEntityRadius(id: string): number {
    if (id === this._localHero.id) {
      return HERO_DEFINITIONS[this._localHero.type].radius
    }
    if (id === this._enemy.id) {
      return HERO_DEFINITIONS[this._enemy.type].radius
    }
    const remote = this._remotePlayers.get(id)
    if (remote) {
      return HERO_DEFINITIONS[remote.type].radius
    }
    return DEFAULT_ENTITY_RADIUS
  }

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
