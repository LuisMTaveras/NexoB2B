import { PrismaClient, SyncResource, IntegrationAuthMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed de Integración DummyJSON iniciado...');

  // 1. Obtener la primera empresa disponible
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('❌ Error: No se encontró ninguna empresa en la base de datos.');
    return;
  }

  console.log(`🏢 Empresa detectada: ${company.name} (${company.id})`);

  // 2. Crear integración DummyJSON
  const integration = await prisma.integration.create({
    data: {
      companyId: company.id,
      name: 'Dummy ERP (API Prueba)',
      description: 'Conectividad con DummyJSON para pruebas de migración masiva.',
      authMethod: IntegrationAuthMethod.API_KEY,
      baseUrl: 'https://dummyjson.com',
      isActive: true,
      credentials: {
        apiKey: 'test-key-dummy',
        headerName: 'X-API-Key'
      },
      testEndpoint: '/test',
    }
  });

  console.log('✅ Integración creada.');

  // 3. Crear Mappings (Productos y Clientes)
  
  // Mapping de PRODUCTOS
  await prisma.integrationMapping.create({
    data: {
      integrationId: integration.id,
      resource: SyncResource.PRODUCTS,
      externalEndpoint: '/products',
      isActive: true,
      fieldMappings: {
        externalId: 'id',
        id: 'id',
        name: 'title',
        description: 'description',
        basePrice: 'price',
        sku: 'sku',
        imageUrl: 'thumbnail',
        category: 'category'
      },
      paginationConfig: {
        type: 'offset',
        offsetParam: 'skip',
        pageSizeParam: 'limit',
        pageSize: 30,
        dataPath: 'products',
        totalPath: 'total'
      }
    }
  });

  // Mapping de CLIENTES (DummyJSON Users)
  await prisma.integrationMapping.create({
    data: {
      integrationId: integration.id,
      resource: SyncResource.CUSTOMERS,
      externalEndpoint: '/users',
      isActive: true,
      fieldMappings: {
        externalId: 'id',
        id: 'id',
        name: 'firstName',
        email: 'email',
        taxId: 'username',
        phone: 'phone',
        address: 'address.address'
      },
      paginationConfig: {
        type: 'offset',
        offsetParam: 'skip',
        pageSizeParam: 'limit',
        pageSize: 30,
        dataPath: 'users',
        totalPath: 'total'
      }
    }
  });

  console.log('📊 Mappings configurados para PRODUCTOS y CLIENTES.');
  console.log('🚀 Configuración completada. Ya puedes ir al panel y hacer clic en [Sincronizar].');
}

main()
  .catch((e) => {
    console.error('❌ Error configurando integración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
