import { Room, Client } from '@colyseus/core'
import { GameRoomState } from '../schema/GameRoomState.js'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import { DEFAULT_TOWER } from '@shared/entities/Tower'
import { WORLD_WIDTH, WORLD_HEIGHT } from '@shared/constants'
import type { HeroType } from '@shared/types'
import type { InputMessage } from '@shared/messages'
import { processMovement } from '../game/ServerMovementSystem.js'
import { processHeroCombat, resetProjectileIdCounter } from '../game/ServerCombatManager.js'
import { processProjectiles } from '../game/ServerProjectileSystem.js'
import { processTowerCombat, resetTowerProjectileIdCounter } from '../game/ServerTowerSystem.js'
import { processDeathAndRespawn } from '../game/ServerDeathSystem.js'

export const MAX_PLAYERS = 2

export const BLUE_SPAWN = { x: 320, y: 360 } as const
export const RED_SPAWN = { x: 2880, y: 360 } as const

const TOWER_DISTANCE_FROM_EDGE = 600
const TOWER_BLUE_POS = { x: TOWER_DISTANCE_FROM_EDGE, y: WORLD_HEIGHT / 2 }
const TOWER_RED_POS = { x: WORLD_WIDTH - TOWER_DISTANCE_FROM_EDGE, y: WORLD_HEIGHT / 2 }

const TICK_RATE_MS = 16.6 // ~60 Hz

function isValidInputMessage(message: unknown): message is InputMessage {
  if (typeof message !== 'object' || message === null) return false
  const msg = message as Record<string, unknown>
  if (typeof msg.seq !== 'number') return false
  if (typeof msg.facing !== 'number') return false
  if (typeof msg.moveDir !== 'object' || msg.moveDir === null) return false
  const dir = msg.moveDir as Record<string, unknown>
  if (typeof dir.x !== 'number' || typeof dir.y !== 'number') return false
  if (msg.attackTargetId !== null && typeof msg.attackTargetId !== 'string') return false
  return true
}

function getSpawnPosition(team: string): { x: number; y: number } {
  return team === 'blue' ? BLUE_SPAWN : RED_SPAWN
}

export class GameRoom extends Room<GameRoomState> {
  maxClients = MAX_PLAYERS
  private playerInputs = new Map<string, InputMessage>()

  onCreate(): void {
    this.setState(new GameRoomState())

    // Input message handler (replaces updatePosition, damage, projectileSpawn)
    this.onMessage('input', (client, message: unknown) => {
      if (!isValidInputMessage(message)) return
      this.playerInputs.set(client.sessionId, message)
    })

    // Start simulation loop
    this.setSimulationInterval((deltaMs) => {
      this.gameUpdate(deltaMs / 1000)
    }, TICK_RATE_MS)
  }

  onJoin(client: Client): void {
    const hero = new HeroSchema()
    const isBlue = this.state.heroes.size === 0
    const spawn = isBlue ? BLUE_SPAWN : RED_SPAWN
    const team = isBlue ? 'blue' : 'red'
    const heroType: HeroType = 'BLADE'
    const def = HERO_DEFINITIONS[heroType]

    hero.id = client.sessionId
    hero.x = spawn.x
    hero.y = spawn.y
    hero.facing = 0
    hero.team = team
    hero.heroType = heroType
    hero.hp = def.base.maxHp
    hero.maxHp = def.base.maxHp
    hero.speed = def.base.speed
    hero.attackDamage = def.base.attackDamage
    hero.attackRange = def.base.attackRange
    hero.attackSpeed = def.base.attackSpeed
    hero.radius = def.radius
    hero.dead = false
    hero.attackCooldown = 0
    hero.attackTargetId = ''
    hero.respawnTimer = 0
    hero.lastProcessedSeq = 0

    this.state.heroes.set(client.sessionId, hero)

    if (this.state.heroes.size === this.maxClients) {
      this.state.gameStarted = true
      this.setupTowers()
    }
  }

  onLeave(client: Client): void {
    this.state.heroes.delete(client.sessionId)
    this.playerInputs.delete(client.sessionId)
  }

  onDispose(): void {
    resetProjectileIdCounter()
    resetTowerProjectileIdCounter()
  }

  private setupTowers(): void {
    const blueTower = this.createTower('tower-blue', 'blue', TOWER_BLUE_POS)
    const redTower = this.createTower('tower-red', 'red', TOWER_RED_POS)
    this.state.towers.set('tower-blue', blueTower)
    this.state.towers.set('tower-red', redTower)
  }

  private createTower(
    id: string,
    team: string,
    pos: { x: number; y: number }
  ): TowerSchema {
    const tower = new TowerSchema()
    tower.id = id
    tower.x = pos.x
    tower.y = pos.y
    tower.team = team
    tower.hp = DEFAULT_TOWER.stats.maxHp
    tower.maxHp = DEFAULT_TOWER.stats.maxHp
    tower.dead = false
    tower.radius = DEFAULT_TOWER.radius
    tower.attackDamage = DEFAULT_TOWER.stats.attackDamage
    tower.attackRange = DEFAULT_TOWER.stats.attackRange
    tower.attackSpeed = DEFAULT_TOWER.stats.attackSpeed
    tower.attackCooldown = 0
    tower.attackTargetId = ''
    tower.projectileSpeed = DEFAULT_TOWER.projectileSpeed
    tower.projectileRadius = DEFAULT_TOWER.projectileRadius
    return tower
  }

  private gameUpdate(deltaTime: number): void {
    if (!this.state.gameStarted) return

    // Update match time
    this.state.matchTime += deltaTime

    const { heroes, towers, projectiles } = this.state

    // 1. Apply movement from inputs
    heroes.forEach((hero, sessionId) => {
      const input = this.playerInputs.get(sessionId)
      processMovement(hero, input, deltaTime)

      // Update lastProcessedSeq
      if (input) {
        hero.lastProcessedSeq = input.seq
      }
    })

    // 2. Process hero combat (attacks)
    heroes.forEach((hero, heroId) => {
      const input = this.playerInputs.get(heroId)
      processHeroCombat(
        hero,
        heroId,
        input,
        heroes,
        towers,
        projectiles,
        ProjectileSchema,
        deltaTime
      )
    })

    // 3. Process tower combat
    towers.forEach((tower, towerId) => {
      processTowerCombat(
        tower,
        towerId,
        heroes,
        projectiles,
        ProjectileSchema,
        deltaTime
      )
    })

    // 4. Process projectiles
    processProjectiles(projectiles, heroes, towers, deltaTime)

    // 5. Death detection and respawn
    processDeathAndRespawn(heroes, getSpawnPosition, deltaTime)

    // Clear inputs after processing.
    // Design: "latest input wins" — each client sends inputs every frame,
    // but the server only processes the most recent one per tick (Map.set overwrites).
    // This avoids input queue buildup and keeps the simulation deterministic.
    this.playerInputs.clear()
  }
}
