/**
 * Prisma client singleton.
 *
 * In dev, Next.js hot-reloads modules — without this singleton we'd create
 * a new PrismaClient on every reload, exhausting the Postgres connection pool.
 * In production, this just resolves to a normal `new PrismaClient()`.
 *
 * Usage:
 *   import { db } from "@/lib/db"
 *   const patients = await db.patient.findMany()
 */

import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

export type Db = typeof db
