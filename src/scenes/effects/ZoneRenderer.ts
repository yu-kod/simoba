import Phaser from 'phaser'
import type { ServerZoneState } from '@/network/GameMode'
import { getZoneVisual } from '@shared/zone/zoneVisuals'

const ZONE_DEPTH = -1

/** Resolves the current rendered position of a hero by session ID. */
export type HeroPositionResolver = (heroId: string) => { x: number; y: number } | null

/**
 * Renders all active zones each frame.
 * Visual style is determined by skillId via ZONE_VISUALS registry.
 * Zones with allyOnly skip rendering when the local player is on the enemy team.
 * Follow zones derive their position from the hero's interpolated coordinates.
 */
export class ZoneRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics
  private readonly zones = new Map<string, ServerZoneState>()
  private readonly localTeam: string
  private readonly getHeroPosition: HeroPositionResolver

  constructor(scene: Phaser.Scene, localTeam: string, getHeroPosition: HeroPositionResolver) {
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(ZONE_DEPTH)
    this.localTeam = localTeam
    this.getHeroPosition = getHeroPosition
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

      // Follow zones use the hero's interpolated position for lag-free rendering
      let { x, y } = zone
      if (zone.followHeroId !== '') {
        const heroPos = this.getHeroPosition(zone.followHeroId)
        if (heroPos) {
          x = heroPos.x
          y = heroPos.y
        }
      }

      // Fill
      this.graphics.fillStyle(visual.color, visual.alpha)
      this.graphics.fillCircle(x, y, zone.radius)

      // Border
      if (visual.borderWidth > 0) {
        this.graphics.lineStyle(visual.borderWidth, visual.borderColor, visual.borderAlpha)
        this.graphics.strokeCircle(x, y, zone.radius)
      }
    }
  }

  destroy(): void {
    this.zones.clear()
    this.graphics.destroy()
  }
}
