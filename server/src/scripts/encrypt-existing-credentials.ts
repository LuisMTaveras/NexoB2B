import { PrismaClient } from '@prisma/client';
import { encrypt } from '../lib/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Starting credentials encryption migration...');
  
  const integrations = await prisma.integration.findMany();
  let migratedCount = 0;

  for (const integration of integrations) {
    const creds: any = integration.credentials;
    
    // Check if it's already encrypted
    if (creds && creds._encrypted) {
      console.log(`[SKIPPED] Integration "${integration.name}" is already encrypted.`);
      continue;
    }

    if (!creds || Object.keys(creds).length === 0) {
      console.log(`[SKIPPED] Integration "${integration.name}" has no credentials.`);
      continue;
    }

    console.log(`[MIGRATING] Encrypting credentials for "${integration.name}"...`);
    
    const encrypted = { _encrypted: encrypt(JSON.stringify(creds)) };

    await prisma.integration.update({
      where: { id: integration.id },
      data: { credentials: encrypted }
    });
    
    migratedCount++;
  }

  console.log(`\n✅ Migration finished. ${migratedCount} integrations updated.`);
}

main()
  .catch(e => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
