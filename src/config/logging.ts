import { configure, getConsoleSink } from '@logtape/logtape'

export async function setupClientLogging(): Promise<void> {
  await configure({
    sinks: {
      console: getConsoleSink(),
    },
    loggers: [
      {
        category: ['simoba', 'client'],
        lowestLevel: import.meta.env.DEV ? 'debug' : 'warning',
        sinks: ['console'],
      },
    ],
  })
}
