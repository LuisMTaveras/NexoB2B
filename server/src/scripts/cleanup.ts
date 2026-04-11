import { MaintenanceService } from '../modules/common/maintenance.service';
import { prisma } from '../lib/prisma';

async function main() {
  await MaintenanceService.cleanupLogs();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
