const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const staff = await db.staff.findMany({
    include: { user: true }
  });
  console.log("All staff count:", staff.length);
  staff.forEach(s => {
    console.log(`Staff: ID=${s.id}, Name=${s.fullName}, Role=${s.user.role}, IsActive=${s.isActive}, UserActive=${s.user.isActive}`);
  });

  const patients = await db.patient.findMany({
    take: 5
  });
  console.log("Patients count:", patients.length);
  patients.forEach(p => {
    console.log(`Patient: ID=${p.id}, Number=${p.patientNumber}, Email=${p.email}, Name=${p.fullName}`);
  });
}

main()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
