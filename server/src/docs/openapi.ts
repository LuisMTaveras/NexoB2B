import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'NexoB2B API',
    version: '1.0.0',
    description: `
## Plataforma SaaS B2B — Portal de Clientes Conectado al ERP

NexoB2B permite a empresas conectar su ERP mediante API y ofrecer un portal privado a sus clientes corporativos.

### Autenticación
Todos los endpoints protegidos requieren un **JWT Bearer Token**.
Obtén el token en \`POST /api/auth/login\`.

\`\`\`
Authorization: Bearer <token>
\`\`\`

### Multi-tenancy
Cada request es aislado por empresa (**company_id**) extraído del JWT.
Un usuario no puede acceder a datos de otra empresa.

### Paginación
Los endpoints de listado soportan:
- \`page\` (default: 1)
- \`limit\` (default: 50, max: 500)
- \`search\` para búsqueda de texto

### Formato de respuesta
\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 50 }
}
\`\`\`
    `,
    contact: { name: 'NexoB2B Support', email: 'soporte@nexob2b.com' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
    { url: 'https://api.nexob2b.com', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Unauthorized' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          taxId: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'CONFIGURING'] },
        },
      },
      Integration: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          companyId: { type: 'string' },
          name: { type: 'string' },
          baseUrl: { type: 'string' },
          authMethod: { type: 'string', enum: ['API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH', 'OAUTH2'] },
          isActive: { type: 'boolean' },
          lastSyncAt: { type: 'string', format: 'date-time', nullable: true },
          mappings: { type: 'array', items: { $ref: '#/components/schemas/IntegrationMapping' } },
        },
      },
      IntegrationMapping: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          resource: { type: 'string', enum: ['PRODUCTS', 'CUSTOMERS', 'PRICE_LISTS', 'PRICE_ASSIGNMENTS', 'INVOICES', 'RECEIVABLES', 'ORDERS'] },
          externalEndpoint: { type: 'string', example: '/api/products' },
          fieldMappings: {
            type: 'object',
            description: 'Mapa de campo interno → campo externo del ERP',
            example: { sku: 'codigo', name: 'descripcion', price: 'precio1' },
          },
          paginationConfig: {
            type: 'object',
            description: 'Configuración de paginación del endpoint externo',
            example: { type: 'page', pageParam: 'pagina', pageSizeParam: 'cantidad', pageSize: 100, dataPath: 'data.productos' },
          },
          queryParams: { type: 'object', nullable: true },
          isActive: { type: 'boolean' },
        },
      },
      SyncJob: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          integrationId: { type: 'string' },
          resource: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED'] },
          recordsTotal: { type: 'integer' },
          recordsOk: { type: 'integer' },
          recordsFailed: { type: 'integer' },
          startedAt: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          errorSummary: { type: 'string', nullable: true },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          internalCode: { type: 'string', description: 'Código único NexoB2B', example: 'PRD-202604-A1B2C3D4' },
          externalId: { type: 'string', description: 'Código del ERP del cliente' },
          sku: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string', nullable: true },
          brand: { type: 'string', nullable: true },
          unit: { type: 'string', nullable: true },
          isVisible: { type: 'boolean' },
          prices: { type: 'array', items: { $ref: '#/components/schemas/PriceSnapshot' } },
        },
      },
      PriceSnapshot: {
        type: 'object',
        properties: {
          priceListId: { type: 'string', example: 'LISTA_1' },
          price: { type: 'number', example: 1500.00 },
          currency: { type: 'string', example: 'DOP' },
          syncedAt: { type: 'string', format: 'date-time' },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          internalCode: { type: 'string', description: 'Código único NexoB2B', example: 'CLT-202604-X9Y8Z7W6' },
          externalId: { type: 'string', description: 'Código del ERP del cliente' },
          name: { type: 'string' },
          taxId: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          portalEnabled: { type: 'boolean' },
          priceListId: { type: 'string', nullable: true, description: 'Lista de precios asignada desde ERP' },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/api/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Health check',
        security: [],
        responses: {
          '200': {
            description: 'Sistema operativo',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, status: { type: 'string' }, timestamp: { type: 'string' } } } } },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar empresa',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['companyName', 'companySlug', 'firstName', 'lastName', 'email', 'password'],
                properties: {
                  companyName: { type: 'string', example: 'Distribuidora ABC SRL' },
                  companySlug: { type: 'string', example: 'distribuidora-abc', description: 'Solo minúsculas, números y guiones' },
                  firstName: { type: 'string', example: 'Juan' },
                  lastName: { type: 'string', example: 'Pérez' },
                  email: { type: 'string', format: 'email', example: 'juan@empresa.com' },
                  password: { type: 'string', minLength: 8, example: 'Admin1234!' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Empresa registrada exitosamente' },
          '409': { description: 'Slug ya en uso' },
          '422': { description: 'Error de validación' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@demo.com' },
                  password: { type: 'string', example: 'Admin1234!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login exitoso. Retorna accessToken y refreshToken.' },
          '401': { description: 'Credenciales inválidas' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Obtener usuario autenticado',
        responses: {
          '200': { description: 'Datos del usuario y empresa actual' },
          '401': { description: 'No autenticado' },
        },
      },
    },
    '/api/companies/me': {
      get: {
        tags: ['Empresa'],
        summary: 'Obtener perfil de empresa',
        responses: { '200': { description: 'Perfil completo con branding' } },
      },
      patch: {
        tags: ['Empresa'],
        summary: 'Actualizar perfil de empresa',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  taxId: { type: 'string' },
                  phone: { type: 'string' },
                  website: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Empresa actualizada' } },
      },
    },
    '/api/integrations': {
      get: {
        tags: ['Integraciones'],
        summary: 'Listar integraciones de la empresa',
        responses: { '200': { description: 'Lista de integraciones con sus mappings' } },
      },
      post: {
        tags: ['Integraciones'],
        summary: 'Crear nueva integración ERP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'baseUrl', 'authMethod'],
                properties: {
                  name: { type: 'string', example: 'ERP Contabilidad Pro' },
                  description: { type: 'string' },
                  baseUrl: { type: 'string', example: 'https://erp.miempresa.com' },
                  authMethod: { type: 'string', enum: ['API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH', 'OAUTH2'] },
                  credentials: {
                    type: 'object',
                    description: 'Varía según authMethod',
                    example: { apiKey: 'sk_live_xxxxx', headerName: 'X-API-Key' },
                  },
                  headers: { type: 'object', description: 'Headers adicionales fijos', example: { 'X-Company-ID': '123' } },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Integración creada' } },
      },
    },
    '/api/integrations/{id}': {
      get: {
        tags: ['Integraciones'],
        summary: 'Obtener integración por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detalle de integración con mappings y último job' } },
      },
      patch: {
        tags: ['Integraciones'],
        summary: 'Actualizar integración',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Integración actualizada' } },
      },
      delete: {
        tags: ['Integraciones'],
        summary: 'Eliminar integración',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Eliminada' } },
      },
    },
    '/api/integrations/{id}/test': {
      post: {
        tags: ['Integraciones'],
        summary: 'Probar conexión con el ERP',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Conexión exitosa' },
          '400': { description: 'Error de conexión con detalles del fallo' },
        },
      },
    },
    '/api/integrations/{id}/mappings': {
      get: {
        tags: ['Integraciones'],
        summary: 'Listar mappings de una integración',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Lista de mappings' } },
      },
      post: {
        tags: ['Integraciones'],
        summary: 'Crear mapping de recurso',
        description: `
Configura cómo extraer un recurso del ERP y mapear sus campos al modelo interno.

**paginationConfig** (opcional):
- \`type\`: "page" | "offset" | "cursor" | "none"
- \`pageParam\`: nombre del parámetro de página (e.g. "page", "pagina")
- \`pageSizeParam\`: nombre del parámetro de tamaño (e.g. "limit", "cantidad")
- \`pageSize\`: registros por página (default: 100)
- \`dataPath\`: ruta JSON donde está el array (e.g. "data.results", "response.items")
- \`totalPath\`: ruta JSON donde está el total (e.g. "meta.total")

**fieldMappings** — campo interno → campo en la respuesta del ERP:
- Para productos: sku, name, description, category, brand, unit, imageUrl
- Para clientes: externalId, name, taxId, email, phone, address, priceListId
- Para precios: priceListId, price, currency (puede ser campo fijo con "=LISTA_1")
        `,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resource', 'externalEndpoint', 'fieldMappings'],
                properties: {
                  resource: { type: 'string', enum: ['PRODUCTS', 'CUSTOMERS', 'PRICE_LISTS', 'PRICE_ASSIGNMENTS', 'INVOICES', 'RECEIVABLES', 'ORDERS'] },
                  externalEndpoint: { type: 'string', example: '/api/v1/products' },
                  fieldMappings: {
                    type: 'object',
                    example: { sku: 'codProducto', name: 'descripcion', category: 'familia', price: 'precio1', priceListId: '=LISTA_1' },
                  },
                  paginationConfig: {
                    type: 'object',
                    example: { type: 'page', pageParam: 'page', pageSizeParam: 'limit', pageSize: 100, dataPath: 'data', totalPath: 'meta.total' },
                  },
                  queryParams: { type: 'object', example: { activo: true } },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Mapping creado' } },
      },
    },
    '/api/integrations/{id}/sync': {
      post: {
        tags: ['Sincronización'],
        summary: 'Disparar sincronización',
        description: 'Inicia un sync job para uno o todos los recursos configurados. Soporta volúmenes masivos con paginación automática.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  resource: {
                    type: 'string',
                    enum: ['PRODUCTS', 'CUSTOMERS', 'PRICE_LISTS', 'PRICE_ASSIGNMENTS', 'INVOICES', 'RECEIVABLES', 'ORDERS', 'ALL'],
                    default: 'ALL',
                  },
                  fullSync: { type: 'boolean', default: false, description: 'Si true, no hace sync incremental — sincroniza todo' },
                },
              },
            },
          },
        },
        responses: {
          '202': { description: 'Sync iniciado. Retorna jobId(s) para seguimiento.' },
          '409': { description: 'Ya hay un sync en curso para esta integración' },
        },
      },
    },
    '/api/integrations/{id}/jobs': {
      get: {
        tags: ['Sincronización'],
        summary: 'Historial de sync jobs',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Lista de jobs con stats' } },
      },
    },
    '/api/integrations/{id}/jobs/{jobId}/logs': {
      get: {
        tags: ['Sincronización'],
        summary: 'Logs detallados de un sync job',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'level', in: 'query', schema: { type: 'string', enum: ['info', 'warn', 'error'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: { '200': { description: 'Logs del job filtrados' } },
      },
    },
    '/api/products': {
      get: {
        tags: ['Catálogo'],
        summary: 'Listar productos sincronizados',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'priceListId', in: 'query', schema: { type: 'string' }, description: 'Filtrar precios de esta lista' },
        ],
        responses: { '200': { description: 'Lista paginada de productos con precios' } },
      },
    },
    '/api/customers': {
      get: {
        tags: ['Clientes'],
        summary: 'Listar clientes sincronizados',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'portalEnabled', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { '200': { description: 'Lista paginada de clientes' } },
      },
    },
  },
};
