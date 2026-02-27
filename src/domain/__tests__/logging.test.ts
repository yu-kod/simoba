import { describe, it, expect, vi } from 'vitest'

vi.mock('@logtape/logtape', () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    getChild: vi.fn(),
  }
  return {
    getLogger: vi.fn(() => mockLogger),
  }
})

import { getLogger } from '@logtape/logtape'
import { createClientLogger, createServerLogger } from '@shared/logging'

describe('shared/logging', () => {
  describe('createClientLogger', () => {
    it('creates a logger with correct client category', () => {
      createClientLogger('scene')
      expect(getLogger).toHaveBeenCalledWith(['simoba', 'client', 'scene'])
    })

    it('creates loggers with different subsystems', () => {
      createClientLogger('network')
      expect(getLogger).toHaveBeenCalledWith(['simoba', 'client', 'network'])
    })
  })

  describe('createServerLogger', () => {
    it('creates a logger with correct server category', () => {
      createServerLogger('room')
      expect(getLogger).toHaveBeenCalledWith(['simoba', 'server', 'room'])
    })

    it('creates loggers with different subsystems', () => {
      createServerLogger('system')
      expect(getLogger).toHaveBeenCalledWith(['simoba', 'server', 'system'])
    })
  })
})
