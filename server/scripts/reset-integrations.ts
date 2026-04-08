import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando reinicio de datos de integración...');

  // El orden importa por las llaves foráneas aunque tengamos onDelete: Cascade en muchos casos
  // Borramos de abajo hacia arriba en la jerarquía de dependencias

  console.log('🗑️  Borrando logs y jobs de sincronización...');
  await prisma.integrationSyncLog.deleteMany();
  await prisma.integrationSyncJob.deleteMany();

  console.log('🗑️  Borrando mappings y configuraciones de integración...');
  await prisma.integrationMapping.deleteMany();
  await prisma.integration.deleteMany();

  console.log('🗑️  Borrando datos transaccionales sincronizados (Pedidos, Facturas)...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.accountReceivable.deleteMany();
  await prisma.invoice.deleteMany();

  console.log('🗑️  Borrando datos maestros sincronizados (Productos, Clientes)...');
  await prisma.customerPriceAssignment.deleteMany();
  await prisma.productPriceSnapshot.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerUser.deleteMany();
  await prisma.customer.deleteMany();

  console.log('🗑️  Borrando logs de auditoría...');
  await prisma.auditLog.deleteMany();

  console.log('✨ Reinicio completado exitosamente.');
  console.log('📝 Nota: Las empresas (Tenants) y los usuarios administrativos internos NO han sido eliminados.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el reinicio:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
