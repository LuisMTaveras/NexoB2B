import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Orders
  { code: 'orders:view', name: 'Ver Pedidos', module: 'ORDERS' },
  { code: 'orders:manage', name: 'Gestionar Pedidos', module: 'ORDERS' },
  { code: 'orders:print', name: 'Imprimir Pedidos', module: 'ORDERS' },
  { code: 'orders:export', name: 'Exportar Pedidos', module: 'ORDERS' },
  // Customers
  { code: 'customers:view', name: 'Ver Clientes', module: 'CUSTOMERS' },
  { code: 'customers:manage', name: 'Gestionar Clientes', module: 'CUSTOMERS' },
  // Products
  { code: 'products:view', name: 'Ver Productos', module: 'PRODUCTS' },
  { code: 'products:manage', name: 'Gestionar Productos', module: 'PRODUCTS' },
  // Integrations
  { code: 'integrations:view', name: 'Ver Integraciones', module: 'INTEGRATIONS' },
  { code: 'integrations:manage', name: 'Configurar Integraciones', module: 'INTEGRATIONS' },
  { code: 'integrations:sync', name: 'Ejecutar Sincronización', module: 'INTEGRATIONS' },
  // Invoices
  { code: 'invoices:view', name: 'Ver Facturas', module: 'INVOICES' },
  { code: 'invoices:export', name: 'Exportar Facturas', module: 'INVOICES' },
  { code: 'invoices:print', name: 'Imprimir Facturas', module: 'INVOICES' },
  // Team
  { code: 'team:view', name: 'Ver Equipo', module: 'TEAM' },
  { code: 'team:manage', name: 'Gestionar Empleados', module: 'TEAM' },
  { code: 'role:manage', name: 'Gestionar Roles y Permisos', module: 'TEAM' },
  // Settings
  { code: 'settings:view', name: 'Ver Configuración', module: 'SETTINGS' },
  { code: 'settings:manage', name: 'Editar Configuración Empresa', module: 'SETTINGS' },
];

async function main() {
  console.log('🚀 Starting RBAC Seed...');

  // 1. Create Permissions
  console.log('Creating permissions...');
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, module: p.module },
      create: p,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  console.log('Creating global system roles...');
  let adminRole = await prisma.role.findFirst({
    where: { companyId: null, name: 'ADMIN' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Acceso total al sistema (Super Admin)',
        isSystem: true,
        companyId: null,
      },
    });
  }

  // Assign ALL permissions to ADMIN role
  console.log('Assigning all permissions to ADMIN role...');
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }

  // 3. Create Default Secondary Roles (Global)
  let operatorRole = await prisma.role.findFirst({
    where: { companyId: null, name: 'OPERATOR' },
  });

  if (!operatorRole) {
    operatorRole = await prisma.role.create({
      data: {
        name: 'OPERATOR',
        description: 'Gestión operativa diaria',
        isSystem: true,
        companyId: null,
      },
    });
  }

  // Assign basic permissions to OPERATOR
  const opPerms = allPermissions.filter(p => 
    p.code.endsWith(':view') || p.code === 'orders:manage' || p.code === 'customers:manage'
  );
  for (const p of opPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: operatorRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: operatorRole.id, permissionId: p.id },
    });
  }

  // 4. Migration: Update existing users to have the ADMIN role
  console.log('Migrating existing users to ADMIN role...');
  const users = await prisma.internalUser.findMany({ where: { roleId: null } });
  for (const user of users) {
    await prisma.internalUser.update({
      where: { id: user.id },
      data: { roleId: adminRole.id },
    });
  }

  console.log(`✅ Seed finished. Migrated ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
