import type { Position } from '@/domain/types'

export interface AttackEffectParams {
  readonly position: Position
  readonly facing: number
}

/**
 * Common interface for attack visual effects.
 * Implementations can be swapped without affecting damage logic.
 */
export interface AttackEffectRenderer {
  /** Start playing the effect at the given position/facing */
  play(params: AttackEffectParams): void
  /** Update the effect each frame (e.g. fade out) */
  update(delta: number): void
  /** Whether the effect is currently playing */
  isActive(): boolean
  /** Clean up resources */
  destroy(): void
}
