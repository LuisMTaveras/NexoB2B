# NexoB2B — Integrations Module + API Docs

## Módulos
- [x] Infraestructura base
- [x] Dependencias: Scalar, Axios, Nanoid, p-limit
- [x] OpenAPI spec + Scalar endpoint (Servicio en /docs brindado por app.ts)
- [x] Generador de códigos únicos
- [x] ERP HTTP Client (Soporta API Key, Bearer, Basic, OAuth2)
- [x] Sync Engine (Paginación, concurrencia p-limit, logs por registro)
- [x] CRUD Integraciones (Create, Test, Update, Delete)
- [x] CRUD Field Mappings por recurso
- [x] Sync Jobs (Trigger, Status Polling, Logs)
- [x] Endpoints: products, customers, price-lists, price-assignments
- [x] Frontend: IntegrationsView funcional con Wizard paso a paso
- [x] Frontend: SyncLogsView (Modal de logs integrado)

## Próximos Pasos Sugeridos
- [x] **Robustez de Red**: Implementar lógica de re-intento (Retry) con exponential backoff en `ErpClient.ts`.
- [x] **Wizard de Configuración**: Transformar el modal de creación en un wizard paso a paso para mejorar el UX.
- [ ] **Dashboard Analytics**: Gráficas de volumen de sincronización y tasa de éxito por recurso.
- [ ] **Webhooks**: Soporte para que el ERP notifique cambios en tiempo real.
- [ ] **Mapeos Avanzados**: Transformaciones de datos más complejas vía scripts o filtros pre-definidos.
- [ ] **Notificaciones**: Sistema de alertas (Email/Browser) cuando una sincronización crítica falle.
