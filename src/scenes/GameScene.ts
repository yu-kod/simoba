import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig'
import {
  HERO_RADIUS,
  HERO_SPEED,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMERA_LERP,
} from '@/domain/constants'
import { createHeroState, type HeroState } from '@/domain/entities/Hero'
import { move } from '@/domain/systems/MovementSystem'
import { renderMap } from '@/scenes/mapRenderer'
import { InputHandler } from '@/scenes/InputHandler'

const BLUE_COLOR = 0x3498db

export class GameScene extends Phaser.Scene {
  private heroState!: HeroState
  private heroGraphics!: Phaser.GameObjects.Graphics
  private heroContainer!: Phaser.GameObjects.Container
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

    // Hero visual (container + graphics for camera follow target)
    this.heroContainer = this.add.container(
      this.heroState.position.x,
      this.heroState.position.y
    )
    this.heroGraphics = this.add.graphics()
    this.heroGraphics.fillStyle(BLUE_COLOR, 1)
    this.heroGraphics.fillCircle(0, 0, HERO_RADIUS)
    this.heroContainer.add(this.heroGraphics)

    // Camera follows hero container with lerp
    this.cameras.main.startFollow(this.heroContainer, true, CAMERA_LERP, CAMERA_LERP)

    // Input handler (Phaser adapter → InputState)
    this.inputHandler = new InputHandler(this)
  }

  update(_time: number, delta: number): void {
    // 1. Read input via InputHandler → pure InputState
    const input = this.inputHandler.read(this.heroState.position)

    // 2. Update domain state via pure function
    if (input.movement.x !== 0 || input.movement.y !== 0) {
      const newPosition = move(
        this.heroState.position,
        input.movement,
        HERO_SPEED,
        delta / 1000,
        HERO_RADIUS
      )
      this.heroState = { ...this.heroState, position: newPosition }
    }

    // 3. Sync Phaser objects to domain state
    this.heroContainer.setPosition(
      this.heroState.position.x,
      this.heroState.position.y
    )
  }
}
