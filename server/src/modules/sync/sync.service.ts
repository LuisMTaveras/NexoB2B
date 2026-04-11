import pLimit from 'p-limit';
import { prisma } from '../../lib/prisma';
import { buildErpClient, resolvePath, PaginationConfig } from '../../lib/erpClient';
import { logger } from '../../lib/logger';
import { EmailService } from '../../lib/email.service';
import {
  generateProductCode,
  generateCustomerCode,
  generateOrderCode,
  generateInvoiceCode,
} from '../../lib/codeGenerator';
import { cache } from '../../lib/cache';


// Max concurrent DB writes per batch
const DB_CONCURRENCY = 10;

type SyncResource = 'PRODUCTS' | 'CUSTOMERS' | 'PRICE_LISTS' | 'PRICE_ASSIGNMENTS' |
                    'INVOICES' | 'RECEIVABLES' | 'ORDERS';

interface MappingConfig {
  id: string;
  resource: SyncResource;
  externalEndpoint: string;
  fieldMappings: Record<string, string>;    // internalField → externalField (or "=VALUE" for constants)
  paginationConfig: PaginationConfig | null;
  queryParams: Record<string, unknown> | null;
}

/**
 * Resolves a field value from a raw ERP record using field mapping.
 * Supports:
 *   - "fieldName"         → extract from record
 *   - "=CONSTANT"         → literal value
 *   - "parent.child"      → nested path
 *   - "__concat:a,b, "    → concat multiple fields with separator
 *   - "{{field1}} text"   → string template with values
 *   - "__eval: JS logic"  → advanced transformation via JavaScript
 */
function resolveField(record: Record<string, unknown>, externalField: string): unknown {
  if (!externalField) return undefined;

  // Constant value
  if (externalField.startsWith('=')) return externalField.slice(1);

  // Advanced Eval Script: "__eval: Number(record.price) * 1.18"
  if (externalField.startsWith('__eval:')) {
    const expression = externalField.slice(7).trim();
    try {
      const fn = new Function('record', `return (${expression});`);
      return fn(record);
    } catch (e) {
      logger.warn(`Failed to eval mapping logic: ${expression}`, { error: String(e) });
      return undefined;
    }
  }

  // String Template: "Hola {{user.name}} de {{company.city}}"
  if (externalField.includes('{{') && externalField.includes('}}')) {
    return externalField.replace(/{{([^}]+)}}/g, (_, path) => {
      const val = resolvePath(record, path.trim());
      return val !== undefined && val !== null ? String(val) : '';
    });
  }

  // Concat: "__concat:field1,field2, "
  if (externalField.startsWith('__concat:')) {
    const parts = externalField.slice(9).split(',');
    const fields = parts.slice(0, -1);
    const separator = parts[parts.length - 1] ?? ' ';
    return fields.map((f) => String(resolvePath(record, f.trim()) ?? '')).join(separator);
  }

  /**
   * Find in sub-array: "__find:listPath,searchField,searchValue,targetField"
   * Example: Get RNC from addresses array where type is 'BILLING'
   * "__find:ExtraData.Addresses,Type,BILLING,TaxID"
   */
  if (externalField.startsWith('__find:')) {
    const [path, searchField, searchValue, targetField] = externalField.slice(7).split(',');
    const list = resolvePath(record, path.trim());
    if (Array.isArray(list)) {
      const match = list.find(item => String(resolvePath(item, searchField.trim())) === searchValue.trim());
      return match ? resolvePath(match, targetField.trim()) : undefined;
    }
    return undefined;
  }

  return resolvePath(record, externalField);
}

function mapRecord(raw: Record<string, unknown>, fieldMappings: Record<string, string>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [internal, external] of Object.entries(fieldMappings)) {
    const val = resolveField(raw, external);
    if (val !== undefined && val !== null && val !== '') {
      mapped[internal] = val;
    }
  }
  return mapped;
}

