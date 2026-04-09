import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNotFound } from '../../utils/apiResponse';
import { authenticate, requireInternalUser } from '../../middleware/auth';
import { getScopedPrisma } from '../../lib/prisma';
import { z } from 'zod';

const router = Router();

// PUBLIC ROUTES (No Auth needed for logo visibility in emails)
router.get('/logo/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { prisma } = await import('../../lib/prisma');
  
  const company = await prisma.company.findUnique({
    where: { id },
    select: { logo: true }
  });

  if (!company?.logo) {
    return res.status(404).send('Logo not found');
  }

  // Handle Base64
  if (company.logo.startsWith('data:')) {
    const [header, base64Data] = company.logo.split(',');
    const contentType = header.match(/:(.*?);/)?.[1] || 'image/png';
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
    return res.send(imageBuffer);
  }

  // If it's already a URL, redirect or proxy (unlikely in current schema but safe)
  return res.redirect(company.logo);
}));

// Protected routes require authenticated internal user
router.use(authenticate, requireInternalUser);

// GET /api/companies/me - get own company
router.get('/me', asyncHandler(async (req, res) => {
  const { prisma } = await import('../../lib/prisma');
  const company = await prisma.company.findUnique({
    where: { id: req.companyId! },
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
  website: z.string().url().or(z.string().length(0)).optional().nullable(),
  address: z.string().optional(),
  logo: z.string().optional(), // Can be Base64
  corporateEmail: z.string().email().optional(),
  socialLinks: z.record(z.string()).optional(),
});

router.patch('/me', asyncHandler(async (req, res) => {
  const data = updateCompanySchema.parse(req.body);
  const { prisma } = await import('../../lib/prisma');
  
  const company = await prisma.company.update({
    where: { id: req.companyId! },
    data: {
      ...data,
      website: data.website === "" ? null : data.website,
    },
  });
  
  return sendSuccess(res, company, 'Perfil de empresa actualizado');
}));

// PATCH /api/companies/me/branding
const brandingSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().optional(), // Flexible
  faviconUrl: z.string().optional(),
  portalTitle: z.string().optional(),
  customCss: z.string().optional(),
});

router.patch('/me/branding', asyncHandler(async (req, res) => {
  const data = brandingSchema.parse(req.body);
  const { prisma } = await import('../../lib/prisma');
  
  const branding = await prisma.companyBranding.upsert({
    where: { companyId: req.companyId! },
    create: { companyId: req.companyId!, ...data },
    update: data,
  });
  
  return sendSuccess(res, branding, 'Branding actualizado');
}));

export default router;
