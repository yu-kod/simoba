import {
  type Sink,
  configure,
  getConsoleSink,
  getStreamSink,
  getJsonLinesFormatter,
} from '@logtape/logtape'
import stream from 'node:stream'

export async function setupServerLogging(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production'
  const sinks: Record<string, Sink> = {}
  const sinkNames: string[] = []

  // JSON sink → stdout (always active, CloudWatch Logs Insights compatible)
  sinks.json = getStreamSink(
    stream.Writable.toWeb(process.stdout),
    { formatter: getJsonLinesFormatter({ categorySeparator: '.' }) },
  )
  sinkNames.push('json')

  // Console sink (dev only, human-readable)
  if (!isProduction) {
    sinks.console = getConsoleSink()
    sinkNames.push('console')
  }

  await configure({
    sinks,
    loggers: [
      {
        category: ['simoba', 'server'],
        lowestLevel: isProduction ? 'info' : 'debug',
        sinks: sinkNames,
      },
    ],
  })
}
