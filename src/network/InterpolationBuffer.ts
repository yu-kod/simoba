/** Snapshot received from the server for interpolation. */
export interface Snapshot {
  readonly x: number
  readonly y: number
  readonly facing: number
  readonly serverTime: number
}

/** Interpolated result returned each frame. */
export interface InterpolatedState {
  readonly x: number
  readonly y: number
  readonly facing: number
}

/** Fixed render delay behind real-time (ms). Must exceed one patch interval. */
const INTERPOLATION_DELAY = 100

/** Maximum snapshots to keep in the ring buffer. */
const MAX_SNAPSHOTS = 10

/** Timestamped snapshot stored in the buffer. */
interface BufferedSnapshot {
  readonly snapshot: Snapshot
  readonly localTime: number
}

/**
 * Buffers server snapshots for an entity and provides smooth time-based
 * linear interpolation (lerp) between snapshots.
 *
 * Design: ring-buffer + delayed render time.
 * - Snapshots are stored with their local arrival time.
 * - Each frame, the render time is `now() - INTERPOLATION_DELAY`.
 * - The two snapshots bracketing the render time are found and lerped.
 * - No extrapolation beyond the latest snapshot.
 * - No discontinuity at snapshot boundaries (continuous motion).
 */
export class InterpolationBuffer {
  private readonly snapshots: BufferedSnapshot[] = []
  private readonly now: () => number

  constructor(options?: { now?: () => number }) {
    this.now = options?.now ?? (() => performance.now())
  }

  /** Push a new server snapshot into the buffer. */
  pushSnapshot(snapshot: Snapshot): void {
    this.snapshots.push({ snapshot, localTime: this.now() })
    // Evict old snapshots to bound memory
    while (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots.shift()
    }
  }

  /**
   * Compute the interpolated position for the current frame.
   * Returns `null` if no snapshots have been received yet.
   */
  getInterpolatedPosition(): InterpolatedState | null {
    const len = this.snapshots.length
    if (len === 0) return null
    if (len === 1) {
      const s = this.snapshots[0].snapshot
      return { x: s.x, y: s.y, facing: s.facing }
    }

    // Render at a fixed delay behind real-time
    const renderTime = this.now() - INTERPOLATION_DELAY

    // If render time is before the first snapshot, clamp to first
    if (renderTime <= this.snapshots[0].localTime) {
      const s = this.snapshots[0].snapshot
      return { x: s.x, y: s.y, facing: s.facing }
    }

    // Find the two snapshots bracketing renderTime
    let a = this.snapshots[0]
    let b = this.snapshots[1]
    for (let i = 1; i < len; i++) {
      if (this.snapshots[i].localTime > renderTime) {
        a = this.snapshots[i - 1]
        b = this.snapshots[i]
        break
      }
      // If renderTime is past this snapshot, it becomes the new lower bound
      if (i === len - 1) {
        // Render time is past the last snapshot — clamp to latest (no extrapolation)
        const s = this.snapshots[len - 1].snapshot
        return { x: s.x, y: s.y, facing: s.facing }
      }
    }

    const interval = b.localTime - a.localTime
    if (interval <= 0) {
      const s = b.snapshot
      return { x: s.x, y: s.y, facing: s.facing }
    }

    const t = Math.max(0, Math.min(1, (renderTime - a.localTime) / interval))

    return {
      x: lerp(a.snapshot.x, b.snapshot.x, t),
      y: lerp(a.snapshot.y, b.snapshot.y, t),
      facing: lerpAngle(a.snapshot.facing, b.snapshot.facing, t),
    }
  }
}

/** Linear interpolation between two numbers. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Interpolate between two angles (radians) via the shortest path.
 * Handles wraparound at ±π correctly.
 */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a
  // Normalize diff to [-π, π]
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI
  return a + diff * t
}
