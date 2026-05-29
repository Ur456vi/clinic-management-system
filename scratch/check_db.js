const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany();
  console.log("All users count:", users.length);
  users.forEach(u => {
    console.log(`User: ID=${u.id}, Email=${u.email}, Role=${u.role}, IsActive=${u.isActive}`);
  });
}

main()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
