/**
 * Barrel export for the API helpers. Route handlers should import from here:
 *
 *   import {
 *     defineHandler,
 *     requireSession,
 *     requireRole,
 *     ok,
 *     created,
 *     noContent,
 *     paginated,
 *     parsePagination,
 *     NotFoundError,
 *   } from "@/lib/api"
 */

export {
  ok,
  created,
  noContent,
  paginated,
  type ApiEnvelope,
  type PaginatedEnvelope,
  type PaginationCursor,
} from "./response"

export {
  errorResponse,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  type ApiErrorBody,
  type ApiErrorCode,
} from "./errors"

export {
  defineHandler,
  type HandlerContext,
  type RouteHandler,
} from "./handler"

export { requireSession, requireRole, type Session } from "./auth"

export {
  parsePagination,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type PaginationInput,
} from "./pagination"
