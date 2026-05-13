/**
 * Seed script — populates a fresh database with the minimum data needed for
 * local development.
 *
 * Real seed data is added in BE-09. This scaffold just verifies the Prisma
 * client + DATABASE_URL connection works.
 *
 * Run with: npm run prisma:seed
 */

import { db } from "../lib/db"

async function main() {
  // Connection sanity check — no models yet, just confirm we can reach the DB.
  await db.$queryRaw`SELECT 1`
  console.log("✓ Database connection OK")
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error("Seed failed:", e)
    await db.$disconnect()
    process.exit(1)
  })
