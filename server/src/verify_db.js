require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- Verificación de Base de Datos ---');
  
  // 1. Verificar columnas en IntegrationMapping
  const columns = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'IntegrationMapping' 
    AND column_name IN ('isScheduled', 'syncCron', 'syncInterval', 'nextRunAt');
  `);
  console.log('Columnas encontradas en IntegrationMapping:', columns);

  // 2. Verificar esquemas en la DB
  const schemas = await prisma.$queryRawUnsafe(`
    SELECT schema_name FROM information_schema.schemata;
  `);
  console.log('Esquemas detectados:', schemas.map(s => s.schema_name).filter(s => !s.startsWith('pg_')));

  // 3. Verificar tablas de pgboss
  const pgbossTables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'pgboss';
  `);
  console.log('Tablas de pg-boss (pgboss schema):', pgbossTables.map(t => t.table_name));

  await prisma.$disconnect();
}

run().catch(err => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
