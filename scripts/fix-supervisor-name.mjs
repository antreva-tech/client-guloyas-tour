/**
 * One-time fix: Update "Felix Rodriguez" to "Felix Santos"
 * in Sale.supervisor and User.supervisorName.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FROM = "Felix Rodriguez";
const TO = "Felix Santos";

async function main() {
  const salesResult = await prisma.sale.updateMany({
    where: { supervisor: FROM },
    data: { supervisor: TO },
  });
  const usersResult = await prisma.user.updateMany({
    where: { supervisorName: FROM },
    data: { supervisorName: TO },
  });
  console.log(`Updated ${salesResult.count} sale(s), ${usersResult.count} user(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
