import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const result = await prisma.customerUser.updateMany({
    where: { role: 'BUYER' },
    data: { requiresApproval: true }
  });
  console.log('Updated Buyers:', result.count);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
