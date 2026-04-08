import api from '@/services/api'

export type AuthMethod = 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH2'
export type SyncResource = 'PRODUCTS' | 'CUSTOMERS' | 'PRICE_LISTS' | 'PRICE_ASSIGNMENTS' | 'INVOICES' | 'RECEIVABLES' | 'ORDERS'

export interface Integration {
  id: string
  name: string
  description?: string
  baseUrl: string
  authMethod: AuthMethod
  isActive: boolean
  lastSyncAt?: string
  mappings: IntegrationMapping[]
  syncJobs?: SyncJob[]
}

export interface IntegrationMapping {
  id: string
  resource: SyncResource
  externalEndpoint: string
  fieldMappings: Record<string, string>
  paginationConfig?: PaginationConfig
  queryParams?: Record<string, unknown>
  isActive: boolean
}

export interface PaginationConfig {
  type: 'page' | 'offset' | 'cursor' | 'none'
  pageParam?: string
  pageSizeParam?: string
  pageSize?: number
  dataPath?: string
  totalPath?: string
}

export interface SyncJob {
  id: string
  resource: SyncResource
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED'
  recordsTotal: number
  recordsOk: number
  recordsFailed: number
  startedAt?: string
  completedAt?: string
  errorSummary?: string
  createdAt: string
}

export const integrationsApi = {
  list: () => api.get<{ success: boolean; data: Integration[] }>('/integrations'),
  get: (id: string) => api.get<{ success: boolean; data: Integration }>(`/integrations/${id}`),
  create: (data: any) => api.post('/integrations', data),
  update: (id: string, data: any) => api.patch(`/integrations/${id}`, data),
  delete: (id: string) => api.delete(`/integrations/${id}`),
  test: (id: string, endpoint?: string) => api.post(`/integrations/${id}/test`, { endpoint }),
  createMapping: (id: string, data: any) => api.post(`/integrations/${id}/mappings`, data),
  updateMapping: (id: string, mappingId: string, data: any) => api.patch(`/integrations/${id}/mappings/${mappingId}`, data),
  deleteMapping: (id: string, mappingId: string) => api.delete(`/integrations/${id}/mappings/${mappingId}`),
  sync: (id: string, resource = 'ALL') => api.post(`/integrations/${id}/sync`, { resource }),
  jobs: (id: string, params?: any) => api.get(`/integrations/${id}/jobs`, { params }),
  jobLogs: (id: string, jobId: string, params?: any) => api.get(`/integrations/${id}/jobs/${jobId}/logs`, { params }),
  getQueueStatus: () => api.get<{ success: boolean; data: any }>('/integrations/queue/status'),
}

export const RESOURCE_LABELS: Record<SyncResource, string> = {
  PRODUCTS: 'Productos',
  CUSTOMERS: 'Clientes',
  PRICE_LISTS: 'Listas de Precios',
  PRICE_ASSIGNMENTS: 'Asignación de Precios',
  INVOICES: 'Facturas',
  RECEIVABLES: 'Cuentas por Cobrar',
  ORDERS: 'Pedidos',
}

export const RESOURCE_ICONS: Record<SyncResource, string> = {
  PRODUCTS: 'mdi:package-variant-closed',
  CUSTOMERS: 'mdi:account-group-outline',
  PRICE_LISTS: 'mdi:tag-multiple-outline',
  PRICE_ASSIGNMENTS: 'mdi:tag-arrow-right-outline',
  INVOICES: 'mdi:file-document-outline',
  RECEIVABLES: 'mdi:cash-clock',
  ORDERS: 'mdi:shopping-outline',
}

export const DEFAULT_FIELD_MAPPINGS: Record<SyncResource, Record<string, string>> = {
  PRODUCTS: { sku: 'codigo', name: 'descripcion', description: 'detalle', category: 'familia', brand: 'marca', unit: 'unidad', imageUrl: 'imagen', externalId: 'codigo', priceListId: '=LISTA_1', price: 'precio1' },
  CUSTOMERS: { externalId: 'codigo', name: 'nombre', taxId: 'rnc', email: 'correo', phone: 'telefono', address: 'direccion', priceListId: 'lista_precio' },
  PRICE_LISTS: { sku: 'codigo', priceListId: '=LISTA_1', price: 'precio', currency: '=DOP' },
  PRICE_ASSIGNMENTS: { externalId: 'codigoCliente', priceListId: 'lista' },
  INVOICES: { externalId: 'numero', customerExternalId: 'codigoCliente', number: 'numero', date: 'fecha', dueDate: 'vencimiento', total: 'total', subtotal: 'subtotal', tax: 'itbis', status: 'estado' },
  RECEIVABLES: { externalId: 'id', customerExternalId: 'codigoCliente', documentRef: 'documento', amount: 'monto', balance: 'saldo', dueDate: 'vencimiento' },
  ORDERS: { externalId: 'numero', customerExternalId: 'codigoCliente', number: 'numero', date: 'fecha', status: 'estado', total: 'total' },
}
