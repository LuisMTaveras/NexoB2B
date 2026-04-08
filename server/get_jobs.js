require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const jobs = await prisma.integrationSyncJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(jobs, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
