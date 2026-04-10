const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const mappings = await prisma.integrationMapping.findMany({
    include: { integration: { select: { name: true, baseUrl: true } } }
  });
  console.log(JSON.stringify(mappings, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
