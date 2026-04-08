import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const integration = await prisma.integration.findFirst({
    where: { name: 'Dummy ERP (API Prueba)' }
  });

  if (!integration) {
    console.error('Integración no encontrada');
    return;
  }

  const mappings = await prisma.integrationMapping.findMany({
    where: { integrationId: integration.id }
  });

  for (const mapping of mappings) {
    const currentFields = mapping.fieldMappings as Record<string, string>;
    const updatedFields = {
      ...currentFields,
      externalId: 'id', // Mapear el ID de DummyJSON al externalId interno
      id: 'id'          // Fallback por si acaso
    };

    await prisma.integrationMapping.update({
      where: { id: mapping.id },
      data: { fieldMappings: updatedFields }
    });
    console.log(`Updated mapping for ${mapping.resource}`);
  }
}

main().finally(() => prisma.$disconnect());
