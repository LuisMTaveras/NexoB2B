# NexoB2B Platform 🚀

NexoB2B es una plataforma corporativa robusta diseñada para estandarizar las interacciones comerciales entre empresas (B2B). Cuenta con una arquitectura escalable lista para conectar clientes, proveedores e inventario sincronizado mediante ERPs, todo bajo un diseño premium inmaculado denominado **Liquid Frost Corporate**.

---

## 🛠️ Stack Tecnológico

El proyecto se sustenta bajo una arquitectura de **Monorepo** usando `npm workspaces`, aislando de manera limpia y estricta el Backend del Frontend, pero unificados por Typescript.

**Frontend (`/client`)**:
- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Herramienta de Construcción:** Vite (Alta velocidad)
- **Estilos:** Tailwind CSS v4 (Moderno y nativo)
- **Diseño UI:** Componentes corporativos *custom*, fondos *glassmorphism* reactivos y gráficos generativos mediante `vue-chartjs`.
- **Manejo de Estado:** Pinia (Gestión reactiva global)
- **Iconografía:** Unplugin Icons / Iconify (Colección inmensa de Material Design).

**Backend (`/server`)**:
- **Plataforma:** Node.js con Express
- **Lenguaje:** TypeScript estricto
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma (Migraciones seguras y tipado estricto)
- **Autenticación:** JWT Seguro HTTP y Hasheo nativo usando `bcrypt`.
- **Validaciones:** Zod (Esquemas unificados para todo payload).
- **Documentación API:** `@scalar/express-api-reference` en endpoints embebidos.

---

## 💻 Requisitos del Sistema
- **Node.js**: v20 o superior.
- **Base de Datos**: PostgreSQL disponible.

## 🚀 Guía de Instalación y Arranque

1. **Clonar e Instalar Dependencias**
El monorepo centraliza las dependencias. Bastará con correr la instalación principal en la raíz:
```bash
git clone https://github.com/LuisMTaveras/NexoB2B.git
cd NexoB2B
npm install
```

2. **Configuración de Variables de Entorno**
Copia el archivo de ejemplo a un archivo `.env` tanto en la raíz como en `/server` (Prisma y el servidor lo requerirán):
```bash
cp .env.example .env
cp .env.example server/.env
```
Asegura que `DATABASE_URL` y `JWT_SECRET` tengan valores válidos.

3. **Migrar la Base de Datos e Inyectar Datos Iniciales**
Desde la raíz del proyecto, usa los comandos centralizados para preparar tu base de datos PostgreSQL:
```bash
# Ejecutar migraciones
npm run db:migrate

# Inyectar datos iniciales (Seed)
npm run db:seed
```

4. **Arrancar Entorno de Desarrollo**
Puedes lanzar ambos servicios (Frontend y Backend) en paralelo con un solo comando desde la raíz:
```bash
npm run dev
```
O si prefieres lanzarlos por separado:
- **API**: `npm run dev:server`
- **Frontend**: `npm run dev:client`

¡Todo estará en línea! 
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Docs (Scalar)**: [http://localhost:3000/docs](http://localhost:3000/docs)

---

## 🔑 Credenciales de Acceso (Entorno Dev)
El proceso de *seeding* crea una empresa demostrativa y un administrador inicial:
- **URL**: `http://localhost:5173/login`
- **Usuario**: `admin@demo.com`
- **Password**: `Admin1234!`

## 📊 Visualización de Datos (Prisma Studio)
Para explorar y editar los datos de manera visual, puedes levantar Prisma Studio:
```bash
npm run db:studio
```
Estará disponible en [http://localhost:5555](http://localhost:5555).

---

## 🛡️ Estilo Arquitectónico y Diseño (*Corporate Liquid Frost*)
El software rompe paradigmas simplistas para incorporar fondos dinámicos (`slowLiquid`), tarjetas acristaladas con `backdrop-blur`, e ingresos flotantes que inyectan una sofisticación técnica extrema, preservando la inmutabilidad de la información contable. El texto estático no es seleccionable para garantizar el tacto a una **Software-App Profesional nativa**.

*Desarrollado y consolidado orgánicamente usando agentes automatizados y arquitectura dirigida.*
