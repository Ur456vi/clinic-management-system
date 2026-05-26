const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({
    include: { patient: true, staff: true }
  });
  console.log("=== USERS ===");
  users.forEach(u => {
    console.log(`User: ID=${u.id}, Email=${u.email}, Role=${u.role}, HasPatient=${!!u.patient}, HasStaff=${!!u.staff}`);
  });

  const patients = await db.patient.findMany({
    include: { user: true }
  });
  console.log("\n=== PATIENTS ===");
  patients.forEach(p => {
    console.log(`Patient: ID=${p.id}, Number=${p.patientNumber}, Email=${p.email}, Name=${p.fullName}, HasUser=${!!p.user}`);
  });
}

main()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
