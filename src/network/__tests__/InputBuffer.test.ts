import { describe, it, expect, beforeEach } from 'vitest'
import { InputBuffer } from '@/network/InputBuffer'
import type { InputMessage } from '@shared/messages'

function createInput(seq: number): InputMessage {
  return {
    seq,
    moveDir: { x: 1, y: 0 },
    attackTargetId: null,
    facing: 0,
  }
}

describe('InputBuffer', () => {
  let buffer: InputBuffer

  beforeEach(() => {
    buffer = new InputBuffer()
  })

  describe('getNextSeq', () => {
    it('should start at 1', () => {
      expect(buffer.getNextSeq()).toBe(1)
    })

    it('should increment on each call', () => {
      expect(buffer.getNextSeq()).toBe(1)
      expect(buffer.getNextSeq()).toBe(2)
      expect(buffer.getNextSeq()).toBe(3)
    })
  })

  describe('add / size', () => {
    it('should start empty', () => {
      expect(buffer.size).toBe(0)
    })

    it('should increase size when adding inputs', () => {
      buffer.add(createInput(1))
      expect(buffer.size).toBe(1)

      buffer.add(createInput(2))
      expect(buffer.size).toBe(2)
    })
  })

  describe('acknowledge', () => {
    it('should remove inputs with seq <= acknowledged', () => {
      buffer.add(createInput(1))
      buffer.add(createInput(2))
      buffer.add(createInput(3))

      buffer.acknowledge(2)

      expect(buffer.size).toBe(1)
      const remaining = buffer.getUnacknowledged()
      expect(remaining).toHaveLength(1)
      expect(remaining[0]!.seq).toBe(3)
    })

    it('should remove all inputs when acknowledging latest', () => {
      buffer.add(createInput(1))
      buffer.add(createInput(2))

      buffer.acknowledge(2)

      expect(buffer.size).toBe(0)
    })

    it('should not remove anything when acknowledging seq 0', () => {
      buffer.add(createInput(1))
      buffer.add(createInput(2))

      buffer.acknowledge(0)

      expect(buffer.size).toBe(2)
    })
  })

  describe('getUnacknowledged', () => {
    it('should return all buffered inputs', () => {
      buffer.add(createInput(1))
      buffer.add(createInput(2))
      buffer.add(createInput(3))

      const unack = buffer.getUnacknowledged()
      expect(unack).toHaveLength(3)
      expect(unack.map((i) => i.seq)).toEqual([1, 2, 3])
    })

    it('should return readonly array', () => {
      buffer.add(createInput(1))
      const unack = buffer.getUnacknowledged()
      expect(Array.isArray(unack)).toBe(true)
    })

    it('should return empty array when buffer is empty', () => {
      expect(buffer.getUnacknowledged()).toEqual([])
    })
  })

  describe('clear', () => {
    it('should remove all inputs', () => {
      buffer.add(createInput(1))
      buffer.add(createInput(2))
      buffer.add(createInput(3))

      buffer.clear()

      expect(buffer.size).toBe(0)
      expect(buffer.getUnacknowledged()).toEqual([])
    })
  })
})
