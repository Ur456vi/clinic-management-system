/**
 * API error envelope + central error mapper.
 *
 * Every Route Handler should let exceptions bubble up to `defineHandler()`,
 * which routes them through `errorResponse()`. The result is always:
 *
 *   { "error": { "code": "<CODE>", "message": "<human-readable>", "details"?: ... } }
 *
 * The `AppError` family below is the canonical way for app code to signal
 * an HTTP-level failure. Other recognised throws:
 *   - ZodError                                 -> 400 VALIDATION_ERROR
 *   - Prisma P2025 (record not found)          -> 404 NOT_FOUND
 *   - Prisma P2002 (unique constraint)         -> 409 CONFLICT
 *   - anything else                            -> 500 INTERNAL_ERROR (logged)
 *
 * When `lib/errors.ts` lands (BE-04) it can re-export `AppError` from here,
 * or this module can be flipped to import from there — either way the wire
 * shape stays stable.
 */

import { NextResponse } from "next/server"

// ---------------------------------------------------------------------------
// Error codes — keep in sync with docs/api-conventions.md
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

// ---------------------------------------------------------------------------
// AppError hierarchy
// ---------------------------------------------------------------------------

/**
 * Base class for any error that maps cleanly to an HTTP response.
 *
 * Throw a subclass from anywhere in a request lifecycle and `defineHandler()`
 * will render the right envelope.
 */
export class AppError extends Error {
  readonly statusCode: number
  readonly code: ApiErrorCode
  readonly details?: unknown

  constructor(
    message: string,
    opts: { statusCode: number; code: ApiErrorCode; details?: unknown },
  ) {
    super(message)
    this.name = "AppError"
    this.statusCode = opts.statusCode
    this.code = opts.code
    this.details = opts.details
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, { statusCode: 400, code: "VALIDATION_ERROR", details })
    this.name = "ValidationError"
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, { statusCode: 401, code: "UNAUTHORIZED" })
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource") {
    super(message, { statusCode: 403, code: "FORBIDDEN" })
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, { statusCode: 404, code: "NOT_FOUND" })
    this.name = "NotFoundError"
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", details?: unknown) {
    super(message, { statusCode: 409, code: "CONFLICT", details })
    this.name = "ConflictError"
  }
}

// ---------------------------------------------------------------------------
// Type guards — done structurally so this file doesn't have to import zod or
// prisma directly. That keeps the helper light and avoids forcing both deps
// on the edge runtime.
// ---------------------------------------------------------------------------

type ZodIssue = { path: (string | number)[]; message: string; code?: string }

function isZodError(
  err: unknown,
): err is { name: "ZodError"; issues: ZodIssue[]; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "ZodError" &&
    Array.isArray((err as { issues?: unknown }).issues)
  )
}

function isPrismaKnownRequestError(
  err: unknown,
): err is { code: string; meta?: Record<string, unknown>; message: string } {
  if (typeof err !== "object" || err === null) return false
  const c = (err as { code?: unknown }).code
  // Prisma constructor name; checking the prefix is enough.
  const name = (err as { constructor?: { name?: string }; name?: string })
    .constructor?.name
  return (
    typeof c === "string" &&
    c.startsWith("P") &&
    (name === "PrismaClientKnownRequestError" ||
      (err as { name?: string }).name === "PrismaClientKnownRequestError")
  )
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function buildBody(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): ApiErrorBody {
  const body: ApiErrorBody = { error: { code, message } }
  if (details !== undefined) body.error.details = details
  return body
}

/**
 * Convert any thrown value into a `NextResponse` carrying the error envelope.
 *
 * Unknown errors are logged with `console.error` (so the request-id-tagged
 * line emitted by `defineHandler` has a stack trace nearby) and surfaced
 * as a generic 500 — never leak internal messages to clients.
 */
export function errorResponse(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof AppError) {
    return NextResponse.json<ApiErrorBody>(
      buildBody(err.code, err.message, err.details),
      { status: err.statusCode },
    )
  }

  if (isZodError(err)) {
    return NextResponse.json<ApiErrorBody>(
      buildBody("VALIDATION_ERROR", "Request validation failed", err.issues),
      { status: 400 },
    )
  }

  if (isPrismaKnownRequestError(err)) {
    if (err.code === "P2025") {
      return NextResponse.json<ApiErrorBody>(
        buildBody("NOT_FOUND", "Resource not found"),
        { status: 404 },
      )
    }
    if (err.code === "P2002") {
      const target = err.meta?.target
      return NextResponse.json<ApiErrorBody>(
        buildBody(
          "CONFLICT",
          "Unique constraint violated",
          target ? { target } : undefined,
        ),
        { status: 409 },
      )
    }
  }

  // eslint-disable-next-line no-console
  console.error("[api] unhandled error:", err)
  return NextResponse.json<ApiErrorBody>(
    buildBody("INTERNAL_ERROR", "Unexpected error"),
    { status: 500 },
  )
}
