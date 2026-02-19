import type { InputMessage } from '@shared/messages'
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/domain/constants'

interface PredictedPosition {
  readonly x: number
  readonly y: number
}

/**
 * Client-side movement prediction with server reconciliation.
 * Applies local inputs immediately for responsive feel,
 * then reconciles when server state arrives.
 */
export class MovementPredictor {
  private predictedX = 0
  private predictedY = 0

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

  /** Set position directly (e.g., on initial spawn). */
  setPosition(x: number, y: number): void {
    this.predictedX = x
    this.predictedY = y
  }

  get position(): PredictedPosition {
    return { x: this.predictedX, y: this.predictedY }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
