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
import { renderMap } from '@/scenes/mapRenderer'
import { HeroRenderer } from '@/scenes/HeroRenderer'
import { InputHandler } from '@/scenes/InputHandler'

export class GameScene extends Phaser.Scene {
  private heroState!: HeroState
  private heroRenderer!: HeroRenderer
  private inputHandler!: InputHandler

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
      // Spawn within initial camera view (not world center)
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

    // Input handler (Phaser adapter → InputState)
    this.inputHandler = new InputHandler(this)
  }

  update(_time: number, delta: number): void {
    // 1. Read input via InputHandler → pure InputState
    const input = this.inputHandler.read(this.heroState.position)

    // 2. Update facing from movement direction
    const newFacing = updateFacing(this.heroState.facing, input.movement)
    if (newFacing !== this.heroState.facing) {
      this.heroState = { ...this.heroState, facing: newFacing }
    }

    // 3. Update position via pure function
    if (input.movement.x !== 0 || input.movement.y !== 0) {
      const radius = HERO_DEFINITIONS[this.heroState.type].radius
      const newPosition = move(
        this.heroState.position,
        input.movement,
        this.heroState.stats.speed,
        delta / 1000,
        radius
      )
      this.heroState = { ...this.heroState, position: newPosition }
    }

    // 4. Sync Phaser objects to domain state
    this.heroRenderer.sync(this.heroState)
  }
}
