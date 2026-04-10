require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- Verificación de Base de Datos ---');
  
  // 1. Roles
  const rolesCount = await prisma.role.count();
  console.log('Total roles:', rolesCount);
  if (rolesCount > 0) {
    const roles = await prisma.role.findMany({ select: { name: true, isSystem: true, companyId: true } });
    console.log('Roles:', roles);
  }

  // 2. Users (Internal)
  const usersCount = await prisma.internalUser.count();
  console.log('Total Internal Users:', usersCount);
  if (usersCount > 0) {
    const users = await prisma.internalUser.findMany({ 
      select: { email: true, status: true, role: { select: { name: true } } } 
    });
    console.log('Users:', users);
  }

  // 3. Pending Invitations
  const tokens = await prisma.verificationToken.count({ where: { type: 'INVITATION' } });
  console.log('Total Pending Invitations:', tokens);
  if (tokens > 0) {
    const results = await prisma.verificationToken.findMany({
      where: { type: 'INVITATION' },
      include: { internalUser: { select: { email: true } } }
    });
    console.log('Invitation details:', results.map(t => ({ email: t.internalUser?.email, expiresAt: t.expiresAt })));
  }

  await prisma.$disconnect();
}

run().catch(err => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
