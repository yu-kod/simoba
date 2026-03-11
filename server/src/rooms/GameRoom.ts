import { Room, Client } from '@colyseus/core'
import { GameRoomState } from '../schema/GameRoomState.js'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { HERO_DEFINITIONS } from '@shared/entities/Hero'
import { DEFAULT_TOWER } from '@shared/entities/Tower'
import { WORLD_WIDTH, WORLD_HEIGHT, MINION_WAVE_INTERVAL } from '@shared/constants'
import type { HeroType } from '@shared/types'
import type { InputMessage, CombatEventMessage } from '@shared/messages'
import { processMovement } from '../game/ServerMovementSystem.js'
import { processHeroCombat } from '../game/ServerCombatManager.js'
import { processProjectiles } from '../game/ServerProjectileSystem.js'
import { processTowerCombat } from '../game/ServerTowerSystem.js'
import { ProjectileTracker } from '../game/ProjectileTracker.js'
import { processDeathAndRespawn } from '../game/ServerDeathSystem.js'
import { isHeroInBase, processBaseRegen } from '../game/ServerBaseRegenSystem.js'
import { checkTowerDestroyed, endMatch, endMatchByDisconnect } from '../game/ServerMatchSystem.js'
import { MinionSchema } from '../schema/MinionSchema.js'
import {
  spawnMinionWave,
  processMinionBehavior,
  applyMinionSeparation,
  processMinionDeaths,
  createMinionSystemContext,
} from '../game/ServerMinionSystem.js'
import { generateBotInputs } from '../game/ServerBotSystem.js'
import { spendBotTalents } from '../game/ServerBotTalentSystem.js'
import { acquireTalent } from '../game/ServerTalentSystem.js'
import {
  assignSkillSlot,
  swapSkillSlots,
  unequipSkillSlot,
} from '../game/ServerSkillSlotSystem.js'
import { executeSkill, tickCooldowns } from '../game/ServerSkillExecutionSystem.js'
import { tickBuffs } from '../game/StatusEffectSystem.js'
import { tickZones } from '../game/ServerZoneSystem.js'
import { processDashDamage, cleanupDashHitSets } from '../game/ServerDashDamageSystem.js'
import { applyMaxLevel } from '../game/maxLevelUtils.js'
import { registerAllEffectHandlers } from '../game/skills/handlers/index.js'
import { TALENT_TREES } from '@shared/talents/index'
import type { SkillSlot } from '@shared/talents/types'
import type { UseSkillMessage } from '@shared/messages'
import { createServerLogger } from '@shared/logging'

const logger = createServerLogger('room')

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

function isValidHeroType(value: unknown): value is HeroType {
  return typeof value === 'string' && value in HERO_DEFINITIONS
}

const VALID_SLOTS = new Set(['Q', 'E', 'R'])

function isValidTalentMessage(msg: unknown): msg is { talentId: string } {
  if (typeof msg !== 'object' || msg === null) return false
  return typeof (msg as Record<string, unknown>).talentId === 'string'
}

function isValidAssignSlotMessage(msg: unknown): msg is { skillId: string; slot: SkillSlot } {
  if (typeof msg !== 'object' || msg === null) return false
  const m = msg as Record<string, unknown>
  return typeof m.skillId === 'string' && VALID_SLOTS.has(m.slot as string)
}

function isValidSwapSlotsMessage(msg: unknown): msg is { slotA: SkillSlot; slotB: SkillSlot } {
  if (typeof msg !== 'object' || msg === null) return false
  const m = msg as Record<string, unknown>
  return VALID_SLOTS.has(m.slotA as string) && VALID_SLOTS.has(m.slotB as string)
}

function isValidUnequipSlotMessage(msg: unknown): msg is { slot: SkillSlot } {
  if (typeof msg !== 'object' || msg === null) return false
  return VALID_SLOTS.has((msg as Record<string, unknown>).slot as string)
}

function isValidUseSkillMessage(msg: unknown): msg is UseSkillMessage {
  if (typeof msg !== 'object' || msg === null) return false
  const m = msg as Record<string, unknown>
  if (!VALID_SLOTS.has(m.slot as string)) return false
  if (typeof m.target !== 'object' || m.target === null) return false
  const t = m.target as Record<string, unknown>
  return typeof t.x === 'number' && typeof t.y === 'number'
    && Number.isFinite(t.x) && Number.isFinite(t.y)
}


export class GameRoom extends Room<GameRoomState> {
  maxClients = MAX_PLAYERS
  private playerInputs = new Map<string, InputMessage>()
  private nextWaveTime = MINION_WAVE_INTERVAL
  private minionCtx = createMinionSystemContext()
  private projectileTracker = new ProjectileTracker()
  private isSoloMode = false
  private dashHitSets = new Map<string, Set<string>>()

