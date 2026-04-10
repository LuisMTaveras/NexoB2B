# NexoB2B — Data Layer Governance (Prisma)

Guidelines for any AI agent working on the NexoB2B Prisma layer.

## Tech Stack
- **Database**: PostgreSQL (nexob2b_dev).
- **Migration Engine**: Prisma Migrate.
- **Worker Store**: PgBoss (v12) tables are handled by `pg-boss` and it's recommended to NOT delete them manually.

## 🔵 POST-CHANGE PROTOCOL (Prisma)
1. **Always Check Schema**: Check `prisma/schema.prisma` before asuming any field exists.
2. **Migrations**: For schema changes, run `npx prisma migrate dev --name <description>`.
3. **Data Protection**: DO NOT drop data without a backup script.
4. **Resiliency**: Ensure new models have `createdAt` and `updatedAt`.
5. **Relationships**: Use `onDelete: Cascade` where appropriate (e.g., mappings of an integration).
6. **Mandatory Restart**: After any significant change or at the end of each instruction, **restart the projects** (`npm run dev`) to ensure a clean state and proper compilation.

## Core Models
- **Company**: Tenant isolation.
- **Integration**: ERP connectors.
- **IntegrationMapping**: Syncrecycle resource logic.
- **IntegrationSyncJob**: Persistent history of job status.
- **IntegrationSyncLog**: Detailed record of item sync.

## Scoped Client
Use `getScopedPrisma(companyId)` in `server/src/lib/prisma.ts` for automatic tenant isolation in common queries.
