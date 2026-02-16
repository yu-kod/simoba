import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig'
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMERA_LERP,
} from '@/domain/constants'
import { createHeroState, type HeroState } from '@/domain/entities/Hero'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import { move } from '@/domain/systems/MovementSystem'
import { updateFacing } from '@/domain/systems/updateFacing'
import { findClickTarget } from '@/domain/systems/findClickTarget'
import { updateAttackState } from '@/domain/systems/updateAttackState'
import { applyDamage } from '@/domain/systems/applyDamage'
import { isInAttackRange } from '@/domain/systems/isInAttackRange'
import { renderMap } from '@/scenes/mapRenderer'
import { HeroRenderer } from '@/scenes/HeroRenderer'
import { MeleeSwingRenderer } from '@/scenes/effects/MeleeSwingRenderer'
import { InputHandler } from '@/scenes/InputHandler'
import type { CombatEntityState } from '@/domain/types'

const DEFAULT_ENTITY_RADIUS = 20

export class GameScene extends Phaser.Scene {
  private heroState!: HeroState
  private heroRenderer!: HeroRenderer
  private inputHandler!: InputHandler

  private enemyState!: HeroState
  private enemyRenderer!: HeroRenderer

  private meleeSwing!: MeleeSwingRenderer

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    // Map rendering (background + lane + bases + towers + bushes + boss)
    renderMap(this)

    // Physics world bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // Camera bounds and follow setup
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // Hero state (domain)
    this.heroState = createHeroState({
      id: 'player-1',
      type: 'BLADE',
      team: 'blue',
      position: { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 2 },
    })

    // Hero visual (HeroRenderer manages Container + Graphics)
    this.heroRenderer = new HeroRenderer(this, this.heroState)

    // Camera follows hero container with lerp
    this.cameras.main.startFollow(
      this.heroRenderer.gameObject,
      true,
      CAMERA_LERP,
      CAMERA_LERP
    )

    // Enemy hero (static, for attack testing)
    this.enemyState = createHeroState({
      id: 'enemy-1',
      type: 'BLADE',
      team: 'red',
      position: { x: GAME_WIDTH / 4 + 200, y: GAME_HEIGHT / 2 },
    })
    this.enemyRenderer = new HeroRenderer(this, this.enemyState)

    // Attack effect
    this.meleeSwing = new MeleeSwingRenderer(this)

    // Input handler (Phaser adapter → InputState)
    this.inputHandler = new InputHandler(this)
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000
    const input = this.inputHandler.read(this.heroState.position)
    const isMoving = input.movement.x !== 0 || input.movement.y !== 0

    this.processInput(input, isMoving)
    this.processAttack(deltaSeconds)
    this.processFacing(input)
    this.processMovement(input, isMoving, deltaSeconds)
    this.updateEffects(delta)
    this.syncRenderers()
  }

  private processInput(
    input: ReturnType<InputHandler['read']>,
    isMoving: boolean
  ): void {
    if (input.attack) {
      this.heroState = this.handleAttackInput(input.aimWorldPosition)
    }

    // Cancel attack if moving and canMoveWhileAttacking is false
    if (
      isMoving &&
      this.heroState.attackTargetId !== null &&
      !HERO_DEFINITIONS[this.heroState.type].canMoveWhileAttacking
    ) {
      this.heroState = { ...this.heroState, attackTargetId: null }
    }
  }

  private processAttack(deltaSeconds: number): void {
    const target = this.resolveTarget(this.heroState.attackTargetId)
    const heroRadius = HERO_DEFINITIONS[this.heroState.type].radius
    const targetRadius = target ? this.getEntityRadius(target) : 0

    const attackResult = updateAttackState(
      this.heroState,
      target,
      deltaSeconds,
      heroRadius,
      targetRadius
    )
    this.heroState = attackResult.hero

    for (const event of attackResult.damageEvents) {
      if (event.targetId === this.enemyState.id) {
        this.enemyState = applyDamage(this.enemyState, event.damage)
        this.enemyRenderer.flash()
        this.meleeSwing.play({
          position: this.heroState.position,
          facing: this.heroState.facing,
        })
      }
    }
  }

  private processFacing(
    input: ReturnType<InputHandler['read']>
  ): void {
    const target = this.resolveTarget(this.heroState.attackTargetId)
    const targetPosition =
      this.heroState.attackTargetId !== null && target
        ? target.position
        : null
    const newFacing = updateFacing(
      this.heroState.facing,
      input.movement,
      targetPosition,
      this.heroState.position
    )
    if (newFacing !== this.heroState.facing) {
      this.heroState = { ...this.heroState, facing: newFacing }
    }
  }

  private processMovement(
    input: ReturnType<InputHandler['read']>,
    isMoving: boolean,
    deltaSeconds: number
  ): void {
    if (!isMoving) return
    const radius = HERO_DEFINITIONS[this.heroState.type].radius
    const newPosition = move(
      this.heroState.position,
      input.movement,
      this.heroState.stats.speed,
      deltaSeconds,
      radius
    )
    this.heroState = { ...this.heroState, position: newPosition }
  }

  private updateEffects(delta: number): void {
    this.meleeSwing.update(delta)
    this.heroRenderer.update(delta)
    this.enemyRenderer.update(delta)
  }

  private syncRenderers(): void {
    this.heroRenderer.sync(this.heroState)
    this.enemyRenderer.sync(this.enemyState)
  }

  private handleAttackInput(
    aimWorldPosition: { x: number; y: number }
  ): HeroState {
    const enemies: CombatEntityState[] = [this.enemyState]
    const clickedTarget = findClickTarget(
      aimWorldPosition,
      enemies,
      (entity) => this.getEntityRadius(entity)
    )

    if (clickedTarget) {
      // Check if target is in attack range before setting
      const heroRadius = HERO_DEFINITIONS[this.heroState.type].radius
      const targetRadius = this.getEntityRadius(clickedTarget)
      const inRange = isInAttackRange(
        this.heroState.position,
        clickedTarget.position,
        heroRadius,
        targetRadius,
        this.heroState.stats.attackRange
      )

      if (inRange) {
        return { ...this.heroState, attackTargetId: clickedTarget.id }
      }

      // Phase 1: No auto-walk-to-attack. Hero must already be in range.
      // Out of range — update facing toward target but don't start attacking
      const dx = clickedTarget.position.x - this.heroState.position.x
      const dy = clickedTarget.position.y - this.heroState.position.y
      const facingToTarget = Math.atan2(dy, dx)
      return { ...this.heroState, facing: facingToTarget }
    }

    // Ground click — face click direction
    const dx = aimWorldPosition.x - this.heroState.position.x
    const dy = aimWorldPosition.y - this.heroState.position.y
    if (dx !== 0 || dy !== 0) {
      const facingToClick = Math.atan2(dy, dx)
      return { ...this.heroState, facing: facingToClick }
    }

    return this.heroState
  }

  private resolveTarget(targetId: string | null): CombatEntityState | null {
    if (targetId === null) return null
    if (targetId === this.enemyState.id) return this.enemyState
    return null
  }

  private getEntityRadius(entity: CombatEntityState): number {
    // For heroes, look up from definitions
    if (entity.id === this.enemyState.id) {
      return HERO_DEFINITIONS[this.enemyState.type].radius
    }
    if (entity.id === this.heroState.id) {
      return HERO_DEFINITIONS[this.heroState.type].radius
    }
    return DEFAULT_ENTITY_RADIUS
  }
}
