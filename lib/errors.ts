/**
 * Shared error classes used across the API surface.
 *
 * These are plain Error subclasses with a `statusCode` field so that a single
 * top-level error handler (in route handlers / middleware) can map them to
 * HTTP responses without `instanceof` ladders everywhere.
 *
 * Usage:
 *   import { UnauthorizedError } from "@/lib/errors"
 *   throw new UnauthorizedError("Sign in required")
 */

export class AppError extends Error {
  /** HTTP status code that should be returned for this error. */
  public readonly statusCode: number
  /** Stable machine-readable code. Useful for clients. */
  public readonly code: string

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
    this.code = code
    // Preserve V8 stack frames when available.
    if (typeof (Error as unknown as { captureStackTrace?: unknown }).captureStackTrace === "function") {
      ;(Error as unknown as {
        captureStackTrace: (target: object, ctor?: unknown) => void
      }).captureStackTrace(this, new.target)
    }
  }
}

/** 401 — caller is not authenticated. */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED")
  }
}

/** 403 — caller is authenticated but lacks permission. */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN")
  }
}

/** 404 — entity does not exist (or caller may not see it). */
export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND")
  }
}

/** 422 — request was well-formed but failed business / schema validation. */
export class ValidationError extends AppError {
  /** Optional field-level details, e.g. from Zod issues. */
  public readonly details?: unknown

  constructor(message = "Validation failed", details?: unknown) {
    super(message, 422, "VALIDATION_FAILED")
    this.details = details
  }
}
