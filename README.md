# NexoB2B: Corporate Integration Ecosystem 🚀

NexoB2B es una plataforma SaaS de grado industrial diseñada para unificar y estandarizar la cadena de suministro digital entre empresas. Construida con una estética **Liquid Frost Corporate**, ofrece una experiencia inmersiva que combina robustez técnica con una interfaz ultra-moderna.

---

## ✨ Características Premium

### 🔄 Hardened Sync Engine (Motor de Sincronización)
Nuestro motor de sincronización ha sido diseñado para la resiliencia absoluta:
- **Resiliencia de Red**: Implementación de **Exponential Backoff Retries** vía `axios-retry` para garantizar que ninguna fluctuación de red detenga la operación.
- **Arquitectura Asíncrona**: Procesamiento en segundo plano con estados en tiempo real (Pending, Running, Success, Failed).
- **Mapeo Dinámico**: Transformación de datos flexible que soporta rutas anidadas, constantes y concatenaciones complejas.
- **Control de Concurrencia**: Gestión optimizada de escrituras en base de datos para evitar bloqueos y asegurar integridad.

### 🎨 Diseño "Liquid Frost"
Una interfaz que no solo es funcional, sino visualmente impactante:
- **Efectos Glassmorphism**: Tarjetas con desenfoque de fondo y bordes de cristal inmaculados.
- **Micro-Animaciones**: Feedback visual dinámico (shake en errores, success-pop en éxitos, spin en procesos).
- **UX Guiada**: Nuevo **Integration Wizard** que simplifica la configuración de ERPs complejos en pasos lógicos.
- **Tipografía Moderna**: Uso de familias tipográficas optimizadas para legibilidad de datos financieros.

### 🤝 Colaboración B2B & Onboarding
Gestión integral de la relación con el cliente desde una única interfaz:
- **Invitaciones Seguras**: Flujo de invitación con tokens de un solo uso y expiración de 24 horas.
- **Onboarding Guiado**: Portal público dedicado para que los clientes activen sus cuentas y definan sus credenciales de forma autónoma.
- **Gestión de Usuarios**: Control granular de acceso para representantes de clientes.

### 📧 Centro de Notificaciones SMTP
Libertad total para gestionar las comunicaciones salientes:
- **BYO SMTP (Bring Your Own SMTP)**: Configuración personalizada por usuario para Gmail, Outlook o servidores corporativos.
- **Cifrado de Credenciales**: Almacenamiento seguro de llaves SMTP mediante cifrado simétrico AES-256.
- **Estandarización de Marca**: Plantillas de correo "Sober Corporate" pre-diseñadas para una comunicación profesional.

### 📈 Operation Analytics
Visibilidad total sobre la integridad de los datos:
- **Sync Health Monitoring**: Indicadores en tiempo real de la tasa de éxito de las sincronizaciones.
- **Métricas de Volumen**: Gráficas de volumen diario para identificar patrones de tráfico y carga en el ERP.
- **Acceso Rápido**: Accesos directos optimizados desde el dashboard a funciones críticas de gestión.

### 📚 Documentación de API Nativa

---

## 🛠️ Stack Tecnológico

El proyecto utiliza una arquitectura de Monorepo gestionada por `npm workspaces`.

- **Frontend**: Vue 3 (Composition API), Tailwind CSS v4, Pinia, Chart.js.
- **Backend**: Node.js, Express, TypeScript, Zod.
- **Data Layer**: PostgreSQL + Prisma ORM.
- **Infraestructura**: JWT Authentication, Winston Logger, Axios-Retry.

---

## 🚀 Instalación y Despliegue

1. **Dependencias**:
   ```bash
   npm install
   ```

2. **Base de Datos**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

3. **Entorno de Desarrollo**:
   ```bash
   npm run dev
   ```

Acceso: [http://localhost:5173](http://localhost:5173)  
API Docs: [http://localhost:3000/docs](http://localhost:3000/docs)

---

## 🔑 Credenciales Demo (Dev)
- **Usuario**: `admin@demo.com`
- **Contraseña**: `Admin1234!`

---

*Diseñado para el futuro del B2B. Optimizado para la excelencia operativa.*

