import Phaser from 'phaser'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'
import type { ServerProjectileState } from '@/network/GameMode'
import {
  PROJECTILE_VISUALS,
  type ProjectileVisualType,
  type DiamondVisualDef,
} from '@shared/projectile/projectileVisuals'
import { TEAM_COLORS } from './entityColors'

const PROJECTILE_DEPTH = 8

/**
 * Renders all active projectiles each frame.
 * Visual style is determined by `visualType` (from PROJECTILE_VISUALS table),
 * keeping rendering logic separate from flight mode.
 */
export class ProjectileRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(PROJECTILE_DEPTH)
  }

  draw(projectiles: readonly ProjectileState[]): void {
    this.graphics.clear()

    for (const p of projectiles) {
      const color = TEAM_COLORS[p.ownerTeam]
      this.graphics.fillStyle(color, 1)
      this.graphics.fillCircle(p.position.x, p.position.y, p.radius)
    }
  }

  /** Draw server-synced projectiles (server-authoritative mode). */
  drawServer(projectiles: readonly ServerProjectileState[]): void {
    this.graphics.clear()

    for (const p of projectiles) {
      const color = TEAM_COLORS[p.team as Team]
      const visual = PROJECTILE_VISUALS[p.visualType as ProjectileVisualType]

      if (!visual || visual.type === 'circle') {
        this.graphics.fillStyle(color, 1)
        this.graphics.fillCircle(p.x, p.y, p.radius)
      } else if (visual.type === 'diamond') {
        this.drawDiamond(p.x, p.y, p.dirX, p.dirY, color, visual)
      }
    }
  }

  private drawDiamond(
    x: number, y: number,
    dirX: number, dirY: number,
    color: number,
    def: DiamondVisualDef,
  ): void {
    const perpX = -dirY
    const perpY = dirX

    const fx = x + dirX * def.halfLength
    const fy = y + dirY * def.halfLength
    const bx = x - dirX * def.halfLength
    const by = y - dirY * def.halfLength
    const rx = x + perpX * def.halfWidth
    const ry = y + perpY * def.halfWidth
    const lx = x - perpX * def.halfWidth
    const ly = y - perpY * def.halfWidth

    this.graphics.fillStyle(color, 1)
    this.graphics.beginPath()
    this.graphics.moveTo(fx, fy)
    this.graphics.lineTo(rx, ry)
    this.graphics.lineTo(bx, by)
    this.graphics.lineTo(lx, ly)
    this.graphics.closePath()
    this.graphics.fillPath()
  }

  destroy(): void {
    this.graphics.destroy()
  }
}
