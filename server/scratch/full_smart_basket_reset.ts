import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';
import { SmartBasketService } from '../src/modules/portal/smartBasket.service';

const prisma = new PrismaClient();

async function run() {
  const customerId = 'cmns6wnlj020fzamegr6qzbmv';
  const companyId = 'cmns63vz20000uvtjoxo96qy2';
  const userId = 'cmnsdw1vq000314augomqawmw';

  console.log('--- RESETTING SMART BASKET DATA ---');
  
  // 1. Clean up
  await prisma.orderItem.deleteMany({ where: { order: { number: { startsWith: 'TEST-ORD-' } } } });
  await prisma.order.deleteMany({ where: { number: { startsWith: 'TEST-ORD-' } } });
  await prisma.smartBasketSuggestion.deleteMany({ where: { customerId } });

  // 2. Get Products and Ensure Stock
  const products = await prisma.product.findMany({ where: { companyId }, take: 4 });
  await prisma.product.updateMany({
    where: { id: { in: products.map(p => p.id) } },
    data: { stock: 50 }
  });
  
  // 3. Create historical orders
  console.log('Generating 10 historical orders...');
  for (let i = 0; i < 10; i++) {
    const daysAgo = (i + 1) * 10; // 10, 20, 30... 100 days ago
    const orderDate = subDays(new Date(), daysAgo);

    await prisma.order.create({
      data: {
        number: `TEST-ORD-${1000 + i}`,
        companyId,
        customerId,
        submittedById: userId,
        status: 'DELIVERED',
        date: orderDate,
        currency: 'DOP',
        total: 80,
        items: {
          create: products.map(p => ({
            productId: p.id,
            sku: p.sku,
            name: p.name,
            quantity: 2,
            unitPrice: 10,
            total: 20
          }))
        }
      }
    });
  }

  // 4. Update Config
  console.log('Updating config...');
  await prisma.smartBasketConfig.update({
    where: { companyId },
    data: { minScore: 50, isActive: true }
  });

  // 5. Run Calculation
  console.log('Running calculation...');
  await SmartBasketService.calculateForAll(companyId);

  // 6. Verify
  const count = await prisma.smartBasketSuggestion.count({ where: { customerId } });
  console.log(`--- DONE ---`);
  console.log(`Suggestions generated for customer: ${count}`);
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
