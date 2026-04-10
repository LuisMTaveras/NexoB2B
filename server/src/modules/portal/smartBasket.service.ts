import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Decimal } from '@prisma/client/runtime/library';

export interface SmartBasketConfig {
  historyWindow: number; // in days
  minScore: number;
}

export class SmartBasketService {
  /**
   * Calculates recommendations for all active customers of a company
   */
  static async calculateForAll(companyId: string) {
    const config = await prisma.smartBasketConfig.findUnique({
      where: { companyId }
    });

    if (!config || !config.isActive) {
      logger.info(`Smart Basket is disabled for company ${companyId}`);
      return;
    }

    // Update status to RUNNING
    await prisma.smartBasketConfig.update({
      where: { companyId },
      data: { 
        lastRunAt: new Date(),
        lastRunStatus: 'RUNNING' 
      }
    });

    try {
      const customers = await prisma.customer.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true }
      });

      let processedCount = 0;
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 18);

      for (const customer of customers) {
        const recommendations = await this.calculateForCustomer(customer.id, {
          historyWindow: config.historyWindow,
          minScore: config.minScore
        });

        // Clear old suggestions
        await prisma.smartBasketSuggestion.deleteMany({
          where: { customerId: customer.id }
        });

        // Create new ones (capped at 30 as per requirements)
        if (recommendations.length > 0) {
          const top30 = recommendations.slice(0, 30);
          await prisma.smartBasketSuggestion.createMany({
            data: top30.map(rec => ({
              customerId: customer.id,
              productId: rec.productId,
              smartScore: rec.score,
              suggestedQuantity: rec.suggestedQuantity,
              urgency: rec.urgency,
              patternText: rec.patternText,
              lastPurchaseDate: rec.lastPurchaseDate,
              averageInterval: rec.averageInterval,
              expiresAt: expirationDate
            }))
          });
          processedCount++;
        }
      }

      // Update status to SUCCESS
      await prisma.smartBasketConfig.update({
        where: { companyId },
        data: { 
          lastRunStatus: 'SUCCESS',
          processedCount,
          // nextRunAt should be updated by the scheduler
        }
      });

      logger.info(`Smart Basket job completed for company ${companyId}. Processed ${processedCount} customers.`);
    } catch (error: any) {
      logger.error(`Smart Basket job failed for company ${companyId}`, { error: error.message });
      await prisma.smartBasketConfig.update({
        where: { companyId },
        data: { 
          lastRunStatus: 'FAILED',
          lastRunError: error.message
        }
      });
    }
  }

  /**
   * core algorithm for a single customer
   */
  static async calculateForCustomer(customerId: string, options: SmartBasketConfig) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - options.historyWindow);

    // Get all items from DELIVERED orders in the window
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          customerId,
          status: 'DELIVERED',
          date: { gte: cutoffDate }
        },
        productId: { not: null }
      },
      include: {
        order: {
          select: { date: true }
        }
      },
      orderBy: {
        order: { date: 'desc' }
      }
    });

    if (orderItems.length === 0) return [];

    // Group items by product
    const productGroups = new Map<string, any[]>();
    for (const item of orderItems) {
      if (!item.productId) continue;
      if (!productGroups.has(item.productId)) {
        productGroups.set(item.productId, []);
      }
      productGroups.get(item.productId)!.push(item);
    }

    const suggestions = [];
    const now = new Date();

    for (const [productId, items] of productGroups.entries()) {
      // Must have at least 2 compras
      if (items.length < 2) continue;

      // Dates of all unique orders (one per day max or just all?)
      // Actually usually it's better to group by order date
      const purchaseDates = items.map(i => i.order.date.getTime()).sort((a, b) => a - b);
      
      // Calculate intervals in days
      const intervals = [];
      for (let i = 1; i < purchaseDates.length; i++) {
        const diff = (purchaseDates[i] - purchaseDates[i-1]) / (1000 * 60 * 60 * 24);
        if (diff > 0.5) { // minimal half day to count as separate purchase
          intervals.push(diff);
        }
      }

      if (intervals.length === 0) continue;

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const lastPurchaseDate = new Date(purchaseDates[purchaseDates.length - 1]);
      const daysSinceLast = (now.getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24);

      // 1. Urgency (60%)
      // If we are at the expected date, urgency is 100%. 
      // If we are past the date, urgency stays high or increases.
      let urgencyScore = daysSinceLast / avgInterval;
      // Cap normalized urgency at 1.0 for the score
      const urgencyNormalized = Math.min(urgencyScore, 1.2) / 1.2;

      // 2. Consistency (40%)
      // Use Coefficient of Variation (CV) = stdDev / mean
      const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const cv = avgInterval > 0 ? stdDev / avgInterval : 1;
      
      // Consistency normalized: lower CV is better. 
      // CV 0 -> 1.0 (perfectly consistent)
      // CV 1+ -> 0.0 (erratic)
      const consistencyNormalized = Math.max(0, 1 - cv);

      const finalScore = Math.round((urgencyNormalized * 0.6 + consistencyNormalized * 0.4) * 100);

      if (finalScore >= options.minScore) {
        // Average quantity of last 5 purchases
        const last5 = items.slice(0, 5);
        const avgQty = last5.reduce((a, b) => a + Number(b.quantity), 0) / last5.length;

        // Determine urgency label
        let urgencyLabel: 'vencido' | 'proximo' | 'sugerido' = 'sugerido';
        if (urgencyScore >= 1.0) urgencyLabel = 'vencido';
        else if (urgencyScore >= 0.8) urgencyLabel = 'proximo';

        // Pattern text
        const patternText = `${Math.round(avgInterval)} días`;
        const lastDays = Math.round(daysSinceLast);
        const lastText = lastDays === 0 ? 'Hoy' : `Hace ${lastDays} días`;

        suggestions.push({
          productId,
          score: finalScore,
          suggestedQuantity: Math.ceil(avgQty),
          urgency: urgencyLabel,
          patternText: `Cada ${patternText}`,
          lastPurchaseDate,
          averageInterval: avgInterval
        });
      }
    }

    // Sort by score descending
    return suggestions.sort((a, b) => b.score - a.score);
  }

  static async getBasket(customerId: string) {
    const suggestions = await prisma.smartBasketSuggestion.findMany({
      where: { 
        customerId,
        expiresAt: { gt: new Date() }
      },
      include: {
        product: {
          include: {
            priceSnapshots: true
          }
        }
      },
      orderBy: { smartScore: 'desc' },
      take: 30
    });

    return suggestions;
  }
}
