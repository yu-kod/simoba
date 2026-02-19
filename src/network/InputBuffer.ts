import type { InputMessage } from '@shared/messages'

/**
 * Manages a buffer of seq-numbered inputs for client-side prediction.
 * Inputs are stored until acknowledged by the server via lastProcessedSeq.
 */
export class InputBuffer {
  private buffer: InputMessage[] = []
  private nextSeq = 1

  /** Get the next sequence number and increment the counter. */
  getNextSeq(): number {
    return this.nextSeq++
  }

  /** Add an input to the buffer. */
  add(input: InputMessage): void {
    this.buffer.push(input)
  }

  /** Remove all inputs with seq <= acknowledgedSeq. */
  acknowledge(acknowledgedSeq: number): void {
    this.buffer = this.buffer.filter((input) => input.seq > acknowledgedSeq)
  }

  /** Get all unacknowledged inputs (seq > acknowledgedSeq). */
  getUnacknowledged(): readonly InputMessage[] {
    return this.buffer
  }

  /** Get the current buffer size. */
  get size(): number {
    return this.buffer.length
  }

  /** Clear all buffered inputs. */
  clear(): void {
    this.buffer = []
  }
}
