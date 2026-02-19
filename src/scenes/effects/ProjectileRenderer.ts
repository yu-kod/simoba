import Phaser from 'phaser'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'
import type { ServerProjectileState } from '@/network/GameMode'
import type { Team } from '@/domain/types'

const PROJECTILE_COLORS: Record<Team, number> = {
  blue: 0x3498db,
  red: 0xe74c3c,
  neutral: 0x95a5a6,
}

const PROJECTILE_DEPTH = 8

/**
 * Renders all active projectiles as filled circles each frame.
 * Uses a single shared Graphics object — clears and redraws every update.
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
      const color = PROJECTILE_COLORS[p.ownerTeam]
      this.graphics.fillStyle(color, 1)
      this.graphics.fillCircle(p.position.x, p.position.y, p.radius)
    }
  }

  /** Draw server-synced projectiles (server-authoritative mode). */
  drawServer(projectiles: readonly ServerProjectileState[]): void {
    this.graphics.clear()

    for (const p of projectiles) {
      const color = PROJECTILE_COLORS[p.team as Team]
      this.graphics.fillStyle(color, 1)
      this.graphics.fillCircle(p.x, p.y, p.radius)
    }
  }

  destroy(): void {
    this.graphics.destroy()
  }
}
