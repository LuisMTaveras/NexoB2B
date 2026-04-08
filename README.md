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

2. **Configuración de Variables de Entorno**.
Crea y ajusta tus archivos `.env`. 
Dentro de `/server/.env` asegura la cadena de conexión de Prisma:
```env
DATABASE_URL="postgresql://USUARIO:PASSWORD@localhost:5432/nexob2b?schema=public"
JWT_SECRET="alguna-clave-secreta-extremadamente-segura"
```

3. **Migrar la Base de Datos e Inyectar Datos Iniciales**
Prisma construirá la base de datos y cargará los primeros usuarios administrativos de arranque:
```bash
cd server
npx prisma migrate dev
npx prisma db seed
cd ..
```

4. **Arrancar Entorno de Desarrollo**
Usa los comandos de los workspaces de NPM para levantar los servidores en paralelo:
```bash
# Terminal 1: Servidor Node (API)
npm run dev -w server

# Terminal 2: Servidor Vite (Frontend)
npm run dev -w client
```

¡Todo estará en línea! El Front-end típicamente responderá en `http://localhost:5173`.

---

## 🛡️ Estilo Arquitectónico y Diseño (*Corporate Liquid Frost*)
El software rompe paradigmas simplistas para incorporar fondos dinámicos (`slowLiquid`), tarjetas acristaladas con `backdrop-blur`, e ingresos flotantes que inyectan una sofisticación técnica extrema, preservando la inmutabilidad de la información contable. El texto estático no es seleccionable para garantizar el tacto a una **Software-App Profesional nativa**.

*Desarrollado y consolidado orgánicamente usando agentes automatizados y arquitectura dirigida.*