  onCreate(options?: Record<string, unknown>): void {
    registerAllEffectHandlers()
    this.setState(new GameRoomState())
    logger.info('Room created', { roomId: this.roomId })

    // Solo mode: 1 player + bot
    if (options?.mode === 'solo') {
      this.isSoloMode = true
      this.maxClients = 1
    }

    // Input message handler
    this.onMessage('input', (client, message: unknown) => {
      if (this.state.matchPhase !== 'playing') return
      if (!isValidInputMessage(message)) return
      this.playerInputs.set(client.sessionId, message)
    })

    // Talent acquisition handler
    this.onMessage('acquireTalent', (client, message: unknown) => {
      if (this.state.matchPhase !== 'playing') return
      if (!isValidTalentMessage(message)) return
      const hero = this.state.heroes.get(client.sessionId)
      if (!hero) return
      const treeDef = TALENT_TREES[hero.heroType as HeroType]
      if (!treeDef) return
      acquireTalent(hero, message.talentId, treeDef)
    })

    // Skill slot handlers
    this.onMessage('assignSkillSlot', (client, message: unknown) => {
      if (this.state.matchPhase !== 'playing') return
      if (!isValidAssignSlotMessage(message)) return
      const hero = this.state.heroes.get(client.sessionId)
      if (!hero) return
      assignSkillSlot(hero, message.skillId, message.slot)
    })

    this.onMessage('swapSkillSlots', (client, message: unknown) => {
      if (this.state.matchPhase !== 'playing') return
      if (!isValidSwapSlotsMessage(message)) return
      const hero = this.state.heroes.get(client.sessionId)
      if (!hero) return
      const isInBase = isHeroInBase(hero)
      swapSkillSlots(hero, message.slotA, message.slotB, isInBase)
    })

    this.onMessage('unequipSkillSlot', (client, message: unknown) => {
      if (this.state.matchPhase !== 'playing') return
      if (!isValidUnequipSlotMessage(message)) return
      const hero = this.state.heroes.get(client.sessionId)
      if (!hero) return
      const isInBase = isHeroInBase(hero)
      unequipSkillSlot(hero, message.slot, isInBase)
    })

    // Max level handler (solo mode only)
    this.onMessage('maxLevel', (client) => {
      if (!this.isSoloMode) return
      if (this.state.matchPhase !== 'playing') return
      const hero = this.state.heroes.get(client.sessionId)
      if (!hero) return
      applyMaxLevel(hero)
    })

    // Skill activation handler
    this.onMessage('useSkill', (client, message: unknown) => {
      if (this.state.matchPhase !== 'playing') return
      if (!isValidUseSkillMessage(message)) return
      const hero = this.state.heroes.get(client.sessionId)
      if (!hero) return
      const event = executeSkill(hero, client.sessionId, message.slot, message.target, this.state.projectiles, this.state.heroes, this.projectileTracker, this.state.zones)
      if (event) {
        this.broadcast('skill', event)
      }
    })

    // Start simulation loop
    this.setSimulationInterval((deltaMs) => {
      this.gameUpdate(deltaMs / 1000)
    }, TICK_RATE_MS)
  }

  onJoin(client: Client, options?: Record<string, unknown>): void {
    const hero = this.createHero(client.sessionId, options?.heroType)
    this.state.heroes.set(client.sessionId, hero)
    logger.info('Player joined', {
      roomId: this.roomId,
      playerId: client.sessionId,
      playerCount: this.state.heroes.size,
    })

    if (this.isSoloMode) {
      // Solo mode: add bot to enemy team, start immediately
      const playerTeam = hero.team
      const enemyTeam = playerTeam === 'blue' ? 'red' : 'blue'
      this.addBotHero(enemyTeam, 0)
      this.state.matchPhase = 'playing'
      this.lock()
      this.setupTowers()
    } else if (this.state.heroes.size === this.maxClients) {
      this.state.matchPhase = 'playing'
      this.lock()
      this.setupTowers()
    }
  }

  private createHero(id: string, heroTypeOption?: unknown): HeroSchema {
    const hero = new HeroSchema()
    // Assign to the team with fewer players (blue breaks ties)
    let blueCount = 0
    let redCount = 0
    this.state.heroes.forEach((h) => {
      if (h.team === 'blue') blueCount++
      else redCount++
    })
    const team = blueCount <= redCount ? 'blue' : 'red'
    const spawn = team === 'blue' ? BLUE_SPAWN : RED_SPAWN
    const heroType: HeroType = isValidHeroType(heroTypeOption)
      ? heroTypeOption as HeroType
      : 'BLADE'
    const def = HERO_DEFINITIONS[heroType]

    hero.id = id
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

    return hero
  }

  /** Add a bot hero to the given team. */
  private addBotHero(team: string, index: number): void {
    const botId = `bot-${team}-${index}`
    const hero = new HeroSchema()
    const spawn = team === 'blue' ? BLUE_SPAWN : RED_SPAWN
    const def = HERO_DEFINITIONS['BLADE']

    hero.id = botId
    hero.x = spawn.x
    hero.y = spawn.y
    hero.facing = 0
    hero.team = team
    hero.heroType = 'BLADE'
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
    hero.isBot = true

    this.state.heroes.set(botId, hero)
  }