// ─── Resource Upsert Functions ────────────────────────────────────

async function upsertProducts(
  companyId: string,
  jobId: string,
  records: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
): Promise<{ ok: number; failed: number }> {
  const limit = pLimit(DB_CONCURRENCY);
  let ok = 0, failed = 0;

  await Promise.all(
    records.map((raw) =>
      limit(async () => {
          const mapped = mapRecord(raw, fieldMappings);
          const externalId = String(mapped.externalId ?? mapped.id ?? '');
          if (!externalId) throw new Error('Missing externalId/id field');

          const sku = String(mapped.sku ?? externalId);
          const name = String(mapped.name ?? sku);

          // Check if already exists
          const existing = await prisma.product.findUnique({
            where: { companyId_sku: { companyId, sku } },
          });

          const data: any = {
            companyId,
            externalId,
            sku,
            name,
            description: mapped.description ? String(mapped.description) : null,
            category: mapped.category ? String(mapped.category) : null,
            brand: mapped.brand ? String(mapped.brand) : null,
            unit: mapped.unit ? String(mapped.unit) : null,
            imageUrl: mapped.imageUrl ? String(mapped.imageUrl) : null,
            stock: mapped.stock !== undefined ? Number(mapped.stock) : 0,
            isActive: mapped.isActive !== false,
            syncedAt: new Date(),
          };

          if (!existing) {
            data.internalCode = generateProductCode();
          }

          await prisma.product.upsert({
            where: { companyId_sku: { companyId, sku } },
            create: data,
            update: { ...data, internalCode: undefined }, // don't overwrite internalCode
          });

          // Upsert multiple prices if mapped (price1, price2, ..., price5)
          const productId = (await prisma.product.findUnique({ where: { companyId_sku: { companyId, sku } }, select: { id: true } }))!.id;
          
          const priceListsToSync: Array<{ priceListId: string; price: number }> = [];

          for (const [key, val] of Object.entries(mapped)) {
            if (/^(price|precio)\d+$/i.test(key) && val !== undefined) {
              const listNum = key.replace(/\D/g, '');
              priceListsToSync.push({ priceListId: `LISTA_${listNum}`, price: Number(val) });
            }
          }

          for (const { priceListId, price } of priceListsToSync) {
            if (isNaN(price)) continue;
            await prisma.productPriceSnapshot.upsert({
              where: { productId_priceListId: { productId, priceListId } },
              create: {
                productId,
                priceListId,
                price,
                currency: String(mapped.currency ?? 'DOP'),
                syncedAt: new Date(),
              },
              update: {
                price,
                currency: String(mapped.currency ?? 'DOP'),
                syncedAt: new Date(),
              },
            });
          }

          ok++;
      }),
    ),
  );

  return { ok, failed };
}

async function upsertCustomers(
  companyId: string,
  jobId: string,
  records: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
): Promise<{ ok: number; failed: number }> {
  const limit = pLimit(DB_CONCURRENCY);
  let ok = 0, failed = 0;

  await Promise.all(
    records.map((raw) =>
      limit(async () => {
          const mapped = mapRecord(raw, fieldMappings);
          const externalId = String(mapped.externalId ?? mapped.id ?? mapped.codigo ?? '');
          if (!externalId) throw new Error('Missing externalId field');

          const existing = await prisma.customer.findUnique({
            where: { companyId_externalId: { companyId, externalId } },
          });

          const data: any = {
            companyId,
            externalId,
            name: String(mapped.name ?? externalId),
            taxId: mapped.taxId ? String(mapped.taxId) : null,
            email: mapped.email ? String(mapped.email) : null,
            phone: mapped.phone ? String(mapped.phone) : null,
            address: mapped.address ? String(mapped.address) : null,
            status: 'ACTIVE',
            syncedAt: new Date(),
          };

          if (!existing) {
            data.internalCode = generateCustomerCode();
          }

          const customer = await prisma.customer.upsert({
            where: { companyId_externalId: { companyId, externalId } },
            create: data,
            update: { ...data, internalCode: undefined },
          });

          // Upsert price assignment if priceListId is mapped
          if (mapped.priceListId) {
            await prisma.customerPriceAssignment.upsert({
              where: { customerId: customer.id },
              create: {
                customerId: customer.id,
                priceListId: String(mapped.priceListId),
                source: 'erp',
                syncedAt: new Date(),
              },
              update: {
                priceListId: String(mapped.priceListId),
                syncedAt: new Date(),
              },
            });
          }

          ok++;
      }),
    ),
  );

  return { ok, failed };
}

