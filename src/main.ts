import Phaser from 'phaser'
import { gameConfig } from '@/config/gameConfig'

const game = new Phaser.Game(gameConfig)

if (import.meta.env.DEV) {
  Object.assign(window, { game })
}

export default game
