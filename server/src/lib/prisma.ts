import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Returns a Prisma client scoped to a specific company (tenant).
 * Uses Prisma Extensions to automatically inject companyId filters.
 */
export function getScopedPrisma(companyId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }: any) {
          args.where = { ...args.where, companyId };
          return query(args);
        },
        async findFirst({ args, query }: any) {
          args.where = { ...args.where, companyId };
          return query(args);
        },
        async findUnique({ args, query }: any) {
          args.where = { ...args.where, companyId };
          return query(args);
        },
        async count({ args, query }: any) {
          args.where = { ...args.where, companyId };
          return query(args);
        },
      },
    },
  });
}

export default prisma;
