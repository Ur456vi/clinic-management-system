import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function main() {
  const APPOINTMENT_INCLUDE = {
    patient: {
      select: {
        id: true,
        patientNumber: true,
        fullName: true,
        sex: true,
        dateOfBirth: true,
        status: true,
        primaryDoctorId: true,
      },
    },
    staff: {
      select: {
        id: true,
        fullName: true,
        specialization: true,
        departmentId: true,
      },
    },
    department: {
      select: { id: true, name: true, slug: true },
    },
    createdBy: {
      select: { id: true, fullName: true },
    },
  } as const

  const rows = await db.appointment.findMany({
    take: 50,
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    include: APPOINTMENT_INCLUDE,
  })
  console.log("Rows:", rows.length)
}

main().catch(console.error).finally(() => db.$disconnect())
