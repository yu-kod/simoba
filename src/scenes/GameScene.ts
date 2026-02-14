import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig'
import { HERO_SPEED } from '@/domain/constants'
import { createHeroState, type HeroState } from '@/domain/entities/Hero'
import { move } from '@/domain/systems/MovementSystem'

const HERO_RADIUS = 20
const BLUE_COLOR = 0x3498db
const BACKGROUND_COLOR = 0x2d3436

export class GameScene extends Phaser.Scene {
  private heroState!: HeroState
  private heroGraphics!: Phaser.GameObjects.Graphics
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    const background = this.add.graphics()
    background.fillStyle(BACKGROUND_COLOR, 1)
    background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.heroState = createHeroState({
      id: 'player-1',
      type: 'BLADE',
      team: 'blue',
      position: { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 2 },
    })

    this.heroGraphics = this.add.graphics()
    this.drawHero()

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
        delta / 1000
      )
      this.heroState = { ...this.heroState, position: newPosition }
    }

    // 3. Sync Phaser objects to domain state
    this.drawHero()
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

  private drawHero(): void {
    this.heroGraphics.clear()
    this.heroGraphics.fillStyle(BLUE_COLOR, 1)
    this.heroGraphics.fillCircle(
      this.heroState.position.x,
      this.heroState.position.y,
      HERO_RADIUS
    )
  }
}
