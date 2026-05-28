import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const patientEmail = "priya.patient@example.com"
  const demoPassword = "Demo@123"

  // 1. Check if patient exists
  const patient = await db.patient.findFirst({
    where: { email: patientEmail }
  })

  if (!patient) {
    console.error(`Patient ${patientEmail} not found. Please run regular seed first.`)
    return
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(demoPassword, 10)

  // 3. Upsert User
  const user = await db.user.upsert({
    where: { email: patientEmail },
    update: {
      passwordHash,
      role: "PATIENT",
      isActive: true,
    },
    create: {
      email: patientEmail,
      passwordHash,
      role: "PATIENT",
      isActive: true,
    }
  })

  // 4. Link User to Patient
  await db.patient.update({
    where: { id: patient.id },
    data: { userId: user.id }
  })

  console.log(`Successfully seeded PATIENT user for ${patientEmail}`)
  console.log(`You can now log in with ${patientEmail} / ${demoPassword}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
