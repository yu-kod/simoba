import { MapSchema } from '@colyseus/schema'
import { isInAttackRange } from '@shared/combat'
import { MELEE_MINION, RANGED_MINION } from '@shared/entities/Minion'
import {
  MINION_WAVE_INTERVAL,
  MINION_XP_REWARD,
  XP_GRANT_RANGE,
  MINION_DEATH_CLEANUP_DELAY,
  MINION_DETECTION_RANGE,
  getWaveConfig,
} from '@shared/constants'
import type { MinionSchema } from '../schema/MinionSchema.js'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'
import type { CombatEventMessage } from '@shared/messages'

const BLUE_MELEE_X = 150
const BLUE_RANGED_X = 120
const RED_MELEE_X = 3050
const RED_RANGED_X = 3080
const MELEE_Y_OFFSETS = [340, 360, 380] as const
const RANGED_Y = 360

let waveCounter = 0
let minionProjectileIdCounter = 0

export function resetMinionCounters(): void {
  waveCounter = 0
  minionProjectileIdCounter = 0
}

// Death cleanup timers (minionId -> remaining ms)
const deathTimers = new Map<string, number>()

export function resetDeathTimers(): void {
  deathTimers.clear()
}

// --- Spawn ---

export function spawnMinionWave(
  matchTime: number,
  nextWaveTime: number,
  minions: MapSchema<MinionSchema>,
  MinionSchemaClass: new () => MinionSchema,
): number {
  if (matchTime < nextWaveTime) return nextWaveTime

  const config = getWaveConfig(matchTime)
  const waveId = waveCounter++

  for (const team of ['blue', 'red'] as const) {
    const meleeX = team === 'blue' ? BLUE_MELEE_X : RED_MELEE_X
    const rangedX = team === 'blue' ? BLUE_RANGED_X : RED_RANGED_X
    const def_melee = MELEE_MINION
    const def_ranged = RANGED_MINION
    const mult = config.statMultiplier

    for (let i = 0; i < config.meleeCount; i++) {
      const m = new MinionSchemaClass()
      const y = MELEE_Y_OFFSETS[i] ?? 360
      m.id = `minion-${team}-${waveId}-melee-${i}`
      m.x = meleeX
      m.y = y
      m.team = team
      m.minionType = 'melee'
      m.hp = Math.round(def_melee.stats.maxHp * mult)
      m.maxHp = Math.round(def_melee.stats.maxHp * mult)
      m.speed = def_melee.stats.speed
      m.attackDamage = Math.round(def_melee.stats.attackDamage * mult)
      m.attackRange = def_melee.stats.attackRange
      m.attackSpeed = def_melee.stats.attackSpeed
      m.radius = def_melee.radius
      m.projectileSpeed = def_melee.projectileSpeed
      m.projectileRadius = def_melee.projectileRadius
      m.facing = team === 'blue' ? 0 : Math.PI
      m.attackCooldown = 0
      m.attackTargetId = ''
      m.dead = false
      minions.set(m.id, m)
    }

    for (let i = 0; i < config.rangedCount; i++) {
      const m = new MinionSchemaClass()
      m.id = `minion-${team}-${waveId}-ranged-${i}`
      m.x = rangedX
      m.y = RANGED_Y
      m.team = team
      m.minionType = 'ranged'
      m.hp = Math.round(def_ranged.stats.maxHp * mult)
      m.maxHp = Math.round(def_ranged.stats.maxHp * mult)
      m.speed = def_ranged.stats.speed
      m.attackDamage = Math.round(def_ranged.stats.attackDamage * mult)
      m.attackRange = def_ranged.stats.attackRange
      m.attackSpeed = def_ranged.stats.attackSpeed
      m.radius = def_ranged.radius
      m.projectileSpeed = def_ranged.projectileSpeed
      m.projectileRadius = def_ranged.projectileRadius
      m.facing = team === 'blue' ? 0 : Math.PI
      m.attackCooldown = 0
      m.attackTargetId = ''
      m.dead = false
      minions.set(m.id, m)
    }
  }

  return matchTime + MINION_WAVE_INTERVAL
}

// --- Target Candidates ---

interface TargetCandidate {
  id: string
  x: number
  y: number
  radius: number
  entityType: 'minion' | 'tower' | 'hero'
}

function collectEnemyTargets(
  minion: MinionSchema,
  minions: MapSchema<MinionSchema>,
  towers: MapSchema<TowerSchema>,
  heroes: MapSchema<HeroSchema>,
): TargetCandidate[] {
  const targets: TargetCandidate[] = []

  minions.forEach((m, id) => {
    if (!m.dead && m.team !== minion.team) {
      targets.push({ id, x: m.x, y: m.y, radius: m.radius, entityType: 'minion' })
    }
  })

  towers.forEach((t, id) => {
    if (!t.dead && t.team !== minion.team) {
      targets.push({ id, x: t.x, y: t.y, radius: t.radius, entityType: 'tower' })
    }
  })

  heroes.forEach((h, id) => {
    if (!h.dead && h.team !== minion.team) {
      targets.push({ id, x: h.x, y: h.y, radius: h.radius, entityType: 'hero' })
    }
  })

  return targets
}

