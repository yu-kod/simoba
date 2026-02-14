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

const BLUE_COLOR = 0x3498db
const BACKGROUND_COLOR = 0x2d3436

export class GameScene extends Phaser.Scene {
  private heroState!: HeroState
  private heroGraphics!: Phaser.GameObjects.Graphics
  private heroContainer!: Phaser.GameObjects.Container
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    // World background (full 3200x720)
    const background = this.add.graphics()
    background.fillStyle(BACKGROUND_COLOR, 1)
    background.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

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

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
    }
  }

  update(_time: number, delta: number): void {
    // 1. Read input
    const direction = this.readInput()

    // 2. Update domain state via pure function
    if (direction.x !== 0 || direction.y !== 0) {
      const newPosition = move(
        this.heroState.position,
        direction,
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

  private readInput(): { x: number; y: number } {
    if (!this.cursors) {
      return { x: 0, y: 0 }
    }

    let x = 0
    let y = 0

    if (this.cursors.left.isDown) x -= 1
    if (this.cursors.right.isDown) x += 1
    if (this.cursors.up.isDown) y -= 1
    if (this.cursors.down.isDown) y += 1

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y)
      x /= length
      y /= length
    }

    return { x, y }
  }
}
