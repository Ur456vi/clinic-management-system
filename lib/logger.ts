/**
 * Structured logger for the Vyara API (BE-10).
 *
 * Wraps `pino` with project-wide defaults:
 *   - JSON output in production (machine-readable for shipping to a log
 *     aggregator); pretty-printed locally for human eyes.
 *   - Level driven by `LOG_LEVEL` (defaults to `info`).
 *   - Base fields include `service: "vyara-api"` so logs are attributable
 *     once we have more than one service in the stack.
 *
 * Usage:
 *
 *   import { logger, childLogger } from "@/lib/logger"
 *
 *   logger.info({ userId }, "user signed in")
 *
 *   // Inside a request scope — bind the request id so every line is
 *   // correlatable:
 *   const log = childLogger(requestId)
 *   log.warn({ patientId }, "patient lookup empty")
 *
 * Route handlers should prefer the request-scoped logger from
 * `defineHandler()` (which already binds `requestId` for you).
 */

import pino, { type Logger, type LoggerOptions } from "pino"

const isProd = process.env.NODE_ENV === "production"
const level = process.env.LOG_LEVEL ?? "info"

const baseOptions: LoggerOptions = {
  level,
  base: { service: "vyara-api" },
  // ISO timestamps make logs greppable across machines and tools.
  timestamp: pino.stdTimeFunctions.isoTime,
}

const devOptions: LoggerOptions = {
  ...baseOptions,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss.l",
      ignore: "pid,hostname",
      singleLine: false,
    },
  },
}

/**
 * Root logger. Prefer `childLogger(requestId)` inside a request scope so the
 * request id is attached to every line.
 */
export const logger: Logger = pino(isProd ? baseOptions : devOptions)

/**
 * Returns a child logger bound with `{ requestId }`. Call once per request,
 * usually from `defineHandler`. Cheap — pino child loggers share the parent's
 * transport.
 */
export function childLogger(requestId: string): Logger {
  return logger.child({ requestId })
}
