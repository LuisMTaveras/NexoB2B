# NexoB2B — Project Governance (Root)

This file contains the mandatory guidelines for any AI agent working on the NexoB2B project.

## Project Vision
NexoB2B is a premium SaaS platform for B2B Customer Portals, directly integrated with ERP systems. It focuses on real-time pricing, inventory, and order management.

## Project Layout
- `/client`: Vue 3 + Vite Frontend.
- `/server`: Express + TypeScript Backend + Worker.
- `/prisma`: Data storage and schema definitions.

## Command Glossary
- `npm run dev`: Starts all services (Client, Server, Worker).
- `npx prisma migrate dev`: Applies database schema changes.
- `npx prisma db seed`: Resets/populates development data.
- `npx prisma studio`: Visual database explorer.

## 🔴 THE POST-CHANGE PROTOCOL (Mandatory)
Every time you add, modify, or update a file, you MUST follow these steps:

1. **Verify Compilation**: Run `tsc` (backend) or check the Vite console (frontend) to ensure no syntax or type errors.
2. **Handle Scoping**: Ensure all variables (`existingMapping`, `data`, etc.) are correctly scoped and defined before use. Avoid `ReferenceError`.
3. **Audit Mutations**: If you modify data (POST, PATCH, DELETE), ensure a `logAction` call is included to maintain the audit trail.
4. **Resiliency**: Wrap background tasks (email, scheduler, workers) in `try/catch` blocks so they don't crash the main user request.
5. **Mandatory Restart**: After any significant change or at the end of each instruction, **restart the projects** (`npm run dev`) to ensure a clean state and proper compilation.
6. **Update Status**: If a feature is completed, update `PROJECT_STATUS.md`.

## Quality Standards
- **Aesthetics**: UI must be premium (Tailwind, animations, no generic colors).
- **Security**: Always check `req.companyId` to prevent cross-tenant data leaks.
- **Accuracy**: Data must reflect the ERP state (use `erpClient`).