async function upsertPriceLists(
  companyId: string,
  jobId: string,
  records: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
): Promise<{ ok: number; failed: number }> {
  // Price lists come as product+price rows: { sku, priceListId, price, currency }
  const limit = pLimit(DB_CONCURRENCY);
  let ok = 0, failed = 0;

  await Promise.all(
    records.map((raw) =>
      limit(async () => {
          const mapped = mapRecord(raw, fieldMappings);
          const sku = String(mapped.sku ?? mapped.externalId ?? '');
          if (!sku) throw new Error('Missing sku/externalId');

          const product = await prisma.product.findUnique({
            where: { companyId_sku: { companyId, sku } },
            select: { id: true },
          });
          if (!product) throw new Error(`Product not found for sku: ${sku}`);

          // Support multiple price lists in one record: price1→LISTA_1, price2→LISTA_2...
          const priceLists: Array<{ priceListId: string; price: number }> = [];

          if (mapped.priceListId && mapped.price !== undefined) {
            priceLists.push({ priceListId: String(mapped.priceListId), price: Number(mapped.price) });
          }

          // Auto-detect numeric price fields: price1, price2... or lista1, lista2...
          for (const [key, val] of Object.entries(mapped)) {
            if (/^(price|lista|precio)\d+$/i.test(key) && val !== undefined) {
              const listNum = key.replace(/\D/g, '');
              priceLists.push({ priceListId: `LISTA_${listNum}`, price: Number(val) });
            }
          }

          for (const { priceListId, price } of priceLists) {
            if (isNaN(price)) continue;
            await prisma.productPriceSnapshot.upsert({
              where: { productId_priceListId: { productId: product.id, priceListId } },
              create: { productId: product.id, priceListId, price, currency: String(mapped.currency ?? 'DOP'), syncedAt: new Date() },
              update: { price, currency: String(mapped.currency ?? 'DOP'), syncedAt: new Date() },
            });
          }

          ok++;
      }),
    ),
  );

  return { ok, failed };
}

async function upsertPriceAssignments(
  companyId: string,
  jobId: string,
  records: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
): Promise<{ ok: number; failed: number }> {
  const limit = pLimit(DB_CONCURRENCY);
  let ok = 0, failed = 0;

  await Promise.all(
    records.map((raw) =>
      limit(async () => {
          const mapped = mapRecord(raw, fieldMappings);
          const externalId = String(mapped.externalId ?? mapped.customerCode ?? '');
          const priceListId = String(mapped.priceListId ?? '');
          if (!externalId || !priceListId) throw new Error('Missing externalId or priceListId');

          const customer = await prisma.customer.findUnique({
            where: { companyId_externalId: { companyId, externalId } },
            select: { id: true },
          });
          if (!customer) throw new Error(`Customer not found: ${externalId}`);

          await prisma.customerPriceAssignment.upsert({
            where: { customerId: customer.id },
            create: { customerId: customer.id, priceListId, source: 'erp', syncedAt: new Date() },
            update: { priceListId, syncedAt: new Date() },
          });

          ok++;
      }),
    ),
  );

  return { ok, failed };
}

