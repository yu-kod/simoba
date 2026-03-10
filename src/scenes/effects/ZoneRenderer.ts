import Phaser from 'phaser'
import type { ServerZoneState } from '@/network/GameMode'
import { getZoneVisual } from '@shared/zone/zoneVisuals'

const ZONE_DEPTH = -1

/**
 * Renders all active zones each frame.
 * Visual style is determined by skillId via ZONE_VISUALS registry.
 * Zones with allyOnly skip rendering when the local player is on the enemy team.
 */
export class ZoneRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics
  private readonly zones = new Map<string, ServerZoneState>()
  private readonly localTeam: string

  constructor(scene: Phaser.Scene, localTeam: string) {
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(ZONE_DEPTH)
    this.localTeam = localTeam
  }

  add(state: ServerZoneState): void {
    this.zones.set(state.id, state)
  }

  remove(zoneId: string): void {
    this.zones.delete(zoneId)
  }

  draw(): void {
    this.graphics.clear()

    for (const zone of this.zones.values()) {
      const visual = getZoneVisual(zone.skillId)

      // allyOnly zones are hidden from the enemy team
      if (visual.allyOnly && zone.team !== this.localTeam) continue

      // Fill
      this.graphics.fillStyle(visual.color, visual.alpha)
      this.graphics.fillCircle(zone.x, zone.y, zone.radius)

      // Border
      if (visual.borderWidth > 0) {
        this.graphics.lineStyle(visual.borderWidth, visual.borderColor, visual.borderAlpha)
        this.graphics.strokeCircle(zone.x, zone.y, zone.radius)
      }
    }
  }

  destroy(): void {
    this.zones.clear()
    this.graphics.destroy()
  }
}
