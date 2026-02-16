import { updateAttackState } from '@/domain/systems/updateAttackState'
import type { HeroState } from '@/domain/entities/Hero'
import type { CombatEntityState } from '@/domain/types'

function makeHero(overrides: Partial<HeroState> = {}): HeroState {
  return {
    id: 'hero-1',
    type: 'BLADE',
    team: 'blue',
    position: { x: 0, y: 0 },
    hp: 650,
    maxHp: 650,
    level: 1,
    xp: 0,
    stats: {
      maxHp: 650,
      speed: 170,
      attackDamage: 60,
      attackRange: 60,
      attackSpeed: 0.8,
    },
    facing: 0,
    attackCooldown: 0,
    attackTargetId: null,
    ...overrides,
  }
}

function makeTarget(
  overrides: Partial<CombatEntityState> = {}
): CombatEntityState {
  return {
    id: 'enemy-1',
    position: { x: 100, y: 0 },
    team: 'red',
    hp: 650,
    maxHp: 650,
    ...overrides,
  }
}

const BLADE_RADIUS = 22
const TARGET_RADIUS = 22

describe('updateAttackState', () => {
  describe('cooldown tick-down', () => {
    it('should decrease attackCooldown by deltaTime', () => {
      const hero = makeHero({ attackCooldown: 1.0 })
      const { hero: updated } = updateAttackState(
        hero,
        null,
        0.016,
        BLADE_RADIUS,
        TARGET_RADIUS
      )
      expect(updated.attackCooldown).toBeCloseTo(0.984)
    })

    it('should clamp cooldown at 0', () => {
      const hero = makeHero({ attackCooldown: 0.01 })
      const { hero: updated } = updateAttackState(
        hero,
        null,
        0.1,
        BLADE_RADIUS,
        TARGET_RADIUS
      )
      expect(updated.attackCooldown).toBe(0)
    })
  })

  describe('no target', () => {
    it('should not produce damage events when attackTargetId is null', () => {
      const hero = makeHero()
      const { damageEvents } = updateAttackState(
        hero,
        null,
        0.016,
        BLADE_RADIUS,
        TARGET_RADIUS
      )
      expect(damageEvents).toHaveLength(0)
    })
  })

  describe('target in range', () => {
    it('should emit damage event when cooldown is 0 and target is in range', () => {
      // center dist 100, effective = 100 - 22 - 22 = 56, attackRange = 60
      const hero = makeHero({
        attackCooldown: 0,
        attackTargetId: 'enemy-1',
      })
      const target = makeTarget({ position: { x: 100, y: 0 } })

      const { hero: updated, damageEvents } = updateAttackState(
        hero,
        target,
        0.016,
        BLADE_RADIUS,
        TARGET_RADIUS
      )

      expect(damageEvents).toHaveLength(1)
      expect(damageEvents[0]).toEqual({
        attackerId: 'hero-1',
        targetId: 'enemy-1',
        damage: 60,
      })
      // Cooldown should be reset to 1 / 0.8 = 1.25
      expect(updated.attackCooldown).toBe(1.25)
    })

    it('should not emit damage event when on cooldown', () => {
      const hero = makeHero({
        attackCooldown: 0.5,
        attackTargetId: 'enemy-1',
      })
      const target = makeTarget({ position: { x: 100, y: 0 } })

      const { damageEvents } = updateAttackState(
        hero,
        target,
        0.016,
        BLADE_RADIUS,
        TARGET_RADIUS
      )

      expect(damageEvents).toHaveLength(0)
    })
  })

  describe('target out of range', () => {
    it('should drop attackTargetId when target moves out of range', () => {
      // center dist 200, effective = 200 - 22 - 22 = 156, attackRange = 60
      const hero = makeHero({
        attackCooldown: 0,
        attackTargetId: 'enemy-1',
      })
      const target = makeTarget({ position: { x: 200, y: 0 } })

      const { hero: updated, damageEvents } = updateAttackState(
        hero,
        target,
        0.016,
        BLADE_RADIUS,
        TARGET_RADIUS
      )

      expect(updated.attackTargetId).toBeNull()
      expect(damageEvents).toHaveLength(0)
    })
  })

  describe('dead target', () => {
    it('should drop attackTargetId when target HP is 0', () => {
      const hero = makeHero({
        attackCooldown: 0,
        attackTargetId: 'enemy-1',
      })
      const target = makeTarget({ position: { x: 100, y: 0 }, hp: 0 })

      const { hero: updated, damageEvents } = updateAttackState(
        hero,
        target,
        0.016,
        BLADE_RADIUS,
        TARGET_RADIUS
      )

      expect(updated.attackTargetId).toBeNull()
      expect(damageEvents).toHaveLength(0)
    })
  })

  describe('attackSpeed edge cases', () => {
    it('should clamp cooldown reset when attackSpeed is 0', () => {
      const hero = makeHero({
        attackCooldown: 0,
        attackTargetId: 'enemy-1',
        stats: {
          maxHp: 650,
          speed: 170,
          attackDamage: 60,
          attackRange: 60,
          attackSpeed: 0,
        },
      })
      const target = makeTarget({ position: { x: 100, y: 0 } })

      const { hero: updated, damageEvents } = updateAttackState(
        hero,
        target,
        0.016,
        BLADE_RADIUS,
        TARGET_RADIUS
      )

      expect(damageEvents).toHaveLength(1)
      expect(updated.attackCooldown).toBe(100) // 1 / 0.01 (MIN_ATTACK_SPEED)
      expect(Number.isFinite(updated.attackCooldown)).toBe(true)
    })
  })

  describe('cooldown reset', () => {
    it('should reset cooldown to 1/attackSpeed after attack', () => {
      const hero = makeHero({
        attackCooldown: 0,
        attackTargetId: 'enemy-1',
        stats: {
          maxHp: 650,
          speed: 170,
          attackDamage: 60,
          attackRange: 60,
          attackSpeed: 0.8,
        },
      })
      const target = makeTarget({ position: { x: 100, y: 0 } })

      const { hero: updated } = updateAttackState(
        hero,
        target,
        0.016,
        BLADE_RADIUS,
        TARGET_RADIUS
      )

      expect(updated.attackCooldown).toBeCloseTo(1.25) // 1 / 0.8
    })
  })

  describe('ranged attack (projectileSpeed > 0)', () => {
    const BOLT_RADIUS = 18
    const BOLT_PROJECTILE_SPEED = 600
    const BOLT_PROJECTILE_RADIUS = 4

    function makeBoltHero(overrides: Partial<HeroState> = {}): HeroState {
      return makeHero({
        type: 'BOLT',
        stats: {
          maxHp: 400,
          speed: 220,
          attackDamage: 45,
          attackRange: 300,
          attackSpeed: 1.0,
        },
        ...overrides,
      })
    }

    it('should emit projectileSpawnEvent instead of damageEvent when projectileSpeed > 0', () => {
      const hero = makeBoltHero({
        attackCooldown: 0,
        attackTargetId: 'enemy-1',
      })
      const target = makeTarget({ position: { x: 100, y: 0 } })

      const result = updateAttackState(
        hero,
        target,
        0.016,
        BOLT_RADIUS,
        TARGET_RADIUS,
        BOLT_PROJECTILE_SPEED,
        BOLT_PROJECTILE_RADIUS
      )

      expect(result.damageEvents).toHaveLength(0)
      expect(result.projectileSpawnEvents).toHaveLength(1)

      const spawn = result.projectileSpawnEvents[0]
      expect(spawn.ownerId).toBe('hero-1')
      expect(spawn.ownerTeam).toBe('blue')
      expect(spawn.targetId).toBe('enemy-1')
      expect(spawn.startPosition).toEqual({ x: 0, y: 0 })
      expect(spawn.damage).toBe(45)
      expect(spawn.speed).toBe(BOLT_PROJECTILE_SPEED)
      expect(spawn.radius).toBe(BOLT_PROJECTILE_RADIUS)
    })

    it('should reset cooldown after ranged attack', () => {
      const hero = makeBoltHero({
        attackCooldown: 0,
        attackTargetId: 'enemy-1',
      })
      const target = makeTarget({ position: { x: 100, y: 0 } })

      const { hero: updated } = updateAttackState(
        hero,
        target,
        0.016,
        BOLT_RADIUS,
        TARGET_RADIUS,
        BOLT_PROJECTILE_SPEED,
        BOLT_PROJECTILE_RADIUS
      )

      expect(updated.attackCooldown).toBe(1.0) // 1 / 1.0
    })

    it('should not emit projectileSpawnEvent when on cooldown', () => {
      const hero = makeBoltHero({
        attackCooldown: 0.5,
        attackTargetId: 'enemy-1',
      })
      const target = makeTarget({ position: { x: 100, y: 0 } })

      const result = updateAttackState(
        hero,
        target,
        0.016,
        BOLT_RADIUS,
        TARGET_RADIUS,
        BOLT_PROJECTILE_SPEED,
        BOLT_PROJECTILE_RADIUS
      )

      expect(result.damageEvents).toHaveLength(0)
      expect(result.projectileSpawnEvents).toHaveLength(0)
    })

    it('should return empty projectileSpawnEvents for melee (default projectileSpeed 0)', () => {
      const hero = makeHero({
        attackCooldown: 0,
        attackTargetId: 'enemy-1',
      })
      const target = makeTarget({ position: { x: 100, y: 0 } })

      const result = updateAttackState(
        hero,
        target,
        0.016,
        BLADE_RADIUS,
        TARGET_RADIUS
      )

      expect(result.damageEvents).toHaveLength(1)
      expect(result.projectileSpawnEvents).toHaveLength(0)
    })
  })
})
