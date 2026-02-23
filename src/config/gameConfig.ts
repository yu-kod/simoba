import Phaser from 'phaser'
import { BootScene } from '@/scenes/BootScene'
import { LobbyScene } from '@/scenes/LobbyScene'
import { GameScene } from '@/scenes/GameScene'

export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2d3436',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  scene: [BootScene, LobbyScene, GameScene],
}
