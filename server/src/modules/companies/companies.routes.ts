import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNotFound } from '../../utils/apiResponse';
import { authenticate, requireInternalUser } from '../../middleware/auth';
import { getScopedPrisma } from '../../lib/prisma';
import { z } from 'zod';

const router = Router();

// All routes require authenticated internal user
router.use(authenticate, requireInternalUser);

// GET /api/companies/me - get own company
router.get('/me', asyncHandler(async (req, res) => {
  const db = getScopedPrisma(req.companyId!);
  const company = await db.company.findFirst({
    include: { branding: true },
  });
  if (!company) return sendNotFound(res, 'Company not found');
  return sendSuccess(res, company);
}));

// PATCH /api/companies/me - update company profile
const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
});

router.patch('/me', asyncHandler(async (req, res) => {
  const data = updateCompanySchema.parse(req.body);
  const { prisma } = await import('../../lib/prisma');
  const company = await prisma.company.update({
    where: { id: req.companyId! },
    data,
  });
  return sendSuccess(res, company, 'Company updated');
}));

// PATCH /api/companies/me/branding
const brandingSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  portalTitle: z.string().optional(),
});

router.patch('/me/branding', asyncHandler(async (req, res) => {
  const data = brandingSchema.parse(req.body);
  const { prisma } = await import('../../lib/prisma');
  const branding = await prisma.companyBranding.upsert({
    where: { companyId: req.companyId! },
    create: { companyId: req.companyId!, ...data },
    update: data,
  });
  return sendSuccess(res, branding, 'Branding updated');
}));

export default router;
