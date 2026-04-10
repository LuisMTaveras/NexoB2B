# NexoB2B — Backend & Worker Governance (Server)

Guidelines for any AI agent working on the NexoB2B Server project.

## Tech Stack
- **Framework**: Express with TypeScript.
- **ORM**: Prisma (PostgreSQL).
- **Background Tasks**: PgBoss (v12) for sync jobs and scheduling.
- **Worker**: Integrated worker in `server/src/worker.ts`.

## 🟡 POST-CHANGE PROTOCOL (Server)
1. **No ReferenceError Loop**: Always define `const existingMapping = ...` before using it in `logAction`. Avoid naming collisions.
2. **Audit Mandatory**: Every POST, PATCH, or DELETE route must call `await logAction(...)`.
3. **Response Standard**: Use `sendCreated`, `sendSuccess`, `sendError`, and `sendNotFound` from `@/utils/apiResponse`.
4. **Resiliency**: Background logic (PgBoss, Emails) should be inside `try/catch` and NOT crash the API response.
5. **Mandatory Restart**: After any significant change or at the end of each instruction, **restart the projects** (`npm run dev`) to ensure a clean state and proper compilation.
6. **Context Check**: Always filter queries by `companyId` from `req.companyId`.

## API Structure
- Routes are in `server/src/modules`.
- Core logic is in `.routes.ts` or separated into `.service.ts` for complex operations.
- Shared libraries are in `server/src/lib` (logger, prisma, queue, etc.).
- Custom utils are in `server/src/utils`.

## Error Handling
- Use `asyncHandler` wrap for all route handlers.
- Errors are automatically logged by `errorHandler` middleware.
- Don't expose database-level error messages to the frontend.
