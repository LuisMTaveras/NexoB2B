import { Router } from 'express';
import { authenticate, requireCustomerUser } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendNotFound } from '../../utils/apiResponse';
import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Apply auth to all portal routes
router.use(authenticate);
router.use(requireCustomerUser);

/**
 * GET /api/portal/me
 * Returns current customer user profile and their company/customer context
 */
router.get('/me', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    include: {
      customer: {
        include: {
          company: {
            include: { branding: true }
          },
          priceAssignment: true
        }
      }
    }
  });

  if (!customerUser) return sendNotFound(res, 'Customer user not found');
  return sendSuccess(res, customerUser);
}));

/**
 * GET /api/portal/dashboard
 * Summary of stats for the customer portal
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true }
  });

  if (!customerUser) return sendNotFound(res);

  const customerId = customerUser.customerId;
  const companyId = req.companyId!;

  // 1. Pending Balance (from AccountReceivable)
  const receivables = await prisma.accountReceivable.findMany({
    where: { customerId, companyId }
  });
  const balance = receivables.reduce((sum, r) => sum.add(r.balance), new Decimal(0));

  // 2. Active Orders
  const orderCount = await prisma.order.count({
    where: { customerId, companyId, status: { in: ['OPEN', 'CONFIRMED', 'SHIPPED'] } }
  });

  // 3. Recent Invoices
  const recentInvoices = await prisma.invoice.findMany({
    where: { customerId, companyId },
    orderBy: { date: 'desc' },
    take: 5
  });

  return sendSuccess(res, {
    balance,
    orderCount,
    recentInvoices
  });
}));

/**
 * GET /api/portal/catalog
 * Catalog with per-customer pricing
 */
router.get('/catalog', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    include: {
      customer: {
        include: { priceAssignment: true }
      }
    }
  });

  if (!customerUser) return sendNotFound(res);

  const companyId = req.companyId!;
  const assignedPriceList = customerUser.customer.priceAssignment?.priceListId || 'LISTA_1';

  // Fetch all active products with all their prices
  const products = await prisma.product.findMany({
    where: { companyId, isActive: true, isVisible: true },
    include: {
      priceSnapshots: true
    }
  });

  // Map products to include their specific price with fallback logic
  const catalog = products.map(p => {
    // 1. Try to find the price for the assigned list
    let priceInfo = p.priceSnapshots.find(s => s.priceListId === assignedPriceList);
    
    // 2. If not found and assigned list is not LISTA_1, fallback to LISTA_1
    if (!priceInfo && assignedPriceList !== 'LISTA_1') {
      priceInfo = p.priceSnapshots.find(s => s.priceListId === 'LISTA_1');
    }

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      category: p.category,
      brand: p.brand,
      unit: p.unit,
      stock: p.stock,
      price: priceInfo?.price || 0,
      currency: priceInfo?.currency || 'DOP'
    };
  });

  return sendSuccess(res, catalog);
}));

/**
 * GET /api/portal/invoices
 * Detailed list of invoices for the customer
 */
router.get('/invoices', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true }
  });

  if (!customerUser) return sendNotFound(res);

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customerUser.customerId, companyId: req.companyId! },
    orderBy: { date: 'desc' }
  });

  return sendSuccess(res, invoices);
}));

export default router;
