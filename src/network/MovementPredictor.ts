import type { InputMessage } from '@shared/messages'
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/domain/constants'

export interface PredictedPosition {
  readonly x: number
  readonly y: number
}

/** Distance threshold (px) above which reconciliation snaps instantly. */
const SNAP_THRESHOLD = 200

/** Per-frame exponential blend factor for small corrections. */
const SMOOTHING_FACTOR = 0.15

/**
 * Client-side movement prediction with server reconciliation.
 * Applies local inputs immediately for responsive feel,
 * then reconciles when server state arrives.
 */
export class MovementPredictor {
  private predictedX = 0
  private predictedY = 0
  private smoothedX = 0
  private smoothedY = 0
  private smoothingEnabled = false

  /** Apply a single input to the predicted position. */
  applyInput(input: InputMessage, speed: number, deltaTime: number): PredictedPosition {
    const { moveDir } = input
    if (moveDir.x === 0 && moveDir.y === 0) {
      return { x: this.predictedX, y: this.predictedY }
    }

    const len = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y)
    if (len === 0) {
      return { x: this.predictedX, y: this.predictedY }
    }

    const nx = moveDir.x / len
    const ny = moveDir.y / len

    this.predictedX = clamp(this.predictedX + nx * speed * deltaTime, 0, WORLD_WIDTH)
    this.predictedY = clamp(this.predictedY + ny * speed * deltaTime, 0, WORLD_HEIGHT)

    return { x: this.predictedX, y: this.predictedY }
  }

  /**
   * Reconcile with server state.
   * Sets position to server position, then replays all unacknowledged inputs.
   */
  reconcile(
    serverX: number,
    serverY: number,
    unacknowledgedInputs: readonly InputMessage[],
    speed: number,
    tickDeltaTime: number
  ): PredictedPosition {
    this.predictedX = serverX
    this.predictedY = serverY

    for (const input of unacknowledgedInputs) {
      this.applyInput(input, speed, tickDeltaTime)
    }

    return { x: this.predictedX, y: this.predictedY }
  }

  /**
   * Smooth the reconciled position relative to the current smoothed position.
   * - If the distance exceeds SNAP_THRESHOLD, snap immediately (teleport/respawn).
   * - Otherwise, blend exponentially toward the reconciled position.
   *
   * Call this after reconcile() when smoothing is enabled.
   */
  smoothPosition(reconciledX: number, reconciledY: number): PredictedPosition {
    if (!this.smoothingEnabled) {
      this.smoothedX = reconciledX
      this.smoothedY = reconciledY
      return { x: reconciledX, y: reconciledY }
    }

    const dx = reconciledX - this.smoothedX
    const dy = reconciledY - this.smoothedY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance >= SNAP_THRESHOLD) {
      // Large discrepancy — snap immediately
      this.smoothedX = reconciledX
      this.smoothedY = reconciledY
    } else {
      // Small discrepancy — exponential blend
      this.smoothedX = this.smoothedX + dx * SMOOTHING_FACTOR
      this.smoothedY = this.smoothedY + dy * SMOOTHING_FACTOR
    }

    return { x: this.smoothedX, y: this.smoothedY }
  }

  /** Enable or disable prediction smoothing (online mode only). */
  setSmoothingEnabled(enabled: boolean): void {
    this.smoothingEnabled = enabled
  }

  /** Set position directly (e.g., on initial spawn). */
  setPosition(x: number, y: number): void {
    this.predictedX = x
    this.predictedY = y
    this.smoothedX = x
    this.smoothedY = y
  }

  get position(): PredictedPosition {
    return { x: this.predictedX, y: this.predictedY }
  }

  get smoothedPosition(): PredictedPosition {
    return { x: this.smoothedX, y: this.smoothedY }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
