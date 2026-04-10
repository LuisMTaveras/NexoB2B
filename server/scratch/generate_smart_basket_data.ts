import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function run() {
  const customerId = 'cmns6wnlj020fzamegr6qzbmv';
  const companyId = 'cmns63vz20000uvtjoxo96qy2';
  const userId = 'cmnsdw1vq000314augomqawmw';

  console.log('Cleaning old test orders...');
  await prisma.orderItem.deleteMany({ where: { order: { number: { startsWith: 'TEST-ORD-' } } } });
  await prisma.order.deleteMany({ where: { number: { startsWith: 'TEST-ORD-' } } });

  const products = await prisma.product.findMany({
    where: { companyId },
    take: 3
  });

  if (products.length === 0) {
    console.error('No products found for company');
    return;
  }

  console.log('Generating 10 historical orders (one every 10 days)...');
  
  for (let i = 0; i < 10; i++) {
    // We want the last one to be 10 days ago.
    // i=0 -> 10 days ago
    // i=1 -> 20 days ago
    const daysAgo = (i + 1) * 10;
    const orderDate = subDays(new Date(), daysAgo);

    const order = await prisma.order.create({
      data: {
        number: `TEST-ORD-${1000 + i}`,
        companyId,
        customerId,
        submittedById: userId,
        status: 'DELIVERED',
        date: orderDate,
        currency: 'DOP',
        total: 0,
        items: {
          create: products.map(p => ({
            companyId,
            productId: p.id,
            sku: p.sku,
            name: p.name,
            quantity: 2,
            price: 10,
            total: 20
          }))
        }
      }
    });
    
    // Update total
    await prisma.order.update({
      where: { id: order.id },
      data: { total: products.length * 20 }
    });

    console.log(`Created ${order.number} for ${orderDate.toISOString()}`);
  }

  console.log('Success: 10 test orders generated.');
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
