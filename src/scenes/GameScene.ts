import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig'

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x3498db, 1)
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'simoba - Phaser Setup Complete',
      {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5)
  }

  update(_time: number, _delta: number): void {
    // Game loop placeholder
  }
}
