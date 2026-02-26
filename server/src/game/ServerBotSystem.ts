import type { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { TowerSchema } from '../schema/TowerSchema.js'
import type { MinionSchema } from '../schema/MinionSchema.js'
import type { InputMessage } from '@shared/messages'

interface PositionEntity {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly dead: boolean
  readonly team: string
  readonly radius: number
}

function distanceSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

/**
 * Find the nearest enemy entity (minion > hero > tower) for bot targeting.
 * Prioritizes minions, then heroes, then towers to simulate natural play patterns.
 */
export function findBotTarget(
  bot: HeroSchema,
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  minions: MapSchema<MinionSchema>,
): PositionEntity | null {
  let bestTarget: PositionEntity | null = null
  let bestDistSq = Infinity

  // Check minions first (highest priority targets)
  minions.forEach((minion) => {
    if (minion.dead || minion.team === bot.team) return
    const d = distanceSq(bot.x, bot.y, minion.x, minion.y)
    if (d < bestDistSq) {
      bestDistSq = d
      bestTarget = minion
    }
  })

  // Check enemy heroes
  heroes.forEach((hero) => {
    if (hero.dead || hero.team === bot.team || hero.id === bot.id) return
    const d = distanceSq(bot.x, bot.y, hero.x, hero.y)
    if (d < bestDistSq) {
      bestDistSq = d
      bestTarget = hero
    }
  })

  // Check enemy towers (lowest priority)
  towers.forEach((tower) => {
    if (tower.dead || tower.team === bot.team) return
    const d = distanceSq(bot.x, bot.y, tower.x, tower.y)
    if (d < bestDistSq) {
      bestDistSq = d
      bestTarget = tower
    }
  })

  return bestTarget
}

/**
 * Generate an InputMessage for a bot hero based on its target.
 * - If in attack range: stop moving, set attackTargetId
 * - If out of range: move toward target
 */
export function generateBotInput(
  bot: HeroSchema,
  target: PositionEntity,
): InputMessage {
  const dx = target.x - bot.x
  const dy = target.y - bot.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const effectiveDist = dist - bot.radius - target.radius
  const inRange = effectiveDist <= bot.attackRange

  if (inRange) {
    // In range: stop and attack
    const facing = Math.atan2(dy, dx)
    return {
      seq: 0,
      moveDir: { x: 0, y: 0 },
      attackTargetId: target.id,
      facing,
    }
  }

  // Out of range: move toward target
  const len = dist > 0 ? dist : 1
  const moveX = dx / len
  const moveY = dy / len
  const facing = Math.atan2(dy, dx)

  return {
    seq: 0,
    moveDir: { x: moveX, y: moveY },
    attackTargetId: null,
    facing,
  }
}

/**
 * Generate inputs for all bot heroes. Called once per tick.
 * Returns a Map of botId → InputMessage.
 */
export function generateBotInputs(
  heroes: MapSchema<HeroSchema>,
  towers: MapSchema<TowerSchema>,
  minions: MapSchema<MinionSchema>,
): Map<string, InputMessage> {
  const inputs = new Map<string, InputMessage>()

  heroes.forEach((hero, heroId) => {
    if (!hero.isBot) return
    if (hero.dead) return

    const target = findBotTarget(hero, heroes, towers, minions)
    if (!target) return

    inputs.set(heroId, generateBotInput(hero, target))
  })

  return inputs
}
