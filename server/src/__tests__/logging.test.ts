import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@logtape/logtape', () => ({
  configure: vi.fn(),
  getConsoleSink: vi.fn(() => 'console-sink'),
  getStreamSink: vi.fn(() => 'stream-sink'),
  getJsonLinesFormatter: vi.fn(() => 'json-formatter'),
}))

vi.mock('node:stream', () => ({
  default: {
    Writable: {
      toWeb: vi.fn(() => 'web-writable'),
    },
  },
}))

import { configure, getConsoleSink, getStreamSink, getJsonLinesFormatter } from '@logtape/logtape'
import { setupServerLogging } from '../config/logging.js'

describe('server/config/logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('configures JSON sink for production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    await setupServerLogging()

    expect(getJsonLinesFormatter).toHaveBeenCalledWith({ categorySeparator: '.' })
    expect(getStreamSink).toHaveBeenCalled()
    expect(configure).toHaveBeenCalledWith(
      expect.objectContaining({
        loggers: [
          expect.objectContaining({
            category: ['simoba', 'server'],
            lowestLevel: 'info',
            sinks: ['json'],
          }),
        ],
      })
    )
    // Console sink should NOT be created in production
    expect(getConsoleSink).not.toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })

  it('configures both JSON and console sinks for development', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    await setupServerLogging()

    expect(getStreamSink).toHaveBeenCalled()
    expect(getConsoleSink).toHaveBeenCalled()
    expect(configure).toHaveBeenCalledWith(
      expect.objectContaining({
        loggers: [
          expect.objectContaining({
            category: ['simoba', 'server'],
            lowestLevel: 'debug',
            sinks: ['json', 'console'],
          }),
        ],
      })
    )

    process.env.NODE_ENV = originalEnv
  })
})