async function upsertInvoices(
  companyId: string,
  jobId: string,
  records: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
): Promise<{ ok: number; failed: number }> {
  const limit = pLimit(DB_CONCURRENCY);
  let ok = 0, failed = 0;

  await Promise.all(
    records.map((raw) =>
      limit(async () => {
          const mapped = mapRecord(raw, fieldMappings);
          const externalId = String(mapped.externalId ?? mapped.id ?? '');
          const customerExternalId = String(mapped.customerExternalId ?? mapped.customerId ?? '');
          if (!externalId || !customerExternalId) throw new Error('Missing externalId or customerExternalId');

          const customer = await prisma.customer.findUnique({
            where: { companyId_externalId: { companyId, externalId: customerExternalId } },
            select: { id: true },
          });
          if (!customer) throw new Error(`Customer not found: ${customerExternalId}`);

          const existing = await prisma.invoice.findUnique({ where: { companyId_externalId: { companyId, externalId } } });

          const data: any = {
            companyId,
            customerId: customer.id,
            externalId,
            number: String(mapped.number ?? externalId),
            date: new Date(String(mapped.date ?? new Date())),
            dueDate: mapped.dueDate ? new Date(String(mapped.dueDate)) : null,
            subtotal: Number(mapped.subtotal ?? mapped.total ?? 0),
            tax: Number(mapped.tax ?? 0),
            total: Number(mapped.total ?? 0),
            currency: String(mapped.currency ?? 'DOP'),
            status: String(mapped.status ?? 'PENDING'),
            syncedAt: new Date(),
          };

          if (!existing) data.internalCode = generateInvoiceCode();

          await prisma.invoice.upsert({
            where: { companyId_externalId: { companyId, externalId } },
            create: data,
            update: { ...data, internalCode: undefined },
          });

          ok++;
      }),
    ),
  );

  return { ok, failed };
}

async function upsertReceivables(
  companyId: string,
  jobId: string,
  records: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
): Promise<{ ok: number; failed: number }> {
  const limit = pLimit(DB_CONCURRENCY);
  let ok = 0, failed = 0;

  await Promise.all(
    records.map((raw) =>
      limit(async () => {
          const mapped = mapRecord(raw, fieldMappings);
          const externalId = String(mapped.externalId ?? mapped.id ?? '');
          const customerExternalId = String(mapped.customerExternalId ?? '');
          if (!externalId) throw new Error('Missing externalId');

          let customerId: string | undefined;
          if (customerExternalId) {
            const c = await prisma.customer.findUnique({
              where: { companyId_externalId: { companyId, externalId: customerExternalId } },
              select: { id: true },
            });
            customerId = c?.id;
          }
          if (!customerId) throw new Error(`Customer not found: ${customerExternalId}`);

          await prisma.accountReceivable.upsert({
            where: { companyId_externalId: { companyId, externalId } },
            create: {
              companyId, customerId, externalId,
              documentRef: mapped.documentRef ? String(mapped.documentRef) : null,
              amount: Number(mapped.amount ?? 0),
              balance: Number(mapped.balance ?? mapped.amount ?? 0),
              currency: String(mapped.currency ?? 'DOP'),
              dueDate: mapped.dueDate ? new Date(String(mapped.dueDate)) : null,
              syncedAt: new Date(),
            },
            update: {
              amount: Number(mapped.amount ?? 0),
              balance: Number(mapped.balance ?? 0),
              dueDate: mapped.dueDate ? new Date(String(mapped.dueDate)) : null,
              syncedAt: new Date(),
            },
          });

          ok++;
      }),
    ),
  );

  return { ok, failed };
}

