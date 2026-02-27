import { getLogger, type Logger } from '@logtape/logtape'

const ROOT_CATEGORY = 'simoba'

export function createClientLogger(subsystem: string): Logger {
  return getLogger([ROOT_CATEGORY, 'client', subsystem])
}

export function createServerLogger(subsystem: string): Logger {
  return getLogger([ROOT_CATEGORY, 'server', subsystem])
}
