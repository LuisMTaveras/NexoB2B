import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendSuccess, sendNotFound, sendError } from '../../utils/apiResponse';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { 
      page = '1', 
      limit = '24', // Default to 24 for a nice grid
      search = '',
      status = 'all' // all, visible, hidden
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build the query
    const where: any = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
        { category: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (status === 'visible') where.isVisible = true;
    if (status === 'hidden') where.isVisible = false;

    // Execute concurrently
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          priceSnapshots: true // Include prices
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      success: true,
      data: products,
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });

  } catch (error) {
    next(error);
  }
};

export const updateProductVisibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const { isVisible } = req.body;

    if (typeof isVisible !== 'boolean') {
      return sendError(res, 'isVisible debe ser un valor booleano', 400);
    }

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product || product.companyId !== companyId) {
      return sendNotFound(res, 'Producto no encontrado');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isVisible }
    });

    sendSuccess(res, updated, 'Visibilidad de producto actualizada');
  } catch (error) {
    next(error);
  }
};
