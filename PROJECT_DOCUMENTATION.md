# NexoB2B - Plataforma de Colaboración Empresarial

NexoB2B es una plataforma SaaS diseñada para digitalizar la relación comercial entre empresas mayoristas y sus clientes B2B. A través de una arquitectura moderna, permite la gestión de pedidos, sincronización con sistemas ERP y un control granular de accesos.

## 🚀 Tecnologías Implementadas

### Backend (Core)
- **Node.js + Express**: Servidor robusto en TypeScript.
- **Prisma ORM**: Modelado y gestión de base de datos SQL.
- **PostgreSQL**: Motor de base de datos relacional para alta integridad.
- **JWT + Bcrypt**: Autenticación segura y encriptación de identidades.
- **Nodemailer**: Motor de notificaciones transaccionales vía SMTP.

### Frontend (Portal)
- **Vue 3 (Composition API)**: Framework reactivo y modular.
- **Vite**: Herramienta de construcción ultra rápida.
- **Tailwind CSS**: Diseño UI/UX premium personalizado ("Liquid Frost").
- **Pinia**: Gestión de estado global (Auth, Carrito, Config).
- **Iconify**: Set de iconos universales.
- **Chart.js**: Visualización de métricas y analíticas.

---

## 🛠️ Funcionalidades Actuales

### 1. Sistema de Control de Acceso (RBAC)
- **Roles Granulares**: Soporte para roles de sistema (`ADMIN`, `OPERATOR`) y roles personalizados por empresa.
- **Gestión de Permisos**: Más de 20 permisos atómicos que controlan desde la visibilidad de menús hasta acciones críticas (ej. `orders:manage`, `team:view`).
- **Navegación Selectiva**: La interfaz se adapta dinámicamente según los permisos del usuario logueado.
- **Guardias de Seguridad**: Validación estricta en rutas de backend y frontend.

### 2. Gestión de Equipo e Invitaciones
- **Flujo de Onboarding**: Invitación de nuevos miembros vía email con tokens de seguridad temporales.
- **Configuración de Contraseña**: Interfaz dedicada para que los invitados activen su cuenta de forma segura.
- **Invitación Manual**: Posibilidad de copiar enlaces de configuración si el servidor SMTP no está disponible. Ahora, al invitar a alguien, si el correo falla, el sistema te entrega el enlace para enviarlo por WhatsApp u otro medio.
- **Logs de Auditoría**: Registro de todas las acciones críticas (creación de usuarios, cambios de roles).

### 3. Capa de Integración Universal (ERP)
- **Sincronización Asíncrona**: Motor que procesa la sincronización de Clientes, Productos, Precios e Inventarios en segundo plano.
- **Dashboard de Integración**: Monitorización en tiempo real de los trabajos de sincronización (`RUNNING`, `SUCCESS`, `FAILED`).
- **Mapeo de Datos**: Capacidad de conectar campos personalizados del ERP con el esquema de NexoB2B.

### 4. Catálogo B2B y Precios Dinámicos
- **Multi-Nivel de Precios**: Soporte para hasta 5 listas de precios diferentes por producto.
- **Asignación por Cliente**: Cada cliente ve automáticamente los precios asignados a su cuenta corporativa.
- **Inventario en Tiempo Real**: Visualización de stock disponible directamente desde el catálogo.

### 5. Portal de Clientes
- **Panel de Autogestión**: Los clientes mayoristas pueden realizar pedidos, ver su historial y descargar facturas.
- **Carrito de Compras B2B**: Optimizado para pedidos de alto volumen y revisión rápida.
- **Estatus de Pedidos**: Seguimiento en tiempo real desde `PENDING` hasta `DELIVERED`.

---

## 📂 Estructura del Proyecto

### `/server` (Backend)
- `src/modules/auth`: Lógica de autenticación, invitaciones y recuperación.
- `src/modules/roles`: Definiciones de permisos y gestión de roles.
- `src/modules/integrations`: Conectores y lógica de sincronización ERP.
- `src/modules/company-users`: Administración de empleados de la empresa.
- `src/lib`: Servicios transversales (Email, Prisma, Crypto, Logger).

### `/client` (Frontend)
- `src/modules/auth`: Vistas de Login, Registro y Activación.
- `src/modules/settings`: Configuración técnica, de equipo y empresa.
- `src/modules/integrations`: Vistas de monitorización de sync.
- `src/stores`: Almacenes de Pinia para estado reactivo.
- `src/components/layout`: Diseños de Administrador y Portal de Cliente.

---

## 📋 Próximos Pasos en el Roadmap
1. [ ] **Pasarelas de Pago**: Integración con Azul, Cardnet y Stripe para cobros automáticos.
2. [ ] **Facturación Electrónica**: Generación de documentos fiscales directos.
3. [ ] **App Móvil**: Acceso nativo para toma de pedidos en campo.
4. [ ] **IA Predictiva**: Análisis de tendencias de compra para sugerencias de pedidos.
