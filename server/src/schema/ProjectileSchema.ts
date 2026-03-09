import { Schema, type } from '@colyseus/schema'

/**
 * Colyseus state schema for a projectile entity.
 */
export class ProjectileSchema extends Schema {
  @type('string') id: string = ''
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('float32') targetX: number = 0
  @type('float32') targetY: number = 0
  @type('float32') speed: number = 0
  @type('int16') damage: number = 0
  @type('string') ownerId: string = ''
  @type('string') team: string = 'blue'
  /** The entity this projectile homes toward. Damage only applies to this target. */
  @type('string') targetId: string = ''

  // ── Linear / pierce fields ──────────────────────────────
  /** Flight mode: 'homing' = track targetId, 'linear' = straight line */
  @type('string') mode: string = 'homing'
  /** Visual style key — see shared/projectile/projectileVisuals.ts */
  @type('string') visualType: string = 'circle'
  /** Direction for linear mode (normalized) */
  @type('float32') dirX: number = 0
  @type('float32') dirY: number = 0
  /** Max flight distance in px (0 = unlimited, used by homing) */
  @type('float32') maxRange: number = 0
  /** Remaining pierce count (0 = remove on first hit) */
  @type('int16') pierceRemaining: number = 0
}
