import Phaser from 'phaser'
import { MAP_LAYOUT, MAP_COLORS } from '@/domain/mapLayout'
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/domain/constants'

const BOSS_MARKER_RADIUS = 16
const BOSS_MARKER_INNER_RADIUS = 8

export function renderMap(scene: Phaser.Scene): void {
  const g = scene.add.graphics()

  drawBackground(g)
  drawLane(g)
  drawBases(g)
  drawTowers(g)
  drawBushes(g)
  drawBossSpawn(g)
}

function drawBackground(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(MAP_COLORS.background, 1)
  g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
}

function drawLane(g: Phaser.GameObjects.Graphics): void {
  const { x, y, width, height } = MAP_LAYOUT.lane
  g.fillStyle(MAP_COLORS.lane, 1)
  g.fillRect(x, y, width, height)
}

function drawBases(g: Phaser.GameObjects.Graphics): void {
  const { blue, red } = MAP_LAYOUT.bases

  g.fillStyle(MAP_COLORS.bases.blue, 1)
  g.fillRect(blue.x, blue.y, blue.width, blue.height)

  g.fillStyle(MAP_COLORS.bases.red, 1)
  g.fillRect(red.x, red.y, red.width, red.height)
}

function drawTowers(g: Phaser.GameObjects.Graphics): void {
  const { blue, red } = MAP_LAYOUT.towers

  g.fillStyle(MAP_COLORS.towers.blue, 1)
  g.fillCircle(blue.x, blue.y, blue.radius)

  g.fillStyle(MAP_COLORS.towers.red, 1)
  g.fillCircle(red.x, red.y, red.radius)
}

function drawBushes(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(MAP_COLORS.bush, 0.6)
  for (const bush of MAP_LAYOUT.bushes) {
    g.fillRoundedRect(bush.x, bush.y, bush.width, bush.height, 12)
  }
}

function drawBossSpawn(g: Phaser.GameObjects.Graphics): void {
  const { x, y } = MAP_LAYOUT.bossSpawn

  // Outer ring
  g.fillStyle(MAP_COLORS.bossSpawn, 0.3)
  g.fillCircle(x, y, BOSS_MARKER_RADIUS)

  // Inner dot
  g.fillStyle(MAP_COLORS.bossSpawn, 1)
  g.fillCircle(x, y, BOSS_MARKER_INNER_RADIUS)
}
