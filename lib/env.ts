/**
 * Runtime environment validation.
 *
 * Reads `process.env` once at startup, validates required vars are present
 * and well-shaped, and exports a typed `env` object. Importing this module
 * fails fast in production if anything is missing or malformed.
 *
 * Usage:
 *   import { env } from "@/lib/env"
 *   const url = env.DATABASE_URL
 *
 * Categories follow .env.example. Add new vars here when you add them there.
 */

type EnvShape = {
  // Application
  NEXT_PUBLIC_APP_URL: string
  APP_URL: string
  NODE_ENV: "development" | "test" | "production"

  // Database
  DATABASE_URL: string

  // Auth
  NEXTAUTH_SECRET: string
  NEXTAUTH_URL: string
  OTP_TTL_SECONDS: number
  OTP_LENGTH: number

  // Email
  RESEND_API_KEY: string | undefined
  EMAIL_FROM: string

  // WhatsApp (all optional — feature can be off)
  WHATSAPP_PHONE_NUMBER_ID: string | undefined
  WHATSAPP_ACCESS_TOKEN: string | undefined
  WHATSAPP_BUSINESS_ACCOUNT_ID: string | undefined
  WHATSAPP_VERIFY_TOKEN: string | undefined

  // Storage (optional in dev, required for lab uploads)
  S3_ENDPOINT: string | undefined
  S3_REGION: string
  S3_BUCKET: string
  S3_ACCESS_KEY_ID: string | undefined
  S3_SECRET_ACCESS_KEY: string | undefined
  S3_PUBLIC_URL: string | undefined

  // Payments
  RAZORPAY_KEY_ID: string | undefined
  RAZORPAY_KEY_SECRET: string | undefined
  RAZORPAY_WEBHOOK_SECRET: string | undefined

  // Encryption
  DATA_ENCRYPTION_KEY: string | undefined

  // Observability
  LOG_LEVEL: "trace" | "debug" | "info" | "warn" | "error"
  SENTRY_DSN: string | undefined

  // Feature flags
  FEATURE_PATIENT_PORTAL: boolean
}

class EnvError extends Error {
  constructor(messages: string[]) {
    super(
      `Invalid environment configuration:\n  - ${messages.join("\n  - ")}\n\nSee .env.example for the expected shape.`,
    )
    this.name = "EnvError"
  }
}

const errors: string[] = []

function required(name: string): string {
  const v = process.env[name]
  if (!v || v.trim() === "") {
    errors.push(`${name} is required`)
    return ""
  }
  return v
}

function optional(name: string, fallback?: string): string | undefined {
  const v = process.env[name]
  if (!v || v.trim() === "") return fallback
  return v
}

function intOpt(name: string, fallback: number): number {
  const v = process.env[name]
  if (!v) return fallback
  const n = Number(v)
  if (!Number.isFinite(n)) {
    errors.push(`${name} must be a number, got ${v}`)
    return fallback
  }
  return n
}

function boolOpt(name: string, fallback: boolean): boolean {
  const v = process.env[name]
  if (v === undefined) return fallback
  return v.toLowerCase() === "true" || v === "1"
}

function oneOf<T extends string>(
  name: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const v = process.env[name] ?? fallback
  if (!allowed.includes(v as T)) {
    errors.push(`${name} must be one of [${allowed.join(", ")}], got ${v}`)
    return fallback
  }
  return v as T
}

const nodeEnv = oneOf(
  "NODE_ENV",
  ["development", "test", "production"] as const,
  "development",
)

const env: EnvShape = {
  NEXT_PUBLIC_APP_URL: required("NEXT_PUBLIC_APP_URL"),
  APP_URL: optional("APP_URL", process.env.NEXT_PUBLIC_APP_URL ?? "")!,
  NODE_ENV: nodeEnv,

  DATABASE_URL: required("DATABASE_URL"),

  NEXTAUTH_SECRET: required("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: optional("NEXTAUTH_URL", process.env.NEXT_PUBLIC_APP_URL ?? "")!,
  OTP_TTL_SECONDS: intOpt("OTP_TTL_SECONDS", 300),
  OTP_LENGTH: intOpt("OTP_LENGTH", 5),

  RESEND_API_KEY: optional("RESEND_API_KEY"),
  EMAIL_FROM: optional("EMAIL_FROM", "Vyara <no-reply@vyara.local>")!,

  WHATSAPP_PHONE_NUMBER_ID: optional("WHATSAPP_PHONE_NUMBER_ID"),
  WHATSAPP_ACCESS_TOKEN: optional("WHATSAPP_ACCESS_TOKEN"),
  WHATSAPP_BUSINESS_ACCOUNT_ID: optional("WHATSAPP_BUSINESS_ACCOUNT_ID"),
  WHATSAPP_VERIFY_TOKEN: optional("WHATSAPP_VERIFY_TOKEN"),

  S3_ENDPOINT: optional("S3_ENDPOINT"),
  S3_REGION: optional("S3_REGION", "auto")!,
  S3_BUCKET: optional("S3_BUCKET", "vyara-uploads")!,
  S3_ACCESS_KEY_ID: optional("S3_ACCESS_KEY_ID"),
  S3_SECRET_ACCESS_KEY: optional("S3_SECRET_ACCESS_KEY"),
  S3_PUBLIC_URL: optional("S3_PUBLIC_URL"),

  RAZORPAY_KEY_ID: optional("RAZORPAY_KEY_ID"),
  RAZORPAY_KEY_SECRET: optional("RAZORPAY_KEY_SECRET"),
  RAZORPAY_WEBHOOK_SECRET: optional("RAZORPAY_WEBHOOK_SECRET"),

  DATA_ENCRYPTION_KEY: optional("DATA_ENCRYPTION_KEY"),

  LOG_LEVEL: oneOf(
    "LOG_LEVEL",
    ["trace", "debug", "info", "warn", "error"] as const,
    "info",
  ),
  SENTRY_DSN: optional("SENTRY_DSN"),

  FEATURE_PATIENT_PORTAL: boolOpt("FEATURE_PATIENT_PORTAL", false),
}

// In production, hard-fail on any missing required var.
// In dev/test, warn so devs can still boot the app without optional integrations.
if (errors.length > 0) {
  if (nodeEnv === "production") {
    throw new EnvError(errors)
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[env] ${errors.length} issue(s):\n  - ${errors.join("\n  - ")}`)
  }
}

export { env }
export type { EnvShape }