const PRIORITY_ORDER: readonly string[] = ['minion', 'tower', 'hero']

/**
 * Find the best target within the given range, using priority order.
 * Uses center-to-center distance minus radii (same as isInAttackRange).
 */
function selectTargetInRange(
  minion: MinionSchema,
  candidates: TargetCandidate[],
  range: number,
): TargetCandidate | null {
  for (const priority of PRIORITY_ORDER) {
    let best: TargetCandidate | null = null
    let bestDistSq = Infinity

    for (const c of candidates) {
      if (c.entityType !== priority) continue
      const inRange = isInAttackRange(
        { x: minion.x, y: minion.y },
        { x: c.x, y: c.y },
        minion.radius,
        c.radius,
        range,
      )
      if (!inRange) continue
      const dx = c.x - minion.x
      const dy = c.y - minion.y
      const distSq = dx * dx + dy * dy
      if (distSq < bestDistSq) {
        bestDistSq = distSq
        best = c
      }
    }

    if (best) return best
  }
  return null
}

// --- Unified Behavior: March / Chase / Attack ---
//
// Each tick, every minion decides one of three behaviors:
//
// 1. **March** — No enemy within detection range.
//    Move horizontally along the lane toward the enemy base.
//
// 2. **Chase** — Enemy detected (within detection range) but NOT in attack range.
//    Move toward the target at normal speed.
//
// 3. **Attack** — Enemy within attack range.
//    Stop moving and attack the target.
//
// Transition rules:
//   March → Chase : enemy enters detection range
//   Chase → Attack : target enters attack range
//   Chase → March  : target leaves detection range or dies
//   Attack → Chase : target exits attack range but still within detection range
//   Attack → March : target exits detection range or dies

export function processMinionBehavior(
  minions: MapSchema<MinionSchema>,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  projectiles: MapSchema<ProjectileSchema>,
  ProjectileSchemaClass: new () => ProjectileSchema,
  deltaTime: number,
): CombatEventMessage[] {
  const events: CombatEventMessage[] = []

  minions.forEach((minion, minionId) => {
    if (minion.dead) {
      minion.attackTargetId = ''
      minion.attackCooldown = 0
      return
    }

    // Reduce cooldown
    if (minion.attackCooldown > 0) {
      minion.attackCooldown = Math.max(0, minion.attackCooldown - deltaTime)
    }

    const candidates = collectEnemyTargets(minion, minions, towers, heroes)

    // Check for attack-range target first (Attack state)
    const attackTarget = selectTargetInRange(minion, candidates, minion.attackRange)

    if (attackTarget) {
      // --- Attack ---
      minion.attackTargetId = attackTarget.id
      const facingToTarget = Math.atan2(attackTarget.y - minion.y, attackTarget.x - minion.x)
      minion.facing = facingToTarget

      if (minion.attackCooldown <= 0) {
        minion.attackCooldown = 1 / minion.attackSpeed
        const attackEvents = fireAttack(minion, minionId, attackTarget, heroes, towers, minions, projectiles, ProjectileSchemaClass)
        events.push(...attackEvents)
      }
      return
    }

    // Check for detection-range target (Chase state)
    const chaseTarget = selectTargetInRange(minion, candidates, MINION_DETECTION_RANGE)

    if (chaseTarget) {
      // --- Chase ---
      minion.attackTargetId = chaseTarget.id
      const dx = chaseTarget.x - minion.x
      const dy = chaseTarget.y - minion.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > 0) {
        minion.facing = Math.atan2(dy, dx)
        minion.x += (dx / dist) * minion.speed * deltaTime
        minion.y += (dy / dist) * minion.speed * deltaTime
      }
      return
    }

    // --- March ---
    minion.attackTargetId = ''
    const direction = minion.team === 'blue' ? 1 : -1
    minion.facing = direction === 1 ? 0 : Math.PI
    minion.x += minion.speed * deltaTime * direction
  })

  return events
}

// --- Fire Attack (extract attack logic for reuse) ---