async function upsertOrders(
  companyId: string,
  jobId: string,
  records: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
): Promise<{ ok: number; failed: number }> {
  const limit = pLimit(DB_CONCURRENCY);
  let ok = 0, failed = 0;

  await Promise.all(
    records.map((raw) =>
      limit(async () => {
          const mapped = mapRecord(raw, fieldMappings);
          const externalId = String(mapped.externalId ?? mapped.id ?? '');
          const customerExternalId = String(mapped.customerExternalId ?? '');
          if (!externalId) throw new Error('Missing externalId');

          const customer = await prisma.customer.findUnique({
            where: { companyId_externalId: { companyId, externalId: customerExternalId } },
            select: { id: true },
          });
          if (!customer) throw new Error(`Customer not found: ${customerExternalId}`);

          const existing = await prisma.order.findUnique({ where: { companyId_externalId: { companyId, externalId } } });

          const data: any = {
            companyId,
            customerId: customer.id,
            externalId,
            number: String(mapped.number ?? externalId),
            date: new Date(String(mapped.date ?? new Date())),
            status: String(mapped.status ?? 'OPEN'),
            total: Number(mapped.total ?? 0),
            currency: String(mapped.currency ?? 'DOP'),
            syncedAt: new Date(),
          };

          if (!existing) data.internalCode = generateOrderCode();

          const order = await prisma.order.upsert({
            where: { companyId_externalId: { companyId, externalId } },
            create: data,
            update: { ...data, internalCode: undefined },
          });

          // Upsert items if present
          const items = (mapped.items ?? raw.items ?? []) as Record<string, unknown>[];
          const itemMappings = fieldMappings.__items ? JSON.parse(String(fieldMappings.__items)) : null;

          if (Array.isArray(items) && items.length > 0) {
            // Delete old items and re-insert (orders items can change)
            await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
            await Promise.all(
              items.map((item) =>
                pLimit(5)(async () => {
                  const im = itemMappings ? mapRecord(item, itemMappings) : item;
                  const sku = String(im.sku ?? im.codigo ?? '');
                  const product = sku ? await prisma.product.findUnique({
                    where: { companyId_sku: { companyId, sku } }, select: { id: true },
                  }) : null;

                  await prisma.orderItem.create({
                    data: {
                      orderId: order.id,
                      productId: product?.id ?? null,
                      sku: sku || String(im.externalId ?? 'N/A'),
                      name: String(im.name ?? im.descripcion ?? sku),
                      quantity: Number(im.quantity ?? im.cantidad ?? 1),
                      unitPrice: Number(im.unitPrice ?? im.precio ?? 0),
                      total: Number(im.total ?? 0),
                    },
                  });
                }),
              ),
            );
          }

          ok++;
      }),
    ),
  );

  return { ok, failed };
}

// ─── Main Sync Function ───────────────────────────────────────────

const UPSERT_MAP: Record<SyncResource, Function> = {
  PRODUCTS: upsertProducts,
  CUSTOMERS: upsertCustomers,
  PRICE_LISTS: upsertPriceLists,
  PRICE_ASSIGNMENTS: upsertPriceAssignments,
  INVOICES: upsertInvoices,
  RECEIVABLES: upsertReceivables,
  ORDERS: upsertOrders,
};