  onLeave(client: Client): void {
    const hero = this.state.heroes.get(client.sessionId)

    // Trigger disconnect match end if playing and not solo mode
    if (hero && this.state.matchPhase === 'playing' && !this.isSoloMode) {
      endMatchByDisconnect(this.state, hero.team)
    }

    this.state.heroes.delete(client.sessionId)
    this.playerInputs.delete(client.sessionId)
    logger.info('Player left', {
      roomId: this.roomId,
      playerId: client.sessionId,
      playerCount: this.state.heroes.size,
    })
  }

  onDispose(): void {
    logger.info('Room disposed', { roomId: this.roomId })
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

  /**
   * Terminate the match with a winner. Delegates to the pure function
   * in ServerMatchSystem for testability.
   */
  endMatch(winnerTeam: string): void {
    endMatch(this.state, winnerTeam)
  }

  private gameUpdate(deltaTime: number): void {
    if (this.state.matchPhase !== 'playing') return

    // Update match time
    this.state.matchTime += deltaTime

    const { heroes, towers, projectiles, minions } = this.state
    const events: CombatEventMessage[] = []

    // 0. Generate bot inputs
    const botInputs = generateBotInputs(heroes, towers, minions)
    for (const [botId, input] of botInputs) {
      this.playerInputs.set(botId, input)
    }

    // 0.5. Minion wave spawn
    this.nextWaveTime = spawnMinionWave(
      this.minionCtx,
      this.state.matchTime,
      this.nextWaveTime,
      minions,
      MinionSchema,
    )

    // 1. Process hero combat first (sets attackPauseTimer for ranged attacks)
    heroes.forEach((hero, heroId) => {
      const input = this.playerInputs.get(heroId)
      const heroEvents = processHeroCombat(
        hero,
        heroId,
        input,
        heroes,
        towers,
        projectiles,
        ProjectileSchema,
        deltaTime,
        this.projectileTracker,
        minions,
      )
      events.push(...heroEvents)
    })

    // 1.5. Tick zones (apply effects before buff tick so zone debuffs are included)
    tickZones(this.state.zones, heroes, deltaTime, minions)

    // 1.6. Tick skill cooldowns and buff durations
    heroes.forEach((hero) => {
      tickCooldowns(hero, deltaTime)
      tickBuffs(hero, deltaTime)
    })

    // 2. Apply movement from inputs (respects dashTimer and attackPauseTimer)
    heroes.forEach((hero, sessionId) => {
      const input = this.playerInputs.get(sessionId)
      processMovement(hero, input, deltaTime)

      // Update lastProcessedSeq
      if (input) {
        hero.lastProcessedSeq = input.seq
      }
    })

    // 2.1. Dash contact damage
    const dashDamageEvents = processDashDamage(heroes, minions, this.dashHitSets)
    for (const dmgEvent of dashDamageEvents) {
      events.push({ kind: 'damage', event: dmgEvent })
    }
    cleanupDashHitSets(heroes, this.dashHitSets)

    // 2.5. Process minion behavior (march / chase / attack)
    const minionEvents = processMinionBehavior(
      this.minionCtx,
      minions,
      heroes,
      towers,
      projectiles,
      ProjectileSchema,
      deltaTime,
    )
    events.push(...minionEvents)

    // 2.6. Prevent same-team minion overlap
    applyMinionSeparation(minions)

    // 3. Process tower combat
    towers.forEach((tower, towerId) => {
      const towerEvents = processTowerCombat(
        tower,
        towerId,
        heroes,
        projectiles,
        ProjectileSchema,
        deltaTime,
        this.projectileTracker,
        minions,
      )
      events.push(...towerEvents)
    })

    // 4. Process projectiles
    const projectileEvents = processProjectiles(projectiles, heroes, towers, deltaTime, this.projectileTracker, minions)
    events.push(...projectileEvents)

    // 5. Minion death + XP distribution
    const minionDeathEvents = processMinionDeaths(this.minionCtx, minions, heroes, deltaTime)
    events.push(...minionDeathEvents)

    // 5.5. Bot auto-spend talent points
    spendBotTalents(heroes, TALENT_TREES)

    // 5.6. Base HP regeneration
    processBaseRegen(heroes, deltaTime)

    // 6. Hero death detection and respawn
    const deathEvents = processDeathAndRespawn(heroes, getSpawnPosition, deltaTime)
    events.push(...deathEvents)

    // 7. Check win condition (tower destroyed)
    checkTowerDestroyed(towers, (winner) => this.endMatch(winner))

    // 8. Broadcast combat events to all clients
    for (const msg of events) {
      this.broadcast(msg.kind, msg.event)
    }

    // Clear inputs after processing.
    // Design: "latest input wins" — each client sends inputs every frame,
    // but the server only processes the most recent one per tick (Map.set overwrites).
    // This avoids input queue buildup and keeps the simulation deterministic.
    this.playerInputs.clear()
  }
}
