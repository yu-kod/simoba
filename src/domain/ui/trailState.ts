/** Delay before the trail bar starts shrinking (seconds) */
const TRAIL_DELAY_S = 0.5

/** Speed at which the trail bar shrinks (HP per second) */
const TRAIL_SPEED = 200

export interface TrailState {
  /** The HP value the trail bar is currently showing */
  readonly trailHp: number
  /** Seconds remaining before the trail starts shrinking */
  readonly delayRemaining: number
}

/**
 * Create the initial trail state (no trail visible).
 */
export function createTrailState(maxHp: number): TrailState {
  return { trailHp: maxHp, delayRemaining: 0 }
}

/**
 * Update the trailing damage bar state each frame.
 * Pure function — returns a new TrailState.
 *
 * When currentHp drops below trailHp, a delay starts before the trail shrinks.
 * The trail then moves toward currentHp at TRAIL_SPEED HP/s.
 */
export function updateTrail(
  state: TrailState,
  currentHp: number,
  deltaTime: number
): TrailState {
  // If currentHp >= trailHp, no trail to show (or HP was healed)
  if (currentHp >= state.trailHp) {
    return { trailHp: currentHp, delayRemaining: 0 }
  }

  // Trail is above currentHp — we have a visible trail

  // Still in delay phase — wait before shrinking
  if (state.delayRemaining > 0) {
    // Still in delay phase — wait
    const newDelay = Math.max(0, state.delayRemaining - deltaTime)
    return { trailHp: state.trailHp, delayRemaining: newDelay }
  }

  // Delay expired — shrink trail toward currentHp
  const newTrailHp = Math.max(currentHp, state.trailHp - TRAIL_SPEED * deltaTime)
  return { trailHp: newTrailHp, delayRemaining: 0 }
}

/**
 * Notify the trail state that damage occurred.
 * Sets the delay timer so the trail pauses before shrinking.
 * If the trail is already active (showing), keep the existing trailHp
 * (the "right edge" stays where it was for consecutive hits).
 */
export function onDamage(state: TrailState, previousHp: number): TrailState {
  // If trail is already active (trailHp > previousHp is not possible,
  // but trailHp could be higher than the new hp), keep existing trailHp
  const trailHp = Math.max(state.trailHp, previousHp)
  return { trailHp, delayRemaining: TRAIL_DELAY_S }
}

/**
 * Whether the trail bar is currently visible (trailHp > currentHp).
 */
export function isTrailActive(state: TrailState, currentHp: number): boolean {
  return state.trailHp > currentHp
}