function fireAttack(
  minion: MinionSchema,
  minionId: string,
  target: TargetCandidate,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  minions: MapSchema<MinionSchema>,
  projectiles: MapSchema<ProjectileSchema>,
  ProjectileSchemaClass: new () => ProjectileSchema,
): CombatEventMessage[] {
  const events: CombatEventMessage[] = []
  const facingToTarget = Math.atan2(target.y - minion.y, target.x - minion.x)

  if (minion.projectileSpeed === 0) {
    // Melee: immediate damage
    applyDamageById(target.id, minion.attackDamage, heroes, towers, minions)

    events.push({
      kind: 'attack',
      event: {
        attackerId: minionId,
        targetId: target.id,
        attackType: 'melee',
        position: { x: minion.x, y: minion.y },
        facing: facingToTarget,
      },
    })
    events.push({
      kind: 'damage',
      event: {
        targetId: target.id,
        amount: minion.attackDamage,
        sourceId: minionId,
      },
    })
  } else {
    // Ranged: spawn projectile
    const proj = new ProjectileSchemaClass()
    proj.id = `minion-proj-${++minionProjectileIdCounter}`
    proj.x = minion.x
    proj.y = minion.y
    proj.targetX = target.x
    proj.targetY = target.y
    proj.speed = minion.projectileSpeed
    proj.damage = minion.attackDamage
    proj.ownerId = minionId
    proj.team = minion.team
    projectiles.set(proj.id, proj)

    events.push({
      kind: 'attack',
      event: {
        attackerId: minionId,
        targetId: target.id,
        attackType: 'ranged',
        position: { x: minion.x, y: minion.y },
        facing: facingToTarget,
      },
    })
  }

  return events
}

// --- Damage helper (looks up in heroes, towers, then minions) ---

function applyDamageById(
  targetId: string,
  damage: number,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  minions: MapSchema<MinionSchema>,
): void {
  const hero = heroes.get(targetId)
  if (hero) {
    hero.hp = Math.max(0, hero.hp - damage)
    return
  }
  const tower = towers.get(targetId)
  if (tower) {
    tower.hp = Math.max(0, tower.hp - damage)
    return
  }
  const minion = minions.get(targetId)
  if (minion) {
    minion.hp = Math.max(0, minion.hp - damage)
  }
}

// --- Separation (prevent overlap) ---
//
// When two alive minions overlap, only the later-spawned one is displaced.
// "Later" is determined by lexicographic ID comparison (IDs encode wave + index).
// Displacement is perpendicular to the lane (Y axis) to avoid disrupting march.

const SEPARATION_MIN_DIST = 2 // px — minimum distance between edges

export function applyMinionSeparation(
  minions: MapSchema<MinionSchema>,
): void {
  const alive: MinionSchema[] = []
  minions.forEach((m) => {
    if (!m.dead) alive.push(m)
  })

  for (let i = 0; i < alive.length; i++) {
    const a = alive[i]!
    for (let j = i + 1; j < alive.length; j++) {
      const b = alive[j]!

      // Only separate same-team minions
      if (a.team !== b.team) continue

      const dx = b.x - a.x
      const dy = b.y - a.y
      const distSq = dx * dx + dy * dy
      const minDist = a.radius + b.radius + SEPARATION_MIN_DIST
      const minDistSq = minDist * minDist

      if (distSq >= minDistSq) continue

      // Overlapping — push the later-spawned minion away
      const dist = Math.sqrt(distSq)
      const overlap = minDist - dist

      // Determine which is later (higher ID = later wave/index)
      const later = a.id > b.id ? a : b
      const earlier = a.id > b.id ? b : a

      if (dist < 0.001) {
        // Nearly identical position — push later minion in Y
        later.y += overlap
      } else {
        // Push later minion away from earlier along the line between them
        const nx = (later.x - earlier.x) / dist
        const ny = (later.y - earlier.y) / dist
        later.x += nx * overlap
        later.y += ny * overlap
      }
    }
  }
}

// --- Death + XP Distribution ---

export function processMinionDeaths(
  minions: MapSchema<MinionSchema>,
  heroes: MapSchema<HeroSchema>,
  deltaTime: number,
): CombatEventMessage[] {
  const events: CombatEventMessage[] = []

  // Mark dead
  minions.forEach((minion) => {
    if (!minion.dead && minion.hp <= 0) {
      minion.dead = true
      minion.attackTargetId = ''

      // Distribute XP to nearby enemy heroes
      const eligibleHeroes: HeroSchema[] = []
      heroes.forEach((hero) => {
        if (hero.dead || hero.team === minion.team) return
        const dx = hero.x - minion.x
        const dy = hero.y - minion.y
        const distSq = dx * dx + dy * dy
        if (distSq <= XP_GRANT_RANGE * XP_GRANT_RANGE) {
          eligibleHeroes.push(hero)
        }
      })

      if (eligibleHeroes.length > 0) {
        const xpEach = Math.floor(MINION_XP_REWARD / eligibleHeroes.length)
        for (const hero of eligibleHeroes) {
          hero.xp = hero.xp + xpEach
        }
      }

      // Start cleanup timer
      deathTimers.set(minion.id, MINION_DEATH_CLEANUP_DELAY)
    }
  })

  // Tick death timers and cleanup
  for (const [id, remaining] of deathTimers) {
    const newRemaining = remaining - deltaTime * 1000
    if (newRemaining <= 0) {
      minions.delete(id)
      deathTimers.delete(id)
    } else {
      deathTimers.set(id, newRemaining)
    }
  }

  return events
}
