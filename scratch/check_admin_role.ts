import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  const admin = await prisma.internalUser.findUnique({
    where: { email: 'admin@demo.com' },
    include: { role: true }
  });
  console.log('User admin@demo.com:', JSON.stringify(admin, null, 2));

  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } }
  });
  console.log('All Roles:', JSON.stringify(roles, null, 2));
}

checkAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