export async function runSyncJob(
  integrationId: string,
  companyId: string,
  mapping: MappingConfig,
  existingJobId?: string,
): Promise<string> {
  let jobId: string;

  if (existingJobId) {
    jobId = existingJobId;
    // Update existing job to RUNNING
    await prisma.integrationSyncJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
  } else {
    // Create new job record
    const job = await prisma.integrationSyncJob.create({
      data: {
        integrationId,
        resource: mapping.resource,
        status: 'RUNNING',
        startedAt: new Date(),
        triggeredBy: 'manual',
      },
    });
    jobId = job.id;
  }

  // Run async (don't await — return jobId immediately)
  (async () => {
    let totalOk = 0, totalFailed = 0, totalFetched = 0;

    try {
      // Get integration for credentials
      const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
      if (!integration) throw new Error('Integration not found');

      const client = buildErpClient(
        integration.baseUrl,
        integration.authMethod as any,
        integration.credentials as any,
        (integration as any).headers,
      );

      const pagination: PaginationConfig = (mapping.paginationConfig as PaginationConfig) ?? { type: 'none' };
      const upsertFn = UPSERT_MAP[mapping.resource];

      await prisma.integrationSyncLog.create({
        data: { jobId, level: 'info', message: `Starting sync for ${mapping.resource} from ${mapping.externalEndpoint}` },
      });

      const { fetched } = await client.fetchAll({
        endpoint: mapping.externalEndpoint,
        pagination,
        queryParams: (mapping.queryParams as Record<string, unknown>) ?? {},
        onBatch: async (items, page) => {
          const records = items as Record<string, unknown>[];
          const { ok, failed } = await upsertFn(companyId, jobId, records, mapping.fieldMappings);
          totalOk += ok;
          totalFailed += failed;

          await prisma.integrationSyncLog.create({
            data: {
              jobId, level: 'info',
              message: `Page ${page}: processed ${records.length} records (${ok} ok, ${failed} failed)`,
            },
          });

          // Update progress
          await prisma.integrationSyncJob.update({
            where: { id: jobId },
            data: { recordsOk: totalOk, recordsFailed: totalFailed, recordsTotal: totalOk + totalFailed },
          });
        },
      });

      totalFetched = fetched;

      const status = totalFailed === 0 ? 'SUCCESS' : totalOk === 0 ? 'FAILED' : 'PARTIAL';
      await prisma.integrationSyncJob.update({
        where: { id: jobId },
        data: {
          status,
          completedAt: new Date(),
          recordsTotal: totalFetched,
          recordsOk: totalOk,
          recordsFailed: totalFailed,
          errorSummary: totalFailed > 0 ? `${totalFailed} records failed` : null,
        },
      });

      // Update integration lastSyncAt
      await prisma.integration.update({ where: { id: integrationId }, data: { lastSyncAt: new Date() } });

      // Invalidate catalog cache for this company
      if (['PRODUCTS', 'PRICE_LISTS', 'PRICE_ASSIGNMENTS', 'ALL'].includes(mapping.resource)) {
        await cache.clearPattern(`portal:catalog:${companyId}:*`);
      }

      await prisma.integrationSyncLog.create({
        data: {
          jobId, level: 'info',
          message: `Sync complete: ${totalOk} ok, ${totalFailed} failed out of ${totalFetched} total`,
        },
      });

      logger.info(`Sync completed`, { integrationId, resource: mapping.resource, totalOk, totalFailed });
    } catch (err: any) {
      logger.error('Sync job failed', { jobId, error: err.message });
      await prisma.integrationSyncJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', completedAt: new Date(), errorSummary: err.message },
      });
      await prisma.integrationSyncLog.create({
        data: { jobId, level: 'error', message: `Fatal error: ${err.message}` },
      });
      
      // Feature 2: Notifications System
      try {
        const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
        if (integration) {
          // Find an admin that has an email configuration set up to act as the sender
          const senderAdmin = await prisma.internalUser.findFirst({
            where: { companyId, role: { name: 'ADMIN' }, status: 'ACTIVE', emailConfig: { isNot: null } },
            select: { id: true }
          });

          if (senderAdmin) {
            const template = EmailService.getSyncFailureTemplate({
                integrationName: integration.name,
                resource: mapping.resource,
                errorSummary: err.message,
                jobId,
                time: new Date().toLocaleString()
            });

            // Get all active admins to receive the notification
            const allAdmins = await prisma.internalUser.findMany({
               where: { companyId, role: { name: 'ADMIN' }, status: 'ACTIVE' },
               select: { email: true }
            });

            for (const admin of allAdmins) {
               await EmailService.sendUserEmail(senderAdmin.id, {
                  to: admin.email,
                  subject: `⚠️ Alerta Crítica: Sincronización Fallida - ${integration.name}`,
                  html: template
               });
            }
          }
        }
      } catch (notifyErr: any) {
        logger.error('Failed to send sync failure notification', { error: notifyErr.message });
      }
    }
  })();

  return jobId;
}
