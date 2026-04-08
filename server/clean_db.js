require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Borrando logs...');
  await prisma.integrationSyncLog.deleteMany({});
  
  console.log('Borrando trabajos de sincronización...');
  await prisma.integrationSyncJob.deleteMany({});
  
  console.log('Borrando clientes para repetir la sincronización...');
  await prisma.customer.deleteMany({});
  
  // Opcionalmente borrar también productos para limpiar de todo
  // await prisma.product.deleteMany({});
  
  console.log('¡Base de datos limpia!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
