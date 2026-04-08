import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Admin1234!', 12);

  // Demo company
  const company = await prisma.company.upsert({
    where: { slug: 'demo-empresa' },
    update: {},
    create: {
      name: 'Demo Empresa SRL',
      slug: 'demo-empresa',
      taxId: '102-12345-6',
      status: 'ACTIVE',
      branding: {
        create: {
          primaryColor: '#0F172A',
          secondaryColor: '#3B82F6',
          portalTitle: 'Portal Demo',
        },
      },
      internalUsers: {
        create: {
          firstName: 'Admin',
          lastName: 'Demo',
          email: 'admin@demo.com',
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      },
    },
  });

  console.log(`✅ Company created: ${company.name} (slug: ${company.slug})`);
  console.log('✅ Admin user: admin@demo.com / Admin1234!');
  console.log('🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
